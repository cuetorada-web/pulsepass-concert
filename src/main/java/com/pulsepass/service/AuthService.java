package com.pulsepass.service;

import com.pulsepass.domain.Role;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.domain.UserRole;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.SecurityPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int BCRYPT_MAX_BYTES = 72;

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserCredentialRepository credentialRepository;
    private final UserRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       UserCredentialRepository credentialRepository,
                       UserRoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * FR-SECAUTH-001: User + UserProfile + credencial BCrypt + ROLE_USER, todo o nada.
     * userService.register() es @Transactional y se UNE a esta transacción:
     * si falla el hash o el rol, también se revierte el usuario.
     */
    @Transactional
    public UserResponse register(RegisterUserRequest request) {

        // Reglas de negocio previas (unicidad, fecha de nacimiento...) siguen en UserService
        UserResponse created = userService.register(request);

        User user = userRepository.getReferenceById(created.id());

        credentialRepository.save(new UserCredential(user, passwordEncoder.encode(request.password())));

        // El rol inicial es SIEMPRE USER; el cliente no puede pedir otro (NFR-SEC009)
        roleRepository.save(new UserRole(created.id(), Role.USER));

        return created;
    }

    /** FR-SECAUTH-002/003/004: cualquier fallo de autenticación sale como 401 genérico. */
    public AuthResponse login(LoginRequest request) {

        // BCrypt solo considera 72 bytes: más allá no puede ser una contraseña válida
        if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw new BadCredentialsException("Invalid credentials");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.identifier(), request.password()));

            SecurityPrincipal principal = (SecurityPrincipal) authentication.getPrincipal();

            log.info("Login successful for userId={}", principal.getId());

            return new AuthResponse(
                    jwtService.generateToken(principal),
                    "Bearer",
                    jwtService.getExpiresInSeconds());

        } catch (AuthenticationException ex) {
            // NFR-SEC006: se registra el fallo, nunca la contraseña
            log.warn("Login failed ({})", ex.getClass().getSimpleName());
            throw ex;
        }
    }
}