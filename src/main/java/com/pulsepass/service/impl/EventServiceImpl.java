package com.pulsepass.service.impl;

import com.pulsepass.domain.Artist;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.domain.Venue;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.EventMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.EventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final ArtistRepository artistRepository;
    private final EventMapper eventMapper;

    public EventServiceImpl(EventRepository eventRepository,
                            VenueRepository venueRepository,
                            ArtistRepository artistRepository,
                            EventMapper eventMapper) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.artistRepository = artistRepository;
        this.eventMapper = eventMapper;
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {

        // BR-EVENT-001: código único
        if (eventRepository.existsByEventCode(request.eventCode())) {
            throw new DuplicateResourceException("Event already exists: " + request.eventCode());
        }

        // BR-EVENT-002: el venue debe existir
        Venue venue = venueRepository.findByCode(request.venueCode())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.venueCode()));

        // BR-EVENT-003: el venue debe estar activo
        if (!venue.getActive()) {
            throw new BusinessRuleException("Venue is not active: " + venue.getCode());
        }

        // BR-EVENT-004: fecha futura
        if (!request.eventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Event date must be in the future.");
        }

        // BR-EVENT-006: minimumAge >= 0
        if (request.minimumAge() == null || request.minimumAge() < 0) {
            throw new BusinessRuleException("Minimum age must be 0 or greater.");
        }

        // BR-EVENT-005: todo evento nuevo inicia en DRAFT (el request no lo controla)
        Event event = new Event(
                request.eventCode(),
                request.name(),
                request.description(),
                request.category(),
                EventStatus.DRAFT,
                request.eventDate(),
                request.minimumAge(),
                venue
        );

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    public EventResponse findByCode(String eventCode) {
        return eventMapper.toResponse(findEvent(eventCode));
    }

    @Override
    public List<EventSummaryResponse> findPublishedEvents() {
        return eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED)
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    @Override
    @Transactional
    public EventResponse publish(String eventCode) {

        Event event = findEvent(eventCode);

        // BR-EVENT-007: solo se publica un DRAFT
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BusinessRuleException(
                    "Only DRAFT events can be published. Current status: " + event.getStatus());
        }

        // BR-EVENT-008: debe seguir con fecha futura
        if (!event.getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Cannot publish an event whose date has already passed.");
        }

        // BR-EVENT-009: el venue debe seguir activo
        if (!event.getVenue().getActive()) {
            throw new BusinessRuleException("Venue is not active: " + event.getVenue().getCode());
        }

        event.setStatus(EventStatus.PUBLISHED);

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public EventResponse addArtist(String eventCode, Long artistId) {

        Event event = findEvent(eventCode);

        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + artistId));

        // BR-EVENT-011: no se agregan artistas a eventos CANCELLED o FINISHED
        if (event.getStatus() == EventStatus.CANCELLED
                || event.getStatus() == EventStatus.FINISHED) {
            throw new BusinessRuleException(
                    "Cannot add artists to an event with status " + event.getStatus());
        }

        // BR-EVENT-010: no se asocia dos veces el mismo artista
        if (event.getArtists().contains(artist)) {
            throw new DuplicateResourceException(
                    "Artist " + artistId + " is already associated with event " + eventCode);
        }

        event.addArtist(artist);

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    public List<EventSummaryResponse> findByArtist(String stageName) {
        return eventRepository.findByArtistStageName(stageName)
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    private Event findEvent(String eventCode) {
        return eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventCode));
    }
}