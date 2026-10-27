package com.roms.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    ApplicationRunner bootstrapAccounts(AccountService accounts,
            @Value("${app.auth.bootstrap-username}") String username,
            @Value("${app.auth.bootstrap-password}") String password) {
        return args -> accounts.bootstrap(username, password);
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, TokenService tokens) throws Exception {
        http.csrf(csrf -> csrf.disable()).cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(errors -> errors.authenticationEntryPoint((req, res, ex) -> res.sendError(401)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/health", "/ws").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/users", "/api/v1/users/*/reset-password").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/users/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/tables", "/api/v1/orders/*").hasAnyRole("WAITER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/categories", "/api/v1/menu-items").hasAnyRole("WAITER", "KITCHEN", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/orders", "/api/v1/orders/*/request-payment", "/api/v1/order-items/*/serve").hasAnyRole("WAITER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/kitchen/queue").hasAnyRole("KITCHEN", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/kitchen/order-items/*/start", "/api/v1/kitchen/order-items/*/done").hasAnyRole("KITCHEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/cashier/payment-requests", "/api/v1/orders/*/invoice/preview").hasAnyRole("CASHIER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/orders/*/pay").hasAnyRole("CASHIER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/tables", "/api/v1/categories", "/api/v1/menu-items").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/tables/*", "/api/v1/categories/*", "/api/v1/menu-items/*", "/api/v1/menu-items/*/availability").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/tables/*", "/api/v1/categories/*", "/api/v1/menu-items/*").hasRole("ADMIN")
                .anyRequest().denyAll())
            .addFilterBefore(new TokenFilter(tokens), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static class TokenFilter extends OncePerRequestFilter {
        private final TokenService tokens;
        TokenFilter(TokenService tokens) { this.tokens = tokens; }
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            String header = request.getHeader("Authorization");
            if (header != null) {
                try {
                    if (!header.startsWith("Bearer ") || header.length() <= 7) throw new IllegalArgumentException();
                    SecurityContextHolder.getContext().setAuthentication(tokens.authenticate(header.substring(7)));
                } catch (RuntimeException ex) {
                    SecurityContextHolder.clearContext();
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            }
            chain.doFilter(request, response);
        }
    }
}