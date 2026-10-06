package com.pulsepass.repository;

import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // NUEVO: buscar ticket por su código
    Optional<Ticket> findByTicketCode(String ticketCode);

    // FR-TKT-006: tickets de un usuario por email (navegando Ticket -> User -> email)
    List<Ticket> findByUserEmail(String email);

    // NUEVO: tickets de un usuario, ignorando mayúsculas, del más reciente al más viejo
    List<Ticket> findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(String email);

    // FR-TKT-006 (variante con status)
    List<Ticket> findByUserEmailAndStatus(String email, TicketStatus status);

    // FR-TKT-007: tickets PAID de un evento por eventCode (navegando Ticket -> Event -> eventCode)
    List<Ticket> findByEventEventCodeAndStatus(String eventCode, TicketStatus status);

    // FR-TKT-008: conteo de tickets PAID de un evento - @Query + JPQL con COUNT
    @Query("""
        select count(t)
        from Ticket t
        where t.event.eventCode = :eventCode
        and t.status = com.pulsepass.domain.TicketStatus.PAID
        """)
    long countPaidTicketsByEventCode(@Param("eventCode") String eventCode);

    // FR-SRC-004: tickets cuyo evento es posterior a una fecha, ordenados cronológicamente
    @Query("""
        select t
        from Ticket t
        where t.event.eventDate > :afterDate
        order by t.event.eventDate asc
        """)
    List<Ticket> findTicketsOfUpcomingEvents(@Param("afterDate") LocalDateTime afterDate);
}