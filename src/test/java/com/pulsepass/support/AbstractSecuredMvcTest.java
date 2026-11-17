package com.pulsepass.support;

import com.pulsepass.security.CustomUserDetailsService;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.SecurityPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Arrays;

import static org.mockito.Mockito.when;

/**
 * Base para tests de controller con seguridad real.
 * Genera tokens JWT verdaderos con el JwtService real; la "base de datos" de usuarios
 * es un mock de CustomUserDetailsService que devuelve el principal indicado.
 */
public abstract class AbstractSecuredMvcTest {

    @Autowired private WebApplicationContext context;
    @Autowired protected JwtService jwtService;

    @MockitoBean protected CustomUserDetailsService userDetailsService;

    protected MockMvc mockMvc;

    /**
     * springSecurity() hace dos cosas: monta la cadena de filtros REAL y habilita que
     * @WithMockUser llegue al request. Sin esto, @WithMockUser no tiene ningún efecto.
     */
    @BeforeEach
    void applySecurityToMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    protected SecurityPrincipal principal(long userId, boolean enabled, String... roles) {
        return new SecurityPrincipal(
                userId,
                "user" + userId,
                "user" + userId + "@email.com",
                null,
                enabled,
                Arrays.stream(roles)
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .toList());
    }

    /** Header "Bearer <jwt>" válido de un usuario activo con los roles indicados. */
    protected String bearer(long userId, String... roles) {
        SecurityPrincipal principal = principal(userId, true, roles);
        when(userDetailsService.loadUserById(userId)).thenReturn(principal);
        return "Bearer " + jwtService.generateToken(principal);
    }

    /** Token válido criptográficamente, pero de un usuario que luego fue desactivado. */
    protected String bearerOfInactiveUser(long userId) {
        SecurityPrincipal principal = principal(userId, false, "USER");
        when(userDetailsService.loadUserById(userId)).thenReturn(principal);
        return "Bearer " + jwtService.generateToken(principal);
    }
}