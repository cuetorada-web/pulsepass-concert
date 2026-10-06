package com.pulsepass.service.impl;

import com.pulsepass.domain.Event;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.TicketStatus;
import com.pulsepass.domain.User;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.TicketMapper;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.TicketPriceCalculator;
import com.pulsepass.service.TicketService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketMapper mapper;
    private final TicketPriceCalculator priceCalculator;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             EventRepository eventRepository,
                             TicketMapper mapper,
                             TicketPriceCalculator priceCalculator) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.mapper = mapper;
        this.priceCalculator = priceCalculator;
    }

    @Override
    @Transactional
    public TicketResponse purchase(PurchaseTicketRequest request) {

        // BR-TICKET-001: el usuario debe existir
        User user = userRepository.findByEmailIgnoreCase(request.userEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userEmail()));

        // BR-TICKET-002: el usuario debe estar activo
        if (!user.getActive()) {
            throw new BusinessRuleException("Inactive user cannot buy tickets: " + request.userEmail());
        }

        // BR-TICKET-003: el evento debe existir
        Event event = eventRepository.findByEventCode(request.eventCode())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.eventCode()));

        // BR-TICKET-004: el evento debe estar PUBLISHED
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BusinessRuleException(
                    "Tickets can only be bought for PUBLISHED events. Current status: " + event.getStatus());
        }

        // BR-TICKET-005: el evento no puede haber ocurrido ya
        if (!event.getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Cannot buy tickets for an event that already happened.");
        }

        // BR-TICKET-006: edad mínima (calculada a la fecha del evento)
        validateMinimumAge(user, event);

        // BR-TICKET-007: capacidad
        long paidTickets = ticketRepository.countPaidTicketsByEventCode(event.getEventCode());
        int capacity = event.getVenue().getCapacity();

        if (paidTickets >= capacity) {
            throw new BusinessRuleException("Event has no capacity left: " + event.getEventCode());
        }

        // BR-TICKET-009: el precio nunca puede ser negativo
        BigDecimal price = priceCalculator.calculate(request.type());
        if (price.signum() < 0) {
            throw new BusinessRuleException("Ticket price cannot be negative.");
        }

        // Crear y guardar el ticket (la compra válida queda PAID)
        Ticket ticket = new Ticket(
                generateTicketCode(),
                request.type(),
                price,
                TicketStatus.PAID,
                LocalDateTime.now(),
                user,
                event
        );
        Ticket saved = ticketRepository.save(ticket);

        // BR-TICKET-008: si se llenó la capacidad -> SOLD_OUT, en la misma transacción
        if (paidTickets + 1 == capacity) {
            event.setStatus(EventStatus.SOLD_OUT);
            eventRepository.save(event);
        }

        return mapper.toResponse(saved);
    }

    @Override
    public TicketResponse findByCode(String ticketCode) {
        return mapper.toResponse(findTicket(ticketCode));
    }

    @Override
    public List<TicketResponse> findByUserEmail(String email) {
        return ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(email)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public List<TicketResponse> findPaidTicketsByEvent(String eventCode) {
        return ticketRepository.findByEventEventCodeAndStatus(eventCode, TicketStatus.PAID)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TicketResponse cancel(String ticketCode) {

        Ticket ticket = findTicket(ticketCode);

        // BR-TICKET-010 y 011: solo se cancela un ticket PAID
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException(
                    "Only PAID tickets can be cancelled. Current status: " + ticket.getStatus());
        }

        // BR-TICKET-012: no se cancela después de la fecha del evento
        if (!ticket.getEvent().getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Cannot cancel a ticket after the event date.");
        }

        ticket.setStatus(TicketStatus.CANCELLED);

        return mapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponse markAsUsed(String ticketCode) {

        Ticket ticket = findTicket(ticketCode);

        // BR-TICKET-014: un ticket CANCELLED nunca se usa
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessRuleException("A cancelled ticket can never be used: " + ticketCode);
        }

        // BR-TICKET-013: solo se marca como usado un ticket PAID
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException(
                    "Only PAID tickets can be marked as used. Current status: " + ticket.getStatus());
        }

        ticket.setStatus(TicketStatus.USED);

        return mapper.toResponse(ticketRepository.save(ticket));
    }

    private Ticket findTicket(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketCode));
    }

    private void validateMinimumAge(User user, Event event) {

        if (event.getMinimumAge() != null && event.getMinimumAge() > 0) {

            LocalDate birthDate = user.getProfile().getBirthDate();
            int ageAtEvent = Period.between(birthDate, event.getEventDate().toLocalDate()).getYears();

            if (ageAtEvent < event.getMinimumAge()) {
                throw new BusinessRuleException("User does not meet minimum age: "
                        + event.getMinimumAge() + " (age at event: " + ageAtEvent + ")");
            }
        }
    }

    private String generateTicketCode() {
        return "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}