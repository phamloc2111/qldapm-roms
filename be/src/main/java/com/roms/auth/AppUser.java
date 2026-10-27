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
        this.id = UUID.randomUUID();
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = true;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public boolean isActive() { return active; }
    public long getTokenVersion() { return tokenVersion; }

    void update(String username, Role role, boolean active) {
        if (!this.username.equals(username) || this.role != role || this.active != active) {
            tokenVersion++;
        }
        this.username = username;
        this.role = role;
        this.active = active;
    }

    void resetPassword(String hash) {
        passwordHash = hash;
        tokenVersion++;
    }
}