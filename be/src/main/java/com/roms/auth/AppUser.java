package com.roms.auth;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class AppUser {
    @Id
    private UUID id;
    @Column(nullable = false, unique = true, length = 64)
    private String username;
    @Column(name = "full_name", length = 120)
    private String fullName;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "token_version", nullable = false)
    private long tokenVersion;

    protected AppUser() { }

    AppUser(String username, String passwordHash, Role role) {
        this(username, passwordHash, role, null);
    }

    AppUser(String username, String passwordHash, Role role, String fullName) {
        this.id = UUID.randomUUID();
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.fullName = fullName != null && !fullName.isBlank() ? fullName.trim() : null;
        this.active = true;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public boolean isActive() { return active; }
    public long getTokenVersion() { return tokenVersion; }

    public String getDisplayName() {
        return (fullName != null && !fullName.isBlank()) ? fullName.trim() : username;
    }

    void update(String username, Role role, boolean active) {
        update(username, role, active, this.fullName);
    }

    void update(String username, Role role, boolean active, String fullName) {
        if (!this.username.equals(username) || this.role != role || this.active != active) {
            tokenVersion++;
        }
        this.username = username;
        this.role = role;
        this.active = active;
        if (fullName != null) {
            this.fullName = fullName.isBlank() ? null : fullName.trim();
        }
    }

    void resetPassword(String hash) {
        passwordHash = hash;
        tokenVersion++;
    }
}