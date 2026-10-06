package com.pulsepass.repository;

import com.pulsepass.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // FR-USR-002: identidad única
    Optional<User> findByUsername(String username);

    // Buscar usuario por email ignorando mayúsculas (sección 14 del PRD)
    Optional<User> findByEmailIgnoreCase(String email);

    // NUEVO: validar unicidad antes de registrar
    boolean existsByUsername(String username);

    // NUEVO
    boolean existsByEmailIgnoreCase(String email);
}