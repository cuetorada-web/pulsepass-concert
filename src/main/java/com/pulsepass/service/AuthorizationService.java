package com.pulsepass.service;

import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.security.SecurityPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;

/**
 * Políticas de propiedad. Se usa desde SpEL: @PreAuthorize("... @authz.isTicketOwner(#ticketCode)").
 * Nunca confía en un ID o email enviado por el cliente: compara contra el principal
 * que construyó el filtro JWT y contra el dueño leído de la base de datos.
 */
@Component("authz")
public class AuthorizationService {

    private static final Set<String> OPERATIONAL_ROLES = Set.of("ROLE_STAFF", "ROLE_ADMIN");

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    public AuthorizationService(UserRepository userRepository, TicketRepository ticketRepository) {
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
    }

    /** ¿El email pertenece al usuario autenticado? Compara por ID persistente. */
    public boolean isCurrentUserEmail(String email) {
        if (email == null) {
            return false;
        }
        return currentPrincipal()
                .map(principal -> userRepository.findIdByEmailIgnoreCase(email)
                        .map(id -> id.equals(principal.getId()))
                        .orElse(false))
                .orElse(false);
    }

    /** ¿El username pertenece al usuario autenticado? */
    public boolean isCurrentUsername(String username) {
        if (username == null) {
            return false;
        }
        return currentPrincipal()
                .map(principal -> userRepository.findIdByUsername(username)
                        .map(id -> id.equals(principal.getId()))
                        .orElse(false))
                .orElse(false);
    }

    /** ¿El ticket es del usuario autenticado? Si no existe, devuelve false (no se filtra existencia). */
    public boolean isTicketOwner(String ticketCode) {
        if (ticketCode == null) {
            return false;
        }
        return currentPrincipal()
                .map(principal -> ticketRepository.findOwnerIdByTicketCode(ticketCode)
                        .map(ownerId -> ownerId.equals(principal.getId()))
                        .orElse(false))
                .orElse(false);
    }

    /** STAFF o ADMIN (identidades privilegiadas para operación y borradores). */
    public boolean hasOperationalRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(OPERATIONAL_ROLES::contains);
    }

    private Optional<SecurityPrincipal> currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof SecurityPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty(); // anónimo u otro tipo de principal
    }
}