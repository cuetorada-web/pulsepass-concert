package com.pulsepass.service;

import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.security.SecurityPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    private static final long ANDREA_ID = 1L;
    private static final long CARLOS_ID = 2L;

    @Mock private UserRepository userRepository;
    @Mock private TicketRepository ticketRepository;

    @InjectMocks private AuthorizationService authz;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void loginAs(long id, String... roles) {
        SecurityPrincipal principal = new SecurityPrincipal(id, "andrea", "andrea@email.com", null, true,
                Arrays.stream(roles).map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()));
        SecurityContextHolder.setContext(context);
    }

    @Test
    void ownerCanAccessOwnTicket() {
        loginAs(ANDREA_ID, "USER");
        when(ticketRepository.findOwnerIdByTicketCode("TKT-1")).thenReturn(Optional.of(ANDREA_ID));

        assertThat(authz.isTicketOwner("TKT-1")).isTrue();
    }

    @Test
    void thirdPartyCannotAccessForeignTicket() {
        loginAs(ANDREA_ID, "USER");
        when(ticketRepository.findOwnerIdByTicketCode("TKT-CARLOS")).thenReturn(Optional.of(CARLOS_ID));

        assertThat(authz.isTicketOwner("TKT-CARLOS")).isFalse();
    }

    @Test
    void unknownTicketIsDeniedWithoutRevealingExistence() {
        loginAs(ANDREA_ID, "USER");
        when(ticketRepository.findOwnerIdByTicketCode("NOPE")).thenReturn(Optional.empty());

        assertThat(authz.isTicketOwner("NOPE")).isFalse();
    }

    @Test
    void anonymousIsNeverOwner() {
        assertThat(authz.isTicketOwner("TKT-1")).isFalse();
        assertThat(authz.isCurrentUserEmail("andrea@email.com")).isFalse();
    }

    @Test
    void userCanUseOwnEmail() {
        loginAs(ANDREA_ID, "USER");
        when(userRepository.findIdByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(ANDREA_ID));

        assertThat(authz.isCurrentUserEmail("andrea@email.com")).isTrue();
    }

    // T-SEC-010: compra con el email de otra persona
    @Test
    void userCannotUseAnotherUsersEmail() {
        loginAs(ANDREA_ID, "USER");
        when(userRepository.findIdByEmailIgnoreCase("carlos@email.com")).thenReturn(Optional.of(CARLOS_ID));

        assertThat(authz.isCurrentUserEmail("carlos@email.com")).isFalse();
    }

    @Test
    void userCanUseOwnUsername() {
        loginAs(ANDREA_ID, "USER");
        when(userRepository.findIdByUsername("andrea")).thenReturn(Optional.of(ANDREA_ID));

        assertThat(authz.isCurrentUsername("andrea")).isTrue();
    }

    @Test
    void staffAndAdminAreOperational_userIsNot() {
        loginAs(ANDREA_ID, "USER");
        assertThat(authz.hasOperationalRole()).isFalse();

        loginAs(ANDREA_ID, "USER", "STAFF");
        assertThat(authz.hasOperationalRole()).isTrue();

        loginAs(ANDREA_ID, "USER", "ADMIN");
        assertThat(authz.hasOperationalRole()).isTrue();
    }
}