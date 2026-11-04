package com.roms.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByUsername(String username);
    long countByRoleAndActiveTrue(Role role);
    boolean existsByUsername(String username);
}