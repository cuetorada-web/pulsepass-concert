package com.pulsepass.service.impl;

import com.pulsepass.domain.Event;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.TicketStatus;
import com.pulsepass.domain.TicketType;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserProfile;
import com.pulsepass.domain.Venue;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.TicketMapper;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.TicketPriceCalculator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    private static final String USER_EMAIL = "andrea@email.com";
    private static final String EVENT_CODE = "CMF-2026";
    private static final String TICKET_CODE = "TKT-ABC12345";
    private static final BigDecimal VIP_PRICE = new BigDecimal("150000.00");

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TicketMapper mapper;

    @Mock
    private TicketPriceCalculator priceCalculator;

    @InjectMocks
    private TicketServiceImpl ticketService;

    // ===============================================================
    // purchase()
    // ===============================================================

    @Test
    @DisplayName("TEST-TICKET-001: compra válida -> ticket PAID")
    void shouldPurchaseTicketSuccessfully() {
        // ARRANGE
        User user = activeUser(25);
        Event event = publishedEvent(3, 18);
        PurchaseTicketRequest request = vipRequest();
        Ticket saved = mock(Ticket.class);
        TicketResponse expected = mock(TicketResponse.class);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode(EVENT_CODE)).thenReturn(0L);
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(VIP_PRICE);
        when(ticketRepository.save(any(Ticket.class))).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.purchase(request);

        // ASSERT
        assertThat(result).isSameAs(expected);

        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(captor.capture());
        Ticket created = captor.getValue();
        assertThat(created.getStatus()).isEqualTo(TicketStatus.PAID);
        assertThat(created.getPrice()).isEqualByComparingTo(VIP_PRICE);
        assertThat(created.getUser()).isSameAs(user);
        assertThat(created.getEvent()).isSameAs(event);

        verify(event, never()).setStatus(EventStatus.SOLD_OUT);
        verify(eventRepository, never()).save(any(Event.class));
        verify(mapper).toResponse(saved);
    }

    @Test
    @DisplayName("TEST-TICKET-002: usuario inexistente -> ResourceNotFoundException")
    void shouldRejectPurchaseWhenUserDoesNotExist() {
        // ARRANGE
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found")
                .hasMessageContaining(USER_EMAIL);

        verifyNoInteractions(eventRepository, priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    @DisplayName("TEST-TICKET-003: usuario inactivo -> BusinessRuleException")
    void shouldRejectPurchaseWhenUserIsInactive() {
        // ARRANGE
        User inactive = mock(User.class);
        when(inactive.getActive()).thenReturn(false);
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(inactive));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Inactive user");

        verifyNoInteractions(eventRepository, priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
    }

      @Test
    @DisplayName("BR-TICKET-003: evento inexistente -> ResourceNotFoundException")
    void shouldRejectPurchaseWhenEventDoesNotExist() {
        // ARRANGE
        User user = activeUser(25);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Event not found")
                .hasMessageContaining(EVENT_CODE);

        verifyNoInteractions(priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
    }

    @ParameterizedTest(name = "TEST-TICKET-004/005: evento {0} -> BusinessRuleException")
    @EnumSource(value = EventStatus.class, names = {"DRAFT", "SOLD_OUT", "CANCELLED", "FINISHED"})
    void shouldRejectPurchaseWhenEventIsNotPublished(EventStatus status) {
        // ARRANGE
        User user = activeUser(25);
        Event event = mock(Event.class);
        when(event.getStatus()).thenReturn(status);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("PUBLISHED");

        verifyNoInteractions(priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-TICKET-005: evento ya ocurrido -> BusinessRuleException")
    void shouldRejectPurchaseWhenEventAlreadyHappened() {
        // ARRANGE
        User user = activeUser(25);
        Event event = mock(Event.class);
        when(event.getStatus()).thenReturn(EventStatus.PUBLISHED);
        when(event.getEventDate()).thenReturn(LocalDateTime.now().minusDays(1));

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already happened");

        verifyNoInteractions(priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("TEST-TICKET-006: usuario menor de edad -> BusinessRuleException")
    void shouldRejectPurchaseWhenUserIsUnderMinimumAge() {
        // ARRANGE
        User laura = activeUser(17);
        Event event = publishedEvent(3, 18);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(laura));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("minimum age");

        verifyNoInteractions(priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
        verify(ticketRepository, never()).countPaidTicketsByEventCode(any());
    }

    @Test
    @DisplayName("BR-TICKET-006: usuario que cumple exactamente la edad mínima en la fecha del evento puede comprar")
    void shouldAllowPurchaseWhenUserTurnsMinimumAgeOnEventDay() {
        // ARRANGE
        User user = activeUser(18); // cumple 18 el mismo día del evento
        Event event = publishedEvent(3, 18);
        Ticket saved = mock(Ticket.class);
        TicketResponse expected = mock(TicketResponse.class);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode(EVENT_CODE)).thenReturn(0L);
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(VIP_PRICE);
        when(ticketRepository.save(any(Ticket.class))).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.purchase(vipRequest());

        // ASSERT
        assertThat(result).isSameAs(expected);
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("BR-TICKET-006: evento sin restricción de edad (minimumAge = 0) no consulta el perfil")
    void shouldNotCheckAgeWhenEventHasNoRestriction() {
        // ARRANGE
        User user = mock(User.class);
        when(user.getActive()).thenReturn(true);

        Event event = publishedEvent(3, 0);
        Ticket saved = mock(Ticket.class);
        TicketResponse expected = mock(TicketResponse.class);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode(EVENT_CODE)).thenReturn(0L);
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(VIP_PRICE);
        when(ticketRepository.save(any(Ticket.class))).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.purchase(vipRequest());

        // ASSERT
        assertThat(result).isSameAs(expected);
        verify(user, never()).getProfile();
    }

    @Test
    @DisplayName("TEST-TICKET-007: evento sin capacidad -> BusinessRuleException")
    void shouldRejectPurchaseWhenEventHasNoCapacityLeft() {
        // ARRANGE
        User user = activeUser(25);
        Event event = publishedEvent(3, 18);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode(EVENT_CODE)).thenReturn(3L);

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("no capacity");

        verifyNoInteractions(priceCalculator, mapper);
        verify(ticketRepository, never()).save(any());
        verify(eventRepository, never()).save(any(Event.class));
        verify(event, never()).setStatus(any());
    }

    @Test
    @DisplayName("TEST-TICKET-008: último ticket disponible -> guarda ticket y evento pasa a SOLD_OUT")
    void shouldMarkEventAsSoldOutWhenLastTicketIsPurchased() {
        // ARRANGE
        User user = activeUser(25);
        Event event = publishedEvent(3, 18);
        Ticket saved = mock(Ticket.class);
        TicketResponse expected = mock(TicketResponse.class);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode(EVENT_CODE)).thenReturn(2L); // capacidad 3
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(VIP_PRICE);
        when(ticketRepository.save(any(Ticket.class))).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.purchase(vipRequest());

        // ASSERT
        assertThat(result).isSameAs(expected);
        verify(ticketRepository).save(any(Ticket.class));
        verify(event).setStatus(EventStatus.SOLD_OUT);
        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("BR-TICKET-009: precio negativo -> BusinessRuleException y no persiste")
    void shouldRejectPurchaseWhenPriceIsNegative() {
        // ARRANGE
        User user = activeUser(25);
        Event event = publishedEvent(3, 18);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode(EVENT_CODE)).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode(EVENT_CODE)).thenReturn(0L);
        when(priceCalculator.calculate(TicketType.VIP)).thenReturn(new BigDecimal("-1"));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.purchase(vipRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("negative");

        verify(ticketRepository, never()).save(any());
        verify(eventRepository, never()).save(any(Event.class));
        verifyNoInteractions(mapper);
    }

    // ===============================================================
    // cancel()
    // ===============================================================

    @Test
    @DisplayName("TEST-TICKET-009: cancelar ticket PAID -> CANCELLED")
    void shouldCancelPaidTicket() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.PAID, LocalDateTime.now().plusDays(10));
        TicketResponse expected = mock(TicketResponse.class);

        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(mapper.toResponse(ticket)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.cancel(TICKET_CODE);

        // ASSERT
        assertThat(result).isSameAs(expected);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository).save(ticket);
    }

    @Test
    @DisplayName("TEST-TICKET-010: cancelar ticket USED -> BusinessRuleException")
    void shouldRejectCancelWhenTicketIsUsed() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.USED, LocalDateTime.now().plusDays(10));
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.cancel(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only PAID tickets can be cancelled");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("BR-TICKET-011: cancelar ticket CANCELLED -> BusinessRuleException")
    void shouldRejectCancelWhenTicketIsAlreadyCancelled() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.CANCELLED, LocalDateTime.now().plusDays(10));
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.cancel(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("BR-TICKET-012: cancelar después de la fecha del evento -> BusinessRuleException")
    void shouldRejectCancelAfterEventDate() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.PAID, LocalDateTime.now().minusDays(1));
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.cancel(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("after the event date");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.PAID);
        verify(ticketRepository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("cancel: ticket inexistente -> ResourceNotFoundException")
    void shouldThrowWhenCancellingUnknownTicket() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("NOPE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.cancel("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Ticket not found")
                .hasMessageContaining("NOPE");

        verify(ticketRepository, never()).save(any());
    }

    // ===============================================================
    // markAsUsed()
    // ===============================================================

    @Test
    @DisplayName("TEST-TICKET-011: marcar ticket PAID como usado -> USED")
    void shouldMarkPaidTicketAsUsed() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.PAID, LocalDateTime.now().plusDays(10));
        TicketResponse expected = mock(TicketResponse.class);

        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(mapper.toResponse(ticket)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.markAsUsed(TICKET_CODE);

        // ASSERT
        assertThat(result).isSameAs(expected);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository).save(ticket);
    }

    @Test
    @DisplayName("TEST-TICKET-012: usar ticket CANCELLED -> BusinessRuleException")
    void shouldRejectUsingCancelledTicket() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.CANCELLED, LocalDateTime.now().plusDays(10));
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.markAsUsed(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("cancelled ticket");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("BR-TICKET-013: marcar como usado un ticket ya USED -> BusinessRuleException")
    void shouldRejectUsingAlreadyUsedTicket() {
        // ARRANGE
        Ticket ticket = ticketWith(TicketStatus.USED, LocalDateTime.now().plusDays(10));
        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.markAsUsed(TICKET_CODE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only PAID tickets can be marked as used");

        verify(ticketRepository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    // ===============================================================
    // Consultas
    // ===============================================================

    @Test
    @DisplayName("findByCode: ticket existente -> retorna TicketResponse")
    void shouldFindTicketByCode() {
        // ARRANGE
        Ticket ticket = mock(Ticket.class);
        TicketResponse expected = mock(TicketResponse.class);

        when(ticketRepository.findByTicketCode(TICKET_CODE)).thenReturn(Optional.of(ticket));
        when(mapper.toResponse(ticket)).thenReturn(expected);

        // ACT
        TicketResponse result = ticketService.findByCode(TICKET_CODE);

        // ASSERT
        assertThat(result).isSameAs(expected);
    }

    @Test
    @DisplayName("findByCode: ticket inexistente -> ResourceNotFoundException")
    void shouldThrowWhenTicketCodeDoesNotExist() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("NOPE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> ticketService.findByCode("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Ticket not found");

        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("findByUserEmail: retorna los tickets del usuario mapeados")
    void shouldFindTicketsByUserEmail() {
        // ARRANGE
        Ticket first = mock(Ticket.class);
        Ticket second = mock(Ticket.class);
        TicketResponse firstResponse = mock(TicketResponse.class);
        TicketResponse secondResponse = mock(TicketResponse.class);

        when(ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(USER_EMAIL))
                .thenReturn(List.of(first, second));
        when(mapper.toResponse(first)).thenReturn(firstResponse);
        when(mapper.toResponse(second)).thenReturn(secondResponse);

        // ACT
        List<TicketResponse> result = ticketService.findByUserEmail(USER_EMAIL);

        // ASSERT
        assertThat(result).containsExactly(firstResponse, secondResponse);
    }

    @Test
    @DisplayName("findPaidTicketsByEvent: consulta solo tickets PAID del evento")
    void shouldFindPaidTicketsByEvent() {
        // ARRANGE
        Ticket ticket = mock(Ticket.class);
        TicketResponse response = mock(TicketResponse.class);

        when(ticketRepository.findByEventEventCodeAndStatus(EVENT_CODE, TicketStatus.PAID))
                .thenReturn(List.of(ticket));
        when(mapper.toResponse(ticket)).thenReturn(response);

        // ACT
        List<TicketResponse> result = ticketService.findPaidTicketsByEvent(EVENT_CODE);

        // ASSERT
        assertThat(result).containsExactly(response);
        verify(ticketRepository).findByEventEventCodeAndStatus(eq(EVENT_CODE), eq(TicketStatus.PAID));
    }

    // ===============================================================
    // Helpers
    // ===============================================================

    private PurchaseTicketRequest vipRequest() {
        return new PurchaseTicketRequest(USER_EMAIL, EVENT_CODE, TicketType.VIP);
    }

    /**
     * Usuario activo cuyo perfil tiene la edad indicada EN LA FECHA DEL EVENTO
     * (el evento de {@link #publishedEvent} ocurre dentro de 30 días).
     */
    private User activeUser(int ageAtEvent) {
        LocalDate eventDay = LocalDateTime.now().plusDays(30).toLocalDate();

        UserProfile profile = mock(UserProfile.class);
        lenient().when(profile.getBirthDate()).thenReturn(eventDay.minusYears(ageAtEvent));

        User user = mock(User.class);
        lenient().when(user.getActive()).thenReturn(true);
        lenient().when(user.getProfile()).thenReturn(profile);
        return user;
    }

    /** Evento PUBLISHED, dentro de 30 días, en un venue con la capacidad indicada. */
    private Event publishedEvent(int capacity, int minimumAge) {
        Venue venue = mock(Venue.class);
        lenient().when(venue.getCapacity()).thenReturn(capacity);

        LocalDateTime eventDate = LocalDateTime.now().plusDays(30);

        Event event = mock(Event.class);
        lenient().when(event.getEventCode()).thenReturn(EVENT_CODE);
        lenient().when(event.getStatus()).thenReturn(EventStatus.PUBLISHED);
        lenient().when(event.getEventDate()).thenReturn(eventDate);
        lenient().when(event.getMinimumAge()).thenReturn(minimumAge);
        lenient().when(event.getVenue()).thenReturn(venue);
        return event;
    }

    /** Ticket real (para que setStatus/getStatus funcionen) asociado a un evento simulado. */
    private Ticket ticketWith(TicketStatus status, LocalDateTime eventDate) {
        Event event = mock(Event.class);
        lenient().when(event.getEventDate()).thenReturn(eventDate);

        return new Ticket(
                TICKET_CODE,
                TicketType.VIP,
                VIP_PRICE,
                status,
                LocalDateTime.now().minusDays(1),
                mock(User.class),
                event
        );
    }
}