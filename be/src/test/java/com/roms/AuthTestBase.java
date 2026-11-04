package com.roms;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

abstract class AuthTestBase {
    static final String BOOTSTRAP_PASSWORD = UUID.randomUUID().toString();
    static final String JWT_SECRET;
    static {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        JWT_SECRET = Base64.getEncoder().encodeToString(bytes);
    }

    @DynamicPropertySource
    static void authProperties(DynamicPropertyRegistry registry) {
        registry.add("app.auth.jwt-secret", () -> JWT_SECRET);
        registry.add("app.auth.bootstrap-username", () -> "test-admin");
        registry.add("app.auth.bootstrap-password", () -> BOOTSTRAP_PASSWORD);
    }
}