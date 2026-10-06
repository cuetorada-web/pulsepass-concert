package com.pulsepass.repository;

import com.pulsepass.domain.Event;
import com.pulsepass.domain.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    // FR-EVT-002: recuperar por eventCode
    Optional<Event> findByEventCode(String eventCode);

    // NUEVO: validar que el eventCode no exista
    boolean existsByEventCode(String eventCode);

    // FR-VEN-004: eventos de un venue navegando la relación (Event -> Venue.code)
    List<Event> findByVenueCode(String venueCode);

    // FR-EVT-005: eventos PUBLISHED ordenados por fecha ascendente
    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);

    // FR-SRC-001: eventos por artista (N:M) - requiere JOIN, no expresable limpio como Query Method
    @Query("""
        select distinct e
        from Event e
        join e.artists a
        where a.stageName = :stageName
        """)
    List<Event> findByArtistStageName(@Param("stageName") String stageName);

    // FR-SRC-002: eventos de una ciudad en los que participa un artista específico
    @Query("""
        select distinct e
        from Event e
        join e.artists a
        where e.venue.city = :city
        and a.stageName = :stageName
        """)
    List<Event> findByCityAndArtistStageName(@Param("city") String city,
                                              @Param("stageName") String stageName);

    // FR-SRC-003: eventos recomendados - PUBLISHED, posteriores a una fecha, ciudad,
    // artista que contenga un texto (case-insensitive), sin duplicados, ordenados por fecha
    @Query("""
        select distinct e
        from Event e
        join e.artists a
        where e.status = com.pulsepass.domain.EventStatus.PUBLISHED
        and e.eventDate > :afterDate
        and e.venue.city = :city
        and lower(a.stageName) like lower(concat('%', :artistText, '%'))
        order by e.eventDate asc
        """)
    List<Event> findRecommendedEvents(@Param("afterDate") LocalDateTime afterDate,
                                       @Param("city") String city,
                                       @Param("artistText") String artistText);
}