package com.pulsepass.repository;

import com.pulsepass.domain.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    // FR-ART-002: nombre artístico único
    Optional<Artist> findByStageName(String stageName);

    // NUEVO: búsqueda ignorando mayúsculas
    Optional<Artist> findByStageNameIgnoreCase(String stageName);

    // NUEVO: solo artistas activos, ordenados por nombre artístico
    List<Artist> findByActiveTrueOrderByStageNameAsc();
}