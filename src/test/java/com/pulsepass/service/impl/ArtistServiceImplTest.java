package com.pulsepass.service.impl;

import com.pulsepass.domain.Artist;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.ArtistMapper;
import com.pulsepass.repository.ArtistRepository;
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
class ArtistServiceImplTest {

    @Mock
    private ArtistRepository repository;

    @Mock
    private ArtistMapper mapper;

    @InjectMocks
    private ArtistServiceImpl artistService;

    // ---------------------------------------------------------------
    // findById
    // ---------------------------------------------------------------

    @Test
    @DisplayName("findById: artista existente -> retorna ArtistResponse")
    void shouldFindArtistById() {
        // ARRANGE
        Artist artist = mock(Artist.class);
        ArtistResponse expected = mock(ArtistResponse.class);

        when(repository.findById(1L)).thenReturn(Optional.of(artist));
        when(mapper.toResponse(artist)).thenReturn(expected);

        // ACT
        ArtistResponse result = artistService.findById(1L);

        // ASSERT
        assertThat(result).isSameAs(expected);
        verify(repository).findById(1L);
        verify(mapper).toResponse(artist);
    }

    @Test
    @DisplayName("findById: artista inexistente -> ResourceNotFoundException (BR-ARTIST-001)")
    void shouldThrowWhenArtistIdDoesNotExist() {
        // ARRANGE
        when(repository.findById(99L)).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> artistService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Artist not found")
                .hasMessageContaining("99");

        verifyNoInteractions(mapper);
    }

    // ---------------------------------------------------------------
    // findByStageName
    // ---------------------------------------------------------------

    @Test
    @DisplayName("findByStageName: artista existente -> retorna ArtistResponse")
    void shouldFindArtistByStageName() {
        // ARRANGE
        Artist artist = mock(Artist.class);
        ArtistResponse expected = mock(ArtistResponse.class);

        when(repository.findByStageNameIgnoreCase("Solar Beat"))
                .thenReturn(Optional.of(artist));
        when(mapper.toResponse(artist)).thenReturn(expected);

        // ACT
        ArtistResponse result = artistService.findByStageName("Solar Beat");

        // ASSERT
        assertThat(result).isSameAs(expected);
        verify(repository).findByStageNameIgnoreCase("Solar Beat");
        verify(mapper).toResponse(artist);
    }

    @Test
    @DisplayName("findByStageName: artista inexistente -> ResourceNotFoundException (BR-ARTIST-001)")
    void shouldThrowWhenStageNameDoesNotExist() {
        // ARRANGE
        when(repository.findByStageNameIgnoreCase("Unknown"))
                .thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> artistService.findByStageName("Unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Artist not found")
                .hasMessageContaining("Unknown");

        verifyNoInteractions(mapper);
    }

    // ---------------------------------------------------------------
    // findActiveArtists
    // ---------------------------------------------------------------

    @Test
    @DisplayName("findActiveArtists: retorna artistas activos mapeados y conserva el orden (BR-ARTIST-002)")
    void shouldReturnActiveArtistsMapped() {
        // ARRANGE
        Artist first = mock(Artist.class);
        Artist second = mock(Artist.class);
        ArtistResponse firstResponse = mock(ArtistResponse.class);
        ArtistResponse secondResponse = mock(ArtistResponse.class);

        when(repository.findByActiveTrueOrderByStageNameAsc())
                .thenReturn(List.of(first, second));
        when(mapper.toResponse(first)).thenReturn(firstResponse);
        when(mapper.toResponse(second)).thenReturn(secondResponse);

        // ACT
        List<ArtistResponse> result = artistService.findActiveArtists();

        // ASSERT
        assertThat(result).containsExactly(firstResponse, secondResponse);
        verify(repository).findByActiveTrueOrderByStageNameAsc();
        verify(mapper).toResponse(first);
        verify(mapper).toResponse(second);
    }

    @Test
    @DisplayName("findActiveArtists: sin artistas activos -> lista vacía y mapper no se usa")
    void shouldReturnEmptyListWhenNoActiveArtists() {
        // ARRANGE
        when(repository.findByActiveTrueOrderByStageNameAsc())
                .thenReturn(List.of());

        // ACT
        List<ArtistResponse> result = artistService.findActiveArtists();

        // ASSERT
        assertThat(result).isEmpty();
        verify(mapper, never()).toResponse(any(Artist.class));
    }
}