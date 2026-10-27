package com.roms.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final TokenService tokens;
    private final AccountService accounts;
    private final String dummyHash;

    public AuthController(UserRepository users, PasswordEncoder passwords, TokenService tokens, AccountService accounts) {
        this.users = users;
        this.passwords = passwords;
        this.tokens = tokens;
        this.accounts = accounts;
        this.dummyHash = passwords.encode(UUID.randomUUID().toString());
    }

    @PostMapping("/auth/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        AppUser user = users.findByUsername(request.username().toLowerCase(Locale.ROOT)).orElse(null);
        boolean matches = request.password().getBytes(StandardCharsets.UTF_8).length <= 72
            && passwords.matches(request.password(), user == null ? dummyHash : user.getPasswordHash());
        if (user == null || !user.isActive() || !matches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return new TokenResponse(tokens.issue(user), "Bearer", 28800);
    }

    @GetMapping("/users")
    public List<AccountService.UserView> list() { return accounts.list(); }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountService.UserView create(@Valid @RequestBody CreateUser request) {
        return accounts.create(request.username(), request.password(), request.role());
    }

    @PutMapping("/users/{id}")
    public AccountService.UserView update(@PathVariable UUID id, @Valid @RequestBody UpdateUser request) {
        return accounts.update(id, request.username(), request.role(), request.active());
    }

    @PostMapping("/users/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset(@PathVariable UUID id, @Valid @RequestBody PasswordRequest request) {
        accounts.resetPassword(id, request.password());
    }

    public record LoginRequest(@NotBlank @Size(max = 64) String username, @NotBlank @Size(max = 72) String password) { }
    public record TokenResponse(String accessToken, String tokenType, long expiresIn) { }
    public record CreateUser(String username, String password, Role role) { }
    public record UpdateUser(String username, Role role, Boolean active) { }
    public record PasswordRequest(String password) { }
}