package com.pulsepass.service.impl;

import com.pulsepass.domain.Venue;
import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.VenueMapper;
import com.pulsepass.repository.VenueRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VenueServiceImplTest {

    @Mock
    private VenueRepository repository;

    @Mock
    private VenueMapper mapper;

    @InjectMocks
    private VenueServiceImpl venueService;

    // ---------------------------------------------------------------
    // findByCode  (FR-SVC-001)
    // ---------------------------------------------------------------

    @Test
    @DisplayName("findByCode: venue existente -> retorna VenueResponse")
    void shouldFindVenueByCode() {
        // ARRANGE
        Venue venue = mock(Venue.class);
        VenueResponse expected = mock(VenueResponse.class);

        when(repository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue));
        when(mapper.toResponse(venue)).thenReturn(expected);

        // ACT
        VenueResponse result = venueService.findByCode("VEN-SMR-01");

        // ASSERT
        assertThat(result).isSameAs(expected);
        verify(repository).findByCode("VEN-SMR-01");
        verify(mapper).toResponse(venue);
    }

    @Test
    @DisplayName("findByCode: venue inexistente -> ResourceNotFoundException (BR-VENUE-001)")
    void shouldThrowWhenVenueDoesNotExist() {
        // ARRANGE
        when(repository.findByCode("NOPE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> venueService.findByCode("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Venue not found")
                .hasMessageContaining("NOPE");

        verifyNoInteractions(mapper);
    }

    // ---------------------------------------------------------------
    // findActiveVenues  (FR-SVC-002)
    // ---------------------------------------------------------------

    @Test
    @DisplayName("findActiveVenues: retorna venues activos mapeados y conserva el orden (BR-VENUE-002)")
    void shouldReturnActiveVenuesMapped() {
        // ARRANGE
        Venue first = mock(Venue.class);
        Venue second = mock(Venue.class);
        VenueResponse firstResponse = mock(VenueResponse.class);
        VenueResponse secondResponse = mock(VenueResponse.class);

        when(repository.findByActiveTrueOrderByNameAsc())
                .thenReturn(List.of(first, second));
        when(mapper.toResponse(first)).thenReturn(firstResponse);
        when(mapper.toResponse(second)).thenReturn(secondResponse);

        // ACT
        List<VenueResponse> result = venueService.findActiveVenues();

        // ASSERT
        assertThat(result).containsExactly(firstResponse, secondResponse);
        verify(repository).findByActiveTrueOrderByNameAsc();
        verify(mapper).toResponse(first);
        verify(mapper).toResponse(second);
    }

    @Test
    @DisplayName("findActiveVenues: sin venues activos -> lista vacía y mapper no se usa")
    void shouldReturnEmptyListWhenNoActiveVenues() {
        // ARRANGE
        when(repository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of());

        // ACT
        List<VenueResponse> result = venueService.findActiveVenues();

        // ASSERT
        assertThat(result).isEmpty();
        verify(mapper, never()).toResponse(any(Venue.class));
    }
}