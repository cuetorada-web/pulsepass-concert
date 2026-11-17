package com.pulsepass.repository;

import com.pulsepass.domain.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    // FR-VEN-001: recuperar por código de negocio
    Optional<Venue> findByCode(String code);

    // NUEVO: solo venues activos, ordenados por nombre
    List<Venue> findByActiveTrueOrderByNameAsc();
}