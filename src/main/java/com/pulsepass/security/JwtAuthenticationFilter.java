package com.pulsepass.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * NO lleva @Component a propósito: si fuera un bean, Spring Boot lo registraría
 * también como filtro global del servidor y correría fuera de la cadena de seguridad.
 * Se instancia dentro de SecurityConfig.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        List<String> headers = Collections.list(request.getHeaders(HttpHeaders.AUTHORIZATION));

        // Solo intentamos autenticar con EXACTAMENTE un header Bearer y sin
        // autenticación previa en el contexto. Cualquier otro caso: seguimos sin
        // autenticar y las reglas de la cadena deciden (401 o ruta pública).
        if (headers.size() == 1
                && headers.get(0).startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            try {
                String token = headers.get(0).substring(BEARER_PREFIX.length()).trim();

                Long userId = jwtService.validateAndExtractUserId(token);

                // Revalida estado y roles ACTUALES contra la base de datos (SEC011)
                SecurityPrincipal principal = userDetailsService.loadUserById(userId);

                if (principal.isEnabled()) {
                    UsernamePasswordAuthenticationToken authentication =
                            UsernamePasswordAuthenticationToken.authenticated(
                                    principal, null, principal.getAuthorities());
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(authentication);
                    SecurityContextHolder.setContext(context);
                }

            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ex) {
                // Token vencido, alterado, malformado, usuario inexistente...
                // Nunca se registra el token, solo el tipo de fallo (NFR-SEC001).
                SecurityContextHolder.clearContext();
                log.debug("Bearer token rejected: {}", ex.getClass().getSimpleName());
            }
        }

        filterChain.doFilter(request, response);
    }
}