package com.pulsepass.service;

import com.pulsepass.domain.EventStatus;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Frontera de seguridad de eventos (patrón Decorator).
 * Los controllers reciben este bean (@Primary); la lógica de negocio sigue en EventServiceImpl.
 */
@Service
@Primary
public class SecuredEventService implements EventService {

    private final EventService delegate;
    private final AuthorizationService authz;

    public SecuredEventService(@Qualifier("eventServiceImpl") EventService delegate,
                               AuthorizationService authz) {
        this.delegate = delegate;
        this.authz = authz;
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse create(CreateEventRequest request) {
        return delegate.create(request);
    }

    // FR-SECEVT-02: público solo si PUBLISHED; los demás estados, STAFF/ADMIN.
    // Para el resto se responde 404 (no 403) para no revelar que existe un borrador.
    @Override
    public EventResponse findByCode(String eventCode) {
        EventResponse event = delegate.findByCode(eventCode);

        if (event.status() != EventStatus.PUBLISHED && !authz.hasOperationalRole()) {
            throw new ResourceNotFoundException("Event not found: " + eventCode);
        }
        return event;
    }

    @Override
    public List<EventSummaryResponse> findPublishedEvents() {
        return delegate.findPublishedEvents();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse publish(String eventCode) {
        return delegate.publish(eventCode);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse addArtist(String eventCode, Long artistId) {
        return delegate.addArtist(eventCode, artistId);
    }

    // FR-SECEVT-06: el público solo ve eventos publicados
    @Override
    public List<EventSummaryResponse> findByArtist(String stageName) {
        List<EventSummaryResponse> events = delegate.findByArtist(stageName);

        if (authz.hasOperationalRole()) {
            return events;
        }
        return events.stream()
                .filter(event -> event.status() == EventStatus.PUBLISHED)
                .toList();
    }
}