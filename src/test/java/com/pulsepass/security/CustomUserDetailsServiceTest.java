package com.pulsepass.security;

import com.pulsepass.domain.Role;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserCredentialRepository credentialRepository;
    @Mock private UserRoleRepository roleRepository;

    @InjectMocks private CustomUserDetailsService service;

    // User no tiene setId (lo genera la base de datos), así que se fija por reflexión
    private User user(long id, boolean active) {
        User user = new User("andrea", "andrea@email.com", active);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private List<String> authorityNames(SecurityPrincipal principal) {
        return principal.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }

    @Test
    void loadsActiveUserByUsernameWithHashAndRoles() {
        User user = user(1L, true);
        when(userRepository.findByUsername("andrea")).thenReturn(Optional.of(user));
        when(credentialRepository.findById(1L))
                .thenReturn(Optional.of(new UserCredential(user, "$2a$10$hash")));
        when(roleRepository.findRolesByUserId(1L)).thenReturn(List.of(Role.USER));

        SecurityPrincipal principal = (SecurityPrincipal) service.loadUserByUsername("andrea");

        assertThat(principal.getId()).isEqualTo(1L);
        assertThat(principal.getUsername()).isEqualTo("andrea");
        assertThat(principal.getEmail()).isEqualTo("andrea@email.com");
        assertThat(principal.getPassword()).isEqualTo("$2a$10$hash");
        assertThat(principal.isEnabled()).isTrue();
        assertThat(authorityNames(principal)).containsExactly("ROLE_USER");
    }

    // El login admite usuario o correo: si trae "@" se busca por correo
    @Test
    void identifierWithAtSignIsLookedUpByEmail() {
        User user = user(1L, true);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(user));
        when(credentialRepository.findById(1L))
                .thenReturn(Optional.of(new UserCredential(user, "$2a$10$hash")));
        when(roleRepository.findRolesByUserId(1L)).thenReturn(List.of(Role.USER));

        SecurityPrincipal principal = (SecurityPrincipal) service.loadUserByUsername("andrea@email.com");

        assertThat(principal.getId()).isEqualTo(1L);
        verify(userRepository, never()).findByUsername(any());
    }

    // FR-SECAUTH-003: mensaje genérico, no revela si el usuario existe
    @Test
    void unknownUserGetsGenericMessage() {
        when(userRepository.findByUsername("fantasma")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("fantasma"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Invalid credentials");
    }

    // Usuario anterior a V4: existe pero no tiene credencial. Mismo mensaje que el anterior.
    @Test
    void legacyUserWithoutCredentialGetsTheSameGenericMessage() {
        when(userRepository.findByUsername("andrea")).thenReturn(Optional.of(user(1L, true)));
        when(credentialRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("andrea"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Invalid credentials");
    }

    // FR-SECAUTH-004: el usuario inactivo se carga como deshabilitado (Spring lo rechaza después)
    @Test
    void inactiveUserIsLoadedAsDisabled() {
        User user = user(1L, false);
        when(userRepository.findByUsername("andrea")).thenReturn(Optional.of(user));
        when(credentialRepository.findById(1L))
                .thenReturn(Optional.of(new UserCredential(user, "$2a$10$hash")));
        when(roleRepository.findRolesByUserId(1L)).thenReturn(List.of(Role.USER));

        SecurityPrincipal principal = (SecurityPrincipal) service.loadUserByUsername("andrea");

        assertThat(principal.isEnabled()).isFalse();
    }

    // Ruta del filtro JWT: roles ACTUALES y nunca el hash
    @Test
    void loadByIdReturnsCurrentRolesWithoutHash() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(user(5L, true)));
        when(roleRepository.findRolesByUserId(5L)).thenReturn(List.of(Role.USER, Role.STAFF));

        SecurityPrincipal principal = service.loadUserById(5L);

        assertThat(authorityNames(principal)).containsExactlyInAnyOrder("ROLE_USER", "ROLE_STAFF");
        assertThat(principal.getPassword()).isNull();
        verifyNoInteractions(credentialRepository);
    }

    @Test
    void loadByIdOfUnknownUserFails() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserById(99L))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}