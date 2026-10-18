package com.pulsepass.service;

import com.pulsepass.domain.Role;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.domain.UserRole;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.SecurityPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String RAW_PASSWORD = "UnaFraseSegura2026!";

    @Mock private UserService userService;
    @Mock private UserRepository userRepository;
    @Mock private UserCredentialRepository credentialRepository;
    @Mock private UserRoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;

    @InjectMocks private AuthService authService;

    private RegisterUserRequest registerRequest() {
        return new RegisterUserRequest("andrea", "andrea@email.com", "Andrea", "Lopez",
                "3000000000", "Santa Marta", LocalDate.of(2000, 5, 10), RAW_PASSWORD);
    }

    private UserResponse created() {
        return new UserResponse(10L, "andrea", "andrea@email.com", true, "Andrea", "Lopez");
    }

    private SecurityPrincipal principal() {
        return new SecurityPrincipal(10L, "andrea", "andrea@email.com", "$2a$10$hash", true,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    // =====================================================================
    // Registro
    // =====================================================================

    // FR-SECAUTH-001 / NFR-SEC009
    @Test
    void registerStoresHashedCredentialAndOnlyTheUserRole() {
        RegisterUserRequest request = registerRequest();
        when(userService.register(request)).thenReturn(created());
        when(userRepository.getReferenceById(10L)).thenReturn(new User("andrea", "andrea@email.com", true));
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn("$2a$10$hash");

        UserResponse result = authService.register(request);

        assertThat(result).isEqualTo(created());

        ArgumentCaptor<UserCredential> credential = ArgumentCaptor.forClass(UserCredential.class);
        verify(credentialRepository).save(credential.capture());
        assertThat(credential.getValue().getPasswordHash())
                .isEqualTo("$2a$10$hash")
                .isNotEqualTo(RAW_PASSWORD);

        ArgumentCaptor<UserRole> role = ArgumentCaptor.forClass(UserRole.class);
        verify(roleRepository, times(1)).save(role.capture());
        assertThat(role.getValue().getId().getUserId()).isEqualTo(10L);
        assertThat(role.getValue().getId().getRole()).isEqualTo(Role.USER);
    }

    // Las reglas de negocio de UserService siguen mandando: si falla, no se crea nada más
    @Test
    void registerCreatesNoCredentialWhenTheUserAlreadyExists() {
        RegisterUserRequest request = registerRequest();
        when(userService.register(request))
                .thenThrow(new DuplicateResourceException("Username already exists: andrea"));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);

        verifyNoInteractions(passwordEncoder, credentialRepository, roleRepository);
    }

    // Si falla el hash, no se asigna rol (y la transacción real revierte también al usuario)
    @Test
    void registerAssignsNoRoleWhenHashingFails() {
        RegisterUserRequest request = registerRequest();
        when(userService.register(request)).thenReturn(created());
        when(userRepository.getReferenceById(10L)).thenReturn(new User("andrea", "andrea@email.com", true));
        when(passwordEncoder.encode(any())).thenThrow(new IllegalStateException("fallo simulado"));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalStateException.class);

        verify(credentialRepository, never()).save(any());
        verify(roleRepository, never()).save(any());
    }

    // =====================================================================
    // Login
    // =====================================================================

    // FR-SECAUTH-002
    @Test
    void loginReturnsABearerTokenAfterASuccessfulAuthentication() {
        SecurityPrincipal principal = principal();
        Authentication authenticated =
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any(Authentication.class))).thenReturn(authenticated);
        when(jwtService.generateToken(principal)).thenReturn("jwt-de-prueba");
        when(jwtService.getExpiresInSeconds()).thenReturn(900L);

        AuthResponse response = authService.login(new LoginRequest("andrea", RAW_PASSWORD));

        assertThat(response.accessToken()).isEqualTo("jwt-de-prueba");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);

        // Se autentica con las credenciales recibidas, aún sin confirmar
        ArgumentCaptor<Authentication> sent = ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(sent.capture());
        assertThat(sent.getValue().getPrincipal()).isEqualTo("andrea");
        assertThat(sent.getValue().getCredentials()).isEqualTo(RAW_PASSWORD);
        assertThat(sent.getValue().isAuthenticated()).isFalse();
    }

    // FR-SECAUTH-003: la contraseña incorrecta no emite token
    @Test
    void wrongCredentialsAreRejectedWithoutIssuingAToken() {
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("andrea", "incorrecta-incorrecta")))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(jwtService);
    }

    // FR-SECAUTH-004: el usuario inactivo no obtiene token
    @Test
    void inactiveUserIsRejectedWithoutIssuingAToken() {
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new DisabledException("User is disabled"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("andrea", RAW_PASSWORD)))
                .isInstanceOf(AuthenticationException.class);

        verifyNoInteractions(jwtService);
    }

    // BCrypt solo considera 72 bytes: más allá no puede ser una contraseña válida
    @Test
    void passwordLongerThanTheBcryptLimitIsRejectedWithoutAuthenticating() {
        String tooLong = "a".repeat(73);
        String tooLongInBytes = "ñ".repeat(40); // 40 caracteres, pero 80 bytes en UTF-8

        assertThatThrownBy(() -> authService.login(new LoginRequest("andrea", tooLong)))
                .isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> authService.login(new LoginRequest("andrea", tooLongInBytes)))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(authenticationManager, jwtService);
    }
}