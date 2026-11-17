package com.pulsepass.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String ISSUER = "pulsepass-api";

    @Mock private CustomUserDetailsService userDetailsService;

    private String secret;
    private JwtService jwtService;
    private JwtAuthenticationFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain chain;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        secret = Encoders.BASE64.encode(Jwts.SIG.HS256.key().build().getEncoded());
        jwtService = new JwtService(new JwtProperties(ISSUER, secret, Duration.ofMinutes(15)));
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        request = new MockHttpServletRequest("GET", "/api/tickets/TKT-1");
        response = new MockHttpServletResponse();
        chain = new MockFilterChain();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private SecurityPrincipal principal(boolean enabled) {
        return new SecurityPrincipal(1L, "andrea", "andrea@email.com", null, enabled,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private String validToken() {
        return jwtService.generateToken(principal(true));
    }

    /** El filtro nunca responde 401: deja pasar la petición sin identidad y SecurityConfig decide. */
    private void assertAnonymousAndChainContinued() {
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void noAuthorizationHeaderContinuesAnonymously() throws Exception {
        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void validTokenAuthenticatesWithTheCurrentPrincipal() throws Exception {
        SecurityPrincipal current = principal(true);
        when(userDetailsService.loadUserById(1L)).thenReturn(current);
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + validToken());

        filter.doFilter(request, response, chain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getPrincipal()).isSameAs(current);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void garbageTokenIsIgnored() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer esto-no-es-un-jwt");

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void emptyBearerIsIgnored() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer ");

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void tokenSignedWithAnotherKeyIsIgnored() throws Exception {
        String otherSecret = Encoders.BASE64.encode(Jwts.SIG.HS256.key().build().getEncoded());
        JwtService otherIssuer = new JwtService(new JwtProperties(ISSUER, otherSecret, Duration.ofMinutes(15)));
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + otherIssuer.generateToken(principal(true)));

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void expiredTokenIsIgnored() throws Exception {
        JwtService shortLived = new JwtService(new JwtProperties(ISSUER, secret, Duration.ofSeconds(-30)));
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + shortLived.generateToken(principal(true)));

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void nonBearerSchemeIsIgnored() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Basic YW5kcmVhOnNlY3JldG8=");

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    // Dos headers Authorization: no se autentica con ninguno
    @Test
    void duplicatedAuthorizationHeaderIsIgnored() throws Exception {
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + validToken());
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + validToken());

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    // FR-SECAUTH-007: el JWT solo se acepta por el encabezado, nunca por la URL
    @Test
    void tokenInQueryStringIsIgnored() throws Exception {
        request.setParameter("access_token", validToken());

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
        verifyNoInteractions(userDetailsService);
    }

    // SEC011: token válido, pero el usuario fue desactivado
    @Test
    void inactiveUserIsNotAuthenticated() throws Exception {
        when(userDetailsService.loadUserById(1L)).thenReturn(principal(false));
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + validToken());

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
    }

    // Token válido de un usuario que ya no existe: sin excepción, sin 500
    @Test
    void unknownUserIsNotAuthenticated() throws Exception {
        when(userDetailsService.loadUserById(1L)).thenThrow(new UsernameNotFoundException("gone"));
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + validToken());

        filter.doFilter(request, response, chain);

        assertAnonymousAndChainContinued();
    }

    // No se sobrescribe una autenticación que ya estaba en el contexto
    @Test
    void doesNotOverwriteAnExistingAuthentication() throws Exception {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                "otro-usuario", null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        SecurityContextHolder.setContext(context);
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + validToken());

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isEqualTo("otro-usuario");
        verifyNoInteractions(userDetailsService);
    }
}