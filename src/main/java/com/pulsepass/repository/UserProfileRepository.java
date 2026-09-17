package com.pulsepass.repository;

import com.pulsepass.domain.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    // FR-USR-003: navegar la relación 1:1 desde el otro lado si se necesita
    Optional<UserProfile> findByUserId(Long userId);
}