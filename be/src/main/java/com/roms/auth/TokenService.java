package com.roms.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final UserRepository users;
    private final String issuer;
    private static final Duration LIFETIME = Duration.ofHours(8);

    public TokenService(UserRepository users, @Value("${app.auth.jwt-secret}") String secret,
                        @Value("${app.auth.issuer}") String issuer) {
        this.users = users;
        this.issuer = issuer;
        byte[] key;
        try { key = Base64.getDecoder().decode(secret); }
        catch (IllegalArgumentException ex) { throw new IllegalStateException("AUTH_JWT_SECRET must be base64", ex); }
        if (key.length < 32 || issuer.isBlank()) {
            throw new IllegalStateException("AUTH_JWT_SECRET must be base64 of at least 32 random bytes; issuer must not be blank");
        }
        SecretKey secretKey = new SecretKeySpec(key, "HmacSHA256");
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(secretKey).macAlgorithm(MacAlgorithm.HS256).build();
        jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        this.decoder = jwtDecoder;
    }

    public String issue(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).subject(user.getId().toString())
                .issuedAt(now).expiresAt(now.plus(LIFETIME)).claim("role", user.getRole().name())
                .claim("ver", user.getTokenVersion()).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    public UsernamePasswordAuthenticationToken authenticate(String token) {
        try {
            Jwt jwt = decoder.decode(token);
            Instant now = Instant.now();
                Object version = jwt.getClaim("ver");
            if (jwt.getExpiresAt() == null || jwt.getIssuedAt() == null || !jwt.getExpiresAt().isAfter(now)
                    || jwt.getIssuedAt().isAfter(now.plusSeconds(60))
                    || jwt.getExpiresAt().isAfter(jwt.getIssuedAt().plus(LIFETIME))
                    || !(version instanceof Integer || version instanceof Long) || jwt.getClaimAsString("role") == null) {
                throw new IllegalArgumentException("Invalid token claims");
            }
            AppUser user = users.findById(UUID.fromString(jwt.getSubject())).orElseThrow();
                if (!user.isActive() || user.getTokenVersion() != ((Number) version).longValue()
                    || !user.getRole().name().equals(jwt.getClaimAsString("role"))) {
                throw new IllegalArgumentException("Account changed");
            }
            return new UsernamePasswordAuthenticationToken(user.getUsername(), null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        } catch (RuntimeException ex) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid token", ex);
        }
    }
}