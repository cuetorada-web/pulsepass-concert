package com.pulsepass.service;

import com.pulsepass.domain.Artist;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.EventCategory;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.domain.Venue;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.EventMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.impl.EventServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock private EventRepository eventRepository;
    @Mock private VenueRepository venueRepository;
    @Mock private ArtistRepository artistRepository;
    @Mock private EventMapper eventMapper;

    @InjectMocks private EventServiceImpl service;

    // ---------- helpers ----------

    private Venue venue(boolean active) {
        return new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta",
                "Calle 1 # 2-30", 3, active);
    }

    private Event event(EventStatus status, Venue venue) {
        return new Event("CMF-2026", "Caribbean Music Fest 2026", "desc",
                EventCategory.MUSIC, status, LocalDateTime.now().plusDays(30), 18, venue);
    }

    private EventResponse response(EventStatus status) {
        return new EventResponse(1L, "CMF-2026", "Caribbean Music Fest 2026", "desc",
                EventCategory.MUSIC, status, LocalDateTime.now().plusDays(30), 18,
                "VEN-SMR-01", "Marina Convention Center", List.of());
    }

    private CreateEventRequest request(LocalDateTime date) {
        return new CreateEventRequest("CMF-2026", "Caribbean Music Fest 2026", "desc",
                EventCategory.MUSIC, date, 18, "VEN-SMR-01");
    }

    // ---------- TEST-EVENT-001 ----------
    @Test
    void shouldFindEventByCode() {
        // ARRANGE
        Event event = event(EventStatus.PUBLISHED, venue(true));
        EventResponse response = response(EventStatus.PUBLISHED);
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(eventMapper.toResponse(event)).thenReturn(response);

        // ACT
        EventResponse result = service.findByCode("CMF-2026");

        // ASSERT
        assertThat(result).isEqualTo(response);
        verify(eventRepository).findByEventCode("CMF-2026");
        verify(eventMapper).toResponse(event);
    }

    // ---------- TEST-EVENT-002 ----------
    @Test
    void shouldThrowWhenEventDoesNotExist() {
        // ARRANGE
        when(eventRepository.findByEventCode("NOPE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.findByCode("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("NOPE");

        verify(eventMapper, never()).toResponse(any());
    }

    // ---------- TEST-EVENT-003 ----------
    @Test
    void shouldCreateValidEventAsDraft() {
        // ARRANGE
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArgument(0));
        when(eventMapper.toResponse(any(Event.class))).thenReturn(response(EventStatus.DRAFT));

        // ACT
        EventResponse result = service.create(request(LocalDateTime.now().plusDays(30)));

        // ASSERT
        assertThat(result.status()).isEqualTo(EventStatus.DRAFT);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(EventStatus.DRAFT);
    }

    // ---------- TEST-EVENT-004 ----------
    @Test
    void shouldFailWhenVenueDoesNotExist() {
        // ARRANGE
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(LocalDateTime.now().plusDays(30))))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(eventRepository, never()).save(any());
    }

    // ---------- TEST-EVENT-005 ----------
    @Test
    void shouldFailWhenVenueIsInactive() {
        // ARRANGE
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(false)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(LocalDateTime.now().plusDays(30))))
                .isInstanceOf(BusinessRuleException.class);

        verify(eventRepository, never()).save(any());
    }

    // ---------- TEST-EVENT-006 ----------
    @Test
    void shouldFailWhenEventDateIsInThePast() {
        // ARRANGE
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(LocalDateTime.now().minusDays(1))))
                .isInstanceOf(BusinessRuleException.class);

        verify(eventRepository, never()).save(any());
    }

    // ---------- TEST-EVENT-007 ----------
    @Test
    void shouldPublishValidDraftEvent() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArgument(0));
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.PUBLISHED));

        // ACT
        EventResponse result = service.publish("CMF-2026");

        // ASSERT
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(result.status()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository).save(event);
    }

    // ---------- TEST-EVENT-008 ----------
    @Test
    void shouldNotPublishCancelledEvent() {
        // ARRANGE
        Event event = event(EventStatus.CANCELLED, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class);

        verify(eventRepository, never()).save(any());
    }

    // ---------- addArtist (el PRD pide unit test) ----------
    @Test
    void shouldAddArtistToEvent() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, venue(true));
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArgument(0));
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.DRAFT));

        // ACT
        service.addArtist("CMF-2026", 1L);

        // ASSERT
        assertThat(event.getArtists()).contains(artist);
        verify(eventRepository).save(event);
    }

    @Test
    void shouldNotAddSameArtistTwice() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, venue(true));
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        event.addArtist(artist);
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.addArtist("CMF-2026", 1L))
                .isInstanceOf(DuplicateResourceException.class);

        verify(eventRepository, never()).save(any());
    }
}