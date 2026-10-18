package com.pulsepass.service;

import com.pulsepass.domain.EventCategory;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecuredEventServiceTest {

    @Mock private EventService delegate;
    @Mock private AuthorizationService authz;

    private SecuredEventService service;

    @BeforeEach
    void setUp() {
        service = new SecuredEventService(delegate, authz);
    }

    private EventResponse event(EventStatus status) {
        return new EventResponse(1L, "CMF-2026", "Festival", "desc", EventCategory.MUSIC, status,
                LocalDateTime.now().plusDays(10), 0, "VEN-SMR-01", "Marina", List.of());
    }

    private EventSummaryResponse summary(EventStatus status) {
        return new EventSummaryResponse(1L, "CMF-2026", "Festival", EventCategory.MUSIC, status,
                LocalDateTime.now().plusDays(10), "Marina");
    }

    @Test
    void publishedEventIsVisibleToEveryone() {
        when(delegate.findByCode("CMF-2026")).thenReturn(event(EventStatus.PUBLISHED));

        assertThat(service.findByCode("CMF-2026").status()).isEqualTo(EventStatus.PUBLISHED);
    }

    // T-SEC-017: un borrador no se expone al público
    @Test
    void draftIsHiddenWithNotFoundForNonOperationalUsers() {
        when(delegate.findByCode("CMF-2026")).thenReturn(event(EventStatus.DRAFT));
        when(authz.hasOperationalRole()).thenReturn(false);

        assertThatThrownBy(() -> service.findByCode("CMF-2026"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void draftIsVisibleToStaffAndAdmin() {
        when(delegate.findByCode("CMF-2026")).thenReturn(event(EventStatus.DRAFT));
        when(authz.hasOperationalRole()).thenReturn(true);

        assertThat(service.findByCode("CMF-2026").status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void searchByArtistOnlyReturnsPublishedEventsToThePublic() {
        when(delegate.findByArtist("Solar Beat"))
                .thenReturn(List.of(summary(EventStatus.PUBLISHED), summary(EventStatus.DRAFT)));
        when(authz.hasOperationalRole()).thenReturn(false);

        assertThat(service.findByArtist("Solar Beat"))
                .hasSize(1)
                .allMatch(event -> event.status() == EventStatus.PUBLISHED);
    }

    @Test
    void searchByArtistReturnsEverythingToStaff() {
        when(delegate.findByArtist("Solar Beat"))
                .thenReturn(List.of(summary(EventStatus.PUBLISHED), summary(EventStatus.DRAFT)));
        when(authz.hasOperationalRole()).thenReturn(true);

        assertThat(service.findByArtist("Solar Beat")).hasSize(2);
    }
}