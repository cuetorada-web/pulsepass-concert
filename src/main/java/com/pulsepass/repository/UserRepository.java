package com.pulsepass.repository;

import com.pulsepass.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
        // FASE 4: solo el ID, para comparar contra el principal autenticado
    @Query("select u.id from User u where lower(u.email) = lower(:email)")
    Optional<Long> findIdByEmailIgnoreCase(@Param("email") String email);

    @Query("select u.id from User u where u.username = :username")
    Optional<Long> findIdByUsername(@Param("username") String username);
}