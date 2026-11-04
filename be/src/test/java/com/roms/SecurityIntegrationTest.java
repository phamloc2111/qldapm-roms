package com.roms;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.roms.auth.Role;
import com.roms.auth.StompSecurity;
import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.time.Instant;
import java.util.Base64;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class SecurityIntegrationTest extends AuthTestBase {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired SimpMessagingTemplate messaging;
        @Autowired StompSecurity stompSecurity;
        @Autowired JdbcTemplate jdbc;
    @LocalServerPort int port;

        private final List<UUID> createdUserIds = new ArrayList<>();
        private final List<String> createdUserNames = new ArrayList<>();
        private UUID bootstrapUserId;

        @BeforeEach
        void rememberBootstrapUser() {
                bootstrapUserId = jdbc.queryForObject("SELECT id FROM app_users WHERE username = ?", UUID.class, "test-admin");
                assertNotNull(bootstrapUserId);
        }

        @AfterEach
        void removeCreatedUsers() {
                // Names are registered before the request, so even a failed response assertion is cleaned up.
                for (String username : createdUserNames) {
                        createdUserIds.addAll(jdbc.queryForList("SELECT id FROM app_users WHERE username = ? AND username <> ?",
                                        UUID.class, username, "test-admin"));
                }
                for (UUID id : createdUserIds) {
                            jdbc.update("DELETE FROM app_users WHERE id = ? AND id <> ? AND username <> ?", id, bootstrapUserId, "test-admin");
                }
        }

    private String login(String username, String password) throws Exception {
        String result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Login(username, password))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.expiresIn").value(28800))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(result).get("accessToken").asText();
    }
    private record Login(String username, String password) { }
        private String admin() throws Exception { return login("test-admin", BOOTSTRAP_PASSWORD); }
    private String bearer(String token) { return "Bearer " + token; }
        private void trackNewUsername(String username) {
                String normalized = username.toLowerCase(java.util.Locale.ROOT);
                assertNotEquals("test-admin", normalized);
                assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM app_users WHERE username = ?", Integer.class, normalized));
                createdUserNames.add(normalized);
        }
    private JsonNode create(String admin, String username, String role) throws Exception {
                trackNewUsername(username);
        String body = "{\"username\":\"" + username + "\",\"password\":\"password-for-test\",\"role\":\"" + role + "\"}";
                var result = mvc.perform(post("/api/v1/users").header("Authorization", bearer(admin))
                                .contentType(MediaType.APPLICATION_JSON).content(body)).andReturn().getResponse();
                if (result.getStatus() == 201) {
                        JsonNode user = json.readTree(result.getContentAsString());
                        createdUserIds.add(UUID.fromString(user.get("id").asText()));
                        return user;
                }
                fail("User creation failed: " + result.getStatus() + " " + result.getContentAsString());
                return null;
    }
    private String name() { return "u" + UUID.randomUUID().toString().replace("-", ""); }

    private String tokenFor(Role role, String admin) throws Exception {
        if (role == Role.ADMIN) return admin;
        String username = name();
        create(admin, username, role.name());
        return login(username, "password-for-test");
    }

    private record Route(HttpMethod method, String path, int allowedStatus, Set<Role> roles) { }

    @ParameterizedTest
    @EnumSource(Role.class)
    void restAuthorizationMatrix(Role role) throws Exception {
        String token = tokenFor(role, admin());
        String id = UUID.randomUUID().toString();
        Set<Role> waiter = Set.of(Role.WAITER, Role.ADMIN);
        Set<Role> menu = Set.of(Role.WAITER, Role.KITCHEN, Role.ADMIN);
        Set<Role> kitchen = Set.of(Role.KITCHEN, Role.ADMIN);
        Set<Role> cashier = Set.of(Role.CASHIER, Role.ADMIN);
        Set<Role> admins = Set.of(Role.ADMIN);
        Set<Role> allRoles = Set.of(Role.WAITER, Role.KITCHEN, Role.CASHIER, Role.ADMIN);
        Set<Role> waiterKitchenAdmin = Set.of(Role.WAITER, Role.KITCHEN, Role.ADMIN);
        // Invalid bodies and nonexistent IDs exercise authorization without modifying business data.
        List<Route> routes = List.of(
                new Route(HttpMethod.GET, "/auth/me", 200, allRoles),
                new Route(HttpMethod.GET, "/tables", 200, waiter),
                new Route(HttpMethod.GET, "/tables/" + id + "/current-order", 404, waiter),
                new Route(HttpMethod.GET, "/orders/" + id, 404, waiter),
                new Route(HttpMethod.GET, "/categories", 200, menu),
                new Route(HttpMethod.GET, "/menu-items", 200, menu),
                new Route(HttpMethod.POST, "/orders", 400, waiter),
                new Route(HttpMethod.POST, "/orders/" + id + "/items", 400, waiter),
                new Route(HttpMethod.POST, "/orders/" + id + "/request-payment", 404, waiter),
                new Route(HttpMethod.POST, "/order-items/" + id + "/serve", 404, waiter),
                new Route(HttpMethod.POST, "/order-items/" + id + "/cancel", 404, waiterKitchenAdmin),
                new Route(HttpMethod.GET, "/kitchen/queue", 200, kitchen),
                new Route(HttpMethod.POST, "/kitchen/order-items/" + id + "/start", 404, kitchen),
                new Route(HttpMethod.POST, "/kitchen/order-items/" + id + "/done", 404, kitchen),
                new Route(HttpMethod.GET, "/cashier/payment-requests", 200, cashier),
                new Route(HttpMethod.GET, "/orders/" + id + "/invoice/preview", 404, cashier),
                new Route(HttpMethod.POST, "/orders/" + id + "/pay", 404, cashier),
                new Route(HttpMethod.GET, "/reports/revenue", 200, admins),
                new Route(HttpMethod.GET, "/reports/top-items", 200, admins),
                new Route(HttpMethod.POST, "/tables", 400, admins),
                new Route(HttpMethod.PATCH, "/tables/" + id, 400, admins),
                new Route(HttpMethod.DELETE, "/tables/" + id, 404, admins),
                new Route(HttpMethod.POST, "/categories", 400, admins),
                new Route(HttpMethod.PATCH, "/categories/" + id, 400, admins),
                new Route(HttpMethod.DELETE, "/categories/" + id, 404, admins),
                new Route(HttpMethod.POST, "/menu-items", 400, admins),
                new Route(HttpMethod.PATCH, "/menu-items/" + id, 400, admins),
                new Route(HttpMethod.PATCH, "/menu-items/" + id + "/availability", 400, kitchen),
                new Route(HttpMethod.DELETE, "/menu-items/" + id, 404, admins),
                new Route(HttpMethod.GET, "/users", 200, admins),
                new Route(HttpMethod.POST, "/users", 400, admins),
                new Route(HttpMethod.PUT, "/users/" + id, 404, admins),
                new Route(HttpMethod.POST, "/users/" + id + "/reset-password", 404, admins));
        for (Route route : routes) {
            MockHttpServletRequestBuilder request = request(route.method(), "/api/v1" + route.path())
                    .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON);
            if (route.method() == HttpMethod.PUT) {
                request.content("{\"username\":\"nobody\",\"role\":\"WAITER\",\"active\":true}");
            } else if (route.path().endsWith("/reset-password")) {
                request.content("{\"password\":\"new-password-for-test\"}");
            } else {
                request.content("{}");
            }
            int actual = mvc.perform(request).andReturn().getResponse().getStatus();
            assertEquals(route.roles().contains(role) ? route.allowedStatus() : 403, actual,
                    role + " " + route.method() + " " + route.path());
        }
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"WAITER", "KITCHEN", "CASHIER"})
    void nonAdminsCannotMutateAccounts(Role role) throws Exception {
        String admin = admin(), token = tokenFor(role, admin), victim = name();
        String id = create(admin, victim, "WAITER").get("id").asText();
        String newUser = name();
        // Register the attempted name in case a regression unexpectedly creates the account.
        trackNewUsername(newUser);
        mvc.perform(post("/api/v1/users").header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + newUser + "\",\"password\":\"password-for-test\",\"role\":\"WAITER\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/users/" + id).header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + victim + "\",\"role\":\"KITCHEN\",\"active\":false}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/users/" + id + "/reset-password").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"new-password-for-test\"}"))
                .andExpect(status().isForbidden());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM app_users WHERE username = ?", Integer.class, newUser));
        String victimToken = login(victim, "password-for-test");
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(victimToken))).andExpect(status().isOk());
    }

    @Test
    void anonymousInvalidCredentialsAndAccountLockUnlock() throws Exception {
        mvc.perform(get("/api/v1/users")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        for (Login invalid : List.of(new Login(name(), "password-for-test"), new Login("test-admin", "incorrect-password"))) {
            mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(invalid))).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        String admin = admin(), username = name();
        String id = create(admin, username, "WAITER").get("id").asText();
        String originalToken = login(username, "password-for-test");
        for (boolean active : new boolean[]{false, true}) {
            mvc.perform(put("/api/v1/users/" + id).header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"" + username + "\",\"role\":\"WAITER\",\"active\":" + active + "}"))
                    .andExpect(status().isOk());
            mvc.perform(get("/api/v1/tables").header("Authorization", bearer(originalToken))).andExpect(status().isUnauthorized());
            if (!active) {
                mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new Login(username, "password-for-test")))).andExpect(status().isUnauthorized());
            }
        }
        String unlockedToken = login(username, "password-for-test");
        mvc.perform(post("/api/v1/users/" + id + "/reset-password").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"new-password-for-test\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(unlockedToken))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Login(username, "password-for-test")))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(login(username, "new-password-for-test"))))
                .andExpect(status().isOk());
    }

    @Test
    void publicEndpointsAndRoleAllowlist() throws Exception {
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/tables")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"test-admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        String admin = admin();
        String waiterName = name(), kitchenName = name(), cashierName = name();
        create(admin, waiterName, "WAITER"); create(admin, kitchenName, "KITCHEN"); create(admin, cashierName, "CASHIER");
        String waiter = login(waiterName, "password-for-test");
        String kitchen = login(kitchenName, "password-for-test");
        String cashier = login(cashierName, "password-for-test");
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(waiter))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/kitchen/queue").header("Authorization", bearer(waiter))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/kitchen/queue").header("Authorization", bearer(kitchen))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/menu-items").header("Authorization", bearer(kitchen))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(kitchen))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/cashier/payment-requests").header("Authorization", bearer(cashier))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/users").header("Authorization", bearer(cashier))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/users").header("Authorization", bearer(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/unknown").header("Authorization", bearer(admin))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/orders/" + UUID.randomUUID() + "/pay").header("Authorization", bearer(waiter))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/kitchen/order-items/" + UUID.randomUUID() + "/done").header("Authorization", bearer(cashier))).andExpect(status().isForbidden());
    }

    @Test
    void accountChangesInvalidateTokensAndProtectLastAdmin() throws Exception {
        String admin = admin();
        String username = name();
        JsonNode user = create(admin, username, "WAITER");
        String id = user.get("id").asText();
        String token = login(username, "password-for-test");
        mvc.perform(post("/api/v1/users/" + id + "/reset-password").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"another-test-password\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(token))).andExpect(status().isUnauthorized());
        token = login(username, "another-test-password");
        mvc.perform(put("/api/v1/users/" + id).header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"role\":\"KITCHEN\",\"active\":true}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(token))).andExpect(status().isUnauthorized());
        token = login(username, "another-test-password");
        mvc.perform(put("/api/v1/users/" + id).header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"role\":\"KITCHEN\",\"active\":false}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/kitchen/queue").header("Authorization", bearer(token))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Login(username, "another-test-password")))).andExpect(status().isUnauthorized());
        JsonNode all = json.readTree(mvc.perform(get("/api/v1/users").header("Authorization", bearer(admin)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        JsonNode adminUser = null;
        for (JsonNode entry : all) if (entry.get("username").asText().equals("test-admin")) adminUser = entry.get("id");
        assertNotNull(adminUser);
        mvc.perform(put("/api/v1/users/" + adminUser.asText()).header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"test-admin\",\"role\":\"WAITER\",\"active\":false}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/users").header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"TEST-ADMIN\",\"password\":\"password-for-test\",\"role\":\"WAITER\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/users").header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"bad user\",\"password\":\"short\",\"role\":\"WAITER\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsForgedExpiredAndIncompleteTokens() throws Exception {
        String admin = admin();
        String username = name();
        String id = create(admin, username, "ADMIN").get("id").asText();
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(admin + "x"))).andExpect(status().isUnauthorized());
        byte[] key = Base64.getDecoder().decode(JWT_SECRET);
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(key, "HmacSHA256")));
        Instant now = Instant.now();
        JwtClaimsSet expired = JwtClaimsSet.builder().issuer("roms-api").subject(id)
                .issuedAt(now.minusSeconds(100)).expiresAt(now.minusSeconds(1)).claim("role", "ADMIN").claim("ver", 0).build();
        JwtClaimsSet missingExpiry = JwtClaimsSet.builder().issuer("roms-api").subject(id)
                .issuedAt(now).claim("role", "ADMIN").claim("ver", 0).build();
        JwtClaimsSet valid = JwtClaimsSet.builder().issuer("roms-api").subject(id)
                .issuedAt(now.minusSeconds(100)).expiresAt(now.plusSeconds(60)).claim("role", "ADMIN").claim("ver", 0).build();
        String validToken = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), valid)).getTokenValue();
        mvc.perform(get("/api/v1/tables").header("Authorization", bearer(validToken))).andExpect(status().isOk());
        for (JwtClaimsSet claims : new JwtClaimsSet[]{expired, missingExpiry}) {
            String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
            mvc.perform(get("/api/v1/tables").header("Authorization", bearer(token))).andExpect(status().isUnauthorized());
        }
    }

        @ParameterizedTest
        @EnumSource(Role.class)
        void stompSubscriptionAndSendMatrix(Role role) throws Exception {
                String token = tokenFor(role, admin());
                ChannelInterceptor inbound = stompSecurity.inbound();
                String session = UUID.randomUUID().toString();
                String orderTopic = "/topic/orders/" + UUID.randomUUID();
                List<String> destinations = List.of("/topic/tables", "/topic/menu", "/topic/kitchen", "/topic/cashier", orderTopic,
                                "/topic/orders/not-a-uuid", "/topic/**", "/topic/kitchen/extra", "/topic/unknown");
                Set<String> allowed = switch (role) {
                        case ADMIN -> Set.of("/topic/tables", "/topic/menu", "/topic/kitchen", "/topic/cashier", orderTopic);
                        case WAITER -> Set.of("/topic/tables", "/topic/menu", orderTopic);
                        case KITCHEN -> Set.of("/topic/kitchen", "/topic/menu");
                        case CASHIER -> Set.of("/topic/cashier");
                };
                try {
                        assertNotNull(inbound.preSend(frame(StompCommand.CONNECT, session, null, bearer(token)), null));
                        for (String destination : destinations) {
                                if (allowed.contains(destination)) {
                                        assertNotNull(inbound.preSend(frame(StompCommand.SUBSCRIBE, session, destination, null), null), role + " " + destination);
                                } else {
                                        assertThrows(AccessDeniedException.class,
                                                        () -> inbound.preSend(frame(StompCommand.SUBSCRIBE, session, destination, null), null), role + " " + destination);
                                }
                        }
                        for (String destination : List.of("/topic/menu", "/topic/cashier", "/app/anything")) {
                                assertThrows(AccessDeniedException.class,
                                                () -> inbound.preSend(frame(StompCommand.SEND, session, destination, null), null), role + " " + destination);
                        }
                } finally {
                        inbound.preSend(frame(StompCommand.DISCONNECT, session, null, null), null);
                }
        }

        @Test
        void websocketRejectsMissingAndInvalidConnectCredentials() throws Exception {
                String admin = admin(), username = name();
                String id = create(admin, username, "WAITER").get("id").asText();
                String revoked = login(username, "password-for-test");
                JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(Base64.getDecoder().decode(JWT_SECRET), "HmacSHA256")));
                Instant now = Instant.now();
                JwtClaimsSet claims = JwtClaimsSet.builder().issuer("roms-api").subject(id).issuedAt(now.minusSeconds(100))
                        .expiresAt(now.minusSeconds(1)).claim("role", "WAITER").claim("ver", 1).build();
                String expired = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
                mvc.perform(post("/api/v1/users/" + id + "/reset-password").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"new-password-for-test\"}"))
                        .andExpect(status().isNoContent());
                String current = login(username, "new-password-for-test");
                for (String authorization : List.of("", "Authorization:Bearer invalid-token\n", "Authorization:Basic invalid\n",
                        "Authorization:Bearer " + expired + "\n", "Authorization:Bearer " + revoked + "\n",
                        "Authorization:Bearer " + current + "\nAuthorization:Bearer " + current + "\n")) {
                        try (RawStomp connection = new RawStomp()) {
                                connection.send("CONNECT\naccept-version:1.2\nhost:localhost\n" + authorization + "\n\0");
                                connection.assertRejected();
                        }
                }
        }

        @ParameterizedTest
        @EnumSource(Role.class)
        void websocketEnforcesSubscriptionsAndClientSend(Role role) throws Exception {
                String token = tokenFor(role, admin());
                String allowed = switch (role) {
                        case ADMIN, WAITER -> "/topic/tables";
                        case KITCHEN -> "/topic/kitchen";
                        case CASHIER -> "/topic/cashier";
                };
                String forbidden = role == Role.ADMIN ? "/topic/unknown" :
                                role == Role.CASHIER ? "/topic/tables" : "/topic/cashier";
                try (RawStomp connection = new RawStomp()) {
                        connection.connect(token);
                        connection.send("SUBSCRIBE\nid:sub-1\ndestination:" + allowed + "\n\n\0");
                        // Retry publication until asynchronous subscription registration is complete.
                        String message = null;
                        for (int i = 0; i < 20 && message == null; i++) {
                                messaging.convertAndSend(allowed, "role-test");
                                message = connection.frames.poll(150, TimeUnit.MILLISECONDS);
                        }
                        assertNotNull(message, "No authorized message received for " + role);
                        assertTrue(message.startsWith("MESSAGE\n"), message);
                        assertTrue(message.contains("role-test"), message);
                }
                try (RawStomp connection = new RawStomp()) {
                        connection.connect(token);
                        connection.send("SUBSCRIBE\nid:sub-2\ndestination:" + forbidden + "\n\n\0");
                        connection.assertRejected();
                }
                try (RawStomp connection = new RawStomp()) {
                        connection.connect(token);
                        connection.send("SEND\ndestination:" + allowed + "\n\nforbidden\0");
                        connection.assertRejected();
                }
        }

        private final class RawStomp implements AutoCloseable, WebSocket.Listener {
                final BlockingQueue<String> frames = new LinkedBlockingQueue<>();
                final StringBuilder partial = new StringBuilder();
                final WebSocket socket;

                RawStomp() throws Exception {
                        socket = HttpClient.newHttpClient().newWebSocketBuilder()
                                        .buildAsync(URI.create("ws://localhost:" + port + "/ws"), this).get(5, TimeUnit.SECONDS);
                }

                void connect(String token) throws Exception {
                        send("CONNECT\naccept-version:1.2\nhost:localhost\nAuthorization:" + bearer(token) + "\n\n\0");
                        String frame = frames.poll(5, TimeUnit.SECONDS);
                        assertNotNull(frame, "No CONNECTED frame");
                        assertTrue(frame.startsWith("CONNECTED\n"), frame);
                }

                void send(String frame) throws Exception { socket.sendText(frame, true).get(5, TimeUnit.SECONDS); }

                void assertRejected() throws Exception {
                        String frame = frames.poll(5, TimeUnit.SECONDS);
                        assertNotNull(frame, "No STOMP error or connection close");
                        assertTrue(frame.startsWith("ERROR\n") || frame.startsWith("CLOSED:"), frame);
                }

                @Override public void onOpen(WebSocket webSocket) { webSocket.request(1); }
                @Override public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                        partial.append(data);
                        if (last) { frames.add(partial.toString()); partial.setLength(0); }
                        webSocket.request(1);
                        return null;
                }
                @Override public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
                        frames.add("CLOSED:" + statusCode);
                        return null;
                }
                @Override public void onError(WebSocket webSocket, Throwable error) { frames.add("ERROR:" + error); }
                @Override public void close() { socket.abort(); }
        }

    @Test
    void websocketDeliversAuthorizedMessagesAndStopsAfterReset() throws Exception {
        String admin = admin(), username = name();
        String id = create(admin, username, "WAITER").get("id").asText();
        String token = login(username, "password-for-test");
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        client.setMessageConverter(new StringMessageConverter());
        StompHeaders connect = new StompHeaders(); connect.add("Authorization", bearer(token));
        StompSession session = null;
        try {
        session = client.connectAsync("ws://localhost:" + port + "/ws", new org.springframework.web.socket.WebSocketHttpHeaders(), connect,
                new StompSessionHandlerAdapter() { }).get(5, TimeUnit.SECONDS);
        BlockingQueue<String> received = new LinkedBlockingQueue<>();
        session.subscribe("/topic/tables", new StompFrameHandler() {
            public Type getPayloadType(StompHeaders headers) { return String.class; }
            public void handleFrame(StompHeaders headers, Object payload) { received.add((String) payload); }
        });
        // Subscription processing is asynchronous; retry until the first delivery establishes it.
        for (int i = 0; i < 10 && received.isEmpty(); i++) {
            messaging.convertAndSend("/topic/tables", "before");
            Thread.sleep(100);
        }
        assertNotNull(received.poll(2, TimeUnit.SECONDS));
        received.clear();
        mvc.perform(post("/api/v1/users/" + id + "/reset-password").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"another-test-password\"}"))
                .andExpect(status().isNoContent());
        messaging.convertAndSend("/topic/tables", "after");
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(1);
        while (System.nanoTime() < deadline) {
            String message = received.poll(Math.max(1, deadline - System.nanoTime()), TimeUnit.NANOSECONDS);
            assertNotEquals("after", message, "A revoked session received a new message");
        }
                } finally {
                        if (session != null && session.isConnected()) session.disconnect();
                        client.stop();
                }
    }

        @Test
        void stompRejectsUnauthorizedSubscriptionsAndAllClientSends() throws Exception {
                String admin = admin(), username = name();
                String id = create(admin, username, "KITCHEN").get("id").asText();
                String token = login(username, "password-for-test");
                ChannelInterceptor inbound = stompSecurity.inbound(), outbound = stompSecurity.outbound();
                String session = UUID.randomUUID().toString();
                try {
                assertThrows(AccessDeniedException.class, () -> inbound.preSend(frame(StompCommand.CONNECT, "no-auth", null, null), null));
                assertNotNull(inbound.preSend(frame(StompCommand.CONNECT, session, null, bearer(token)), null));
                assertNotNull(inbound.preSend(frame(StompCommand.SUBSCRIBE, session, "/topic/kitchen", null), null));
                for (String destination : new String[]{"/topic/cashier", "/topic/tables", "/topic/unknown", "/topic/**", "/topic/kitchen/extra"}) {
                        assertThrows(AccessDeniedException.class, () -> inbound.preSend(frame(StompCommand.SUBSCRIBE, session, destination, null), null));
                }
                for (String destination : new String[]{"/topic/kitchen", "/app/anything"}) {
                        assertThrows(AccessDeniedException.class, () -> inbound.preSend(frame(StompCommand.SEND, session, destination, null), null));
                }
                SimpMessageHeaderAccessor output = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
                output.setSessionId(session); output.setDestination("/topic/kitchen");
                Message<?> delivery = MessageBuilder.createMessage(new byte[0], output.getMessageHeaders());
                assertNotNull(outbound.preSend(delivery, null));
                mvc.perform(put("/api/v1/users/" + id).header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                                .content("{\"username\":\"" + username + "\",\"role\":\"KITCHEN\",\"active\":false}"))
                                .andExpect(status().isOk());
                assertNull(outbound.preSend(delivery, null));
                assertNotNull(inbound.preSend(frame(StompCommand.DISCONNECT, session, null, null), null));
                assertNotNull(inbound.preSend(frame(StompCommand.DISCONNECT, session, null, null), null));
                } finally {
                        inbound.preSend(frame(StompCommand.DISCONNECT, session, null, null), null);
                }
        }

        private Message<byte[]> frame(StompCommand command, String session, String destination, String authorization) {
                StompHeaderAccessor headers = StompHeaderAccessor.create(command);
                headers.setSessionId(session);
                if (destination != null) headers.setDestination(destination);
                if (authorization != null) headers.addNativeHeader("Authorization", authorization);
                headers.setLeaveMutable(true);
                return MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
        }
}