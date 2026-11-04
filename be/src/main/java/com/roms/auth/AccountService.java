package com.roms.auth;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JdbcTemplate jdbc;

    public AccountService(UserRepository users, PasswordEncoder passwords, JdbcTemplate jdbc) {
        this.users = users;
        this.passwords = passwords;
        this.jdbc = jdbc;
    }

    @Transactional
    public void bootstrap(String username, String password) {
        lockGuard();
        if (username.isBlank() != password.isBlank()) {
            throw new IllegalStateException("Both bootstrap username and password must be configured");
        }
        if (users.countByRoleAndActiveTrue(Role.ADMIN) == 0) {
            if (username.isBlank()) {
                throw new IllegalStateException("No active admin; configure bootstrap credentials");
            }
            createInternal(username, password, Role.ADMIN);
        }
    }

    @Transactional(readOnly = true)
    public List<UserView> list() {
        return users.findAll().stream().map(UserView::from).toList();
    }

    @Transactional
    public UserView create(String username, String password, Role role) {
        lockGuard();
        return UserView.from(createInternal(username, password, role));
    }

    private AppUser createInternal(String username, String password, Role role) {
        String normalized = normalize(username);
        validatePassword(password);
        if (role == null) throw badRequest("Role is required");
        if (users.existsByUsername(normalized)) throw conflict("Username already exists");
        try {
            return users.saveAndFlush(new AppUser(normalized, passwords.encode(password), role));
        } catch (DataIntegrityViolationException ex) {
            throw conflict("Username already exists");
        }
    }

    @Transactional
    public UserView update(UUID id, String username, Role role, Boolean active) {
        lockGuard();
        AppUser user = find(id);
        String normalized = normalize(username);
        if (role == null || active == null) throw badRequest("Role and active are required");
        if (user.getRole() == Role.ADMIN && user.isActive() && (role != Role.ADMIN || !active)
                && users.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw conflict("Cannot remove the last active admin");
        }
        if (!user.getUsername().equals(normalized) && users.existsByUsername(normalized)) {
            throw conflict("Username already exists");
        }
        user.update(normalized, role, active);
        try {
            users.flush();
        } catch (DataIntegrityViolationException ex) {
            throw conflict("Username already exists");
        }
        return UserView.from(user);
    }

    @Transactional
    public void resetPassword(UUID id, String password) {
        lockGuard();
        validatePassword(password);
        find(id).resetPassword(passwords.encode(password));
    }

    private AppUser find(UUID id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void lockGuard() {
        jdbc.queryForObject("SELECT id FROM auth_guard WHERE id = 1 FOR UPDATE", Integer.class);
    }

    public static String normalize(String username) {
        if (username == null || !username.matches("[A-Za-z0-9._-]{3,64}")) {
            throw badRequest("Username must be 3-64 ASCII letters, digits, dot, underscore or hyphen");
        }
        return username.toLowerCase(Locale.ROOT);
    }

    private static void validatePassword(String password) {
        if (password == null || password.isBlank() || password.length() < 12
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw badRequest("Password must be at least 12 characters and at most 72 UTF-8 bytes");
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    public record UserView(UUID id, String username, Role role, boolean active) {
        static UserView from(AppUser user) {
            return new UserView(user.getId(), user.getUsername(), user.getRole(), user.isActive());
        }
    }
}