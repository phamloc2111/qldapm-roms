package com.roms;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(roles = "ADMIN")
class BusinessFlowTest extends AuthTestBase {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    String categoryId, itemId, tableId;

    JsonNode postJson(String url, String body) throws Exception {
        return json.readTree(mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    @BeforeEach
    void setup() throws Exception {
        categoryId = postJson("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        itemId = postJson("/api/v1/menu-items", """
                {"categoryId":"%s","name":"Soup","priceVnd":12501}
                """.formatted(categoryId)).get("id").asText();
        tableId = postJson("/api/v1/tables", "{\"name\":\"T1\",\"capacity\":4}").get("id").asText();
    }

    JsonNode order(String items) throws Exception {
        return postJson("/api/v1/orders", """
                {"tableId":"%s","items":%s}
                """.formatted(tableId, items));
    }

    String item(int quantity) {
        return "[{\"menuItemId\":\"%s\",\"quantity\":%d}]".formatted(itemId, quantity);
    }

    void action(String endpoint, String id) throws Exception {
        mvc.perform(post(endpoint, id)).andExpect(status().isOk());
    }

    JsonNode servedOrder(int quantity) throws Exception {
        JsonNode order = order(item(quantity));
        String id = order.get("items").get(0).get("id").asText();
        action("/api/v1/kitchen/order-items/{id}/start", id);
        action("/api/v1/kitchen/order-items/{id}/done", id);
        action("/api/v1/order-items/{id}/serve", id);
        return order;
    }

    @Test
    void outOfStockCannotBeOrderedAndIsFiltered() throws Exception {
        mvc.perform(patch("/api/v1/menu-items/{id}/availability", itemId)
                .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/menu-items").param("availableOnly", "true"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, item(1))))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/tables")).andExpect(jsonPath("$[0].status").value("AVAILABLE"));
    }

    @Test
    void rejectsAnotherActiveOrderForSameTable() throws Exception {
        order(item(1));
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, item(1))))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidOrderInputIsRejected() throws Exception {
        for (String items : new String[]{"[]", item(0), "[null]"}) {
            mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, items)))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/v1/orders/{id}", UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void invalidStatusTransitionsAreRejected() throws Exception {
        JsonNode order = order(item(1));
        String id = order.get("items").get(0).get("id").asText();
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/done", id)).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/order-items/{id}/serve", id)).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/orders/{id}/request-payment", order.get("id").asText()))
                .andExpect(status().isConflict());
        action("/api/v1/kitchen/order-items/{id}/start", id);
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/start", id)).andExpect(status().isConflict());
    }

    @Test
    void tableIsReadyWhenAnyItemIsDone() throws Exception {
        JsonNode order = order("[{\"menuItemId\":\"%s\",\"quantity\":1},{\"menuItemId\":\"%s\",\"quantity\":1}]".formatted(itemId, itemId));
        String first = order.get("items").get(0).get("id").asText();
        action("/api/v1/kitchen/order-items/{id}/start", first);
        action("/api/v1/kitchen/order-items/{id}/done", first);
        mvc.perform(get("/api/v1/tables")).andExpect(jsonPath("$[0].status").value("READY_TO_SERVE"));
        action("/api/v1/order-items/{id}/serve", first);
        mvc.perform(get("/api/v1/tables")).andExpect(jsonPath("$[0].status").value("OCCUPIED"));
    }

    @Test
    void activeTableCannotBeDeleted() throws Exception {
        order(item(1));
        mvc.perform(delete("/api/v1/tables/{id}", tableId)).andExpect(status().isConflict());
    }

    @Test
    void menuMutationsRequireRequiredFieldsAndValidSizes() throws Exception {
        mvc.perform(patch("/api/v1/menu-items/{id}/availability", itemId)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\":\"%s\",\"name\":\"New\"}".formatted(categoryId)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("name", "x".repeat(81)))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invoiceUsesHistoricalPriceAndRoundsVat() throws Exception {
        JsonNode order = servedOrder(3);
        String id = order.get("id").asText();
        mvc.perform(patch("/api/v1/menu-items/{id}", itemId).contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\":\"%s\",\"name\":\"Soup changed\",\"priceVnd\":99999}".formatted(categoryId)))
                .andExpect(status().isOk());
        action("/api/v1/orders/{id}/request-payment", id);
        mvc.perform(get("/api/v1/orders/{id}/invoice/preview", id).param("discountVnd", "1000"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.subtotalVnd").value(37503))
                .andExpect(jsonPath("$.vatVnd").value(2920)).andExpect(jsonPath("$.totalVnd").value(39423));
        mvc.perform(get("/api/v1/orders/{id}/invoice/preview", id).param("discountVnd", "37504"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void paymentIsNotAcceptedTwice() throws Exception {
        String id = servedOrder(1).get("id").asText();
        action("/api/v1/orders/{id}/request-payment", id);
        String body = "{\"discountVnd\":0,\"method\":\"CASH\"}";
        mvc.perform(post("/api/v1/orders/{id}/pay", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/orders/{id}/pay", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void deactivatedCategoryCannotExposeItemsOrBeOrdered() throws Exception {
        mvc.perform(delete("/api/v1/categories/{id}", categoryId)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/menu-items")).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, item(1))))
                .andExpect(status().isNotFound());
    }

            @Test
            void unknownMenuItemDoesNotCreateOrderOrOccupyTable() throws Exception {
            String items = "[{\"menuItemId\":\"%s\",\"quantity\":1},{\"menuItemId\":\"%s\",\"quantity\":1}]"
                .formatted(itemId, UUID.randomUUID());
            mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, items)))
                .andExpect(status().isNotFound());
            mvc.perform(get("/api/v1/kitchen/queue")).andExpect(jsonPath("$", hasSize(0)));
            mvc.perform(get("/api/v1/tables")).andExpect(jsonPath("$[0].status").value("AVAILABLE"));
            }

            @Test
            void rejectOverlongNoteAndNegativePrice() throws Exception {
            String items = json.writeValueAsString(java.util.List.of(java.util.Map.of(
                "menuItemId", itemId, "quantity", 1, "note", "x".repeat(301))));
            mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, items)))
                .andExpect(status().isBadRequest());
            mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":-1}".formatted(categoryId)))
                .andExpect(status().isBadRequest());
            }

            @Test
            void cashierReceivesOnlyPaymentRequestedOrders() throws Exception {
            String id = servedOrder(1).get("id").asText();
            mvc.perform(get("/api/v1/cashier/payment-requests")).andExpect(jsonPath("$", hasSize(0)));
            action("/api/v1/orders/{id}/request-payment", id);
            mvc.perform(get("/api/v1/cashier/payment-requests"))
                .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(id));
            }

            @Test
            void cannotPayBeforeRequestOrWithExcessiveDiscount() throws Exception {
            String id = servedOrder(1).get("id").asText();
            String payment = "{\"discountVnd\":0,\"method\":\"CASH\"}";
            mvc.perform(post("/api/v1/orders/{id}/pay", id).contentType(MediaType.APPLICATION_JSON).content(payment))
                .andExpect(status().isConflict());
            action("/api/v1/orders/{id}/request-payment", id);
            mvc.perform(post("/api/v1/orders/{id}/pay", id).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"discountVnd\":12502,\"method\":\"CASH\"}"))
                .andExpect(status().isBadRequest());
            mvc.perform(get("/api/v1/cashier/payment-requests")).andExpect(jsonPath("$", hasSize(1)));
            }

            @Test
            void itemCanBeMadeAvailableAgainAndSoftDeleted() throws Exception {
            for (boolean available : new boolean[]{false, true}) {
                mvc.perform(patch("/api/v1/menu-items/{id}/availability", itemId)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"available\":" + available + "}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.available").value(available));
            }
            mvc.perform(get("/api/v1/menu-items").param("availableOnly", "true"))
                .andExpect(jsonPath("$", hasSize(1)));
            mvc.perform(delete("/api/v1/menu-items/{id}", itemId)).andExpect(status().isNoContent());
            mvc.perform(get("/api/v1/menu-items")).andExpect(jsonPath("$", hasSize(0)));
            mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, item(1))))
                .andExpect(status().isNotFound());
            }
}
