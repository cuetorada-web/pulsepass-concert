package com.pulsepass.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Asigna un identificador a cada petición y lo deja disponible en los logs (MDC).
 * Sin @Component a propósito, igual que JwtAuthenticationFilter: se instancia en SecurityConfig
 * para que corra dentro de la cadena de seguridad y no se registre dos veces.
 */
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";

    // Solo se acepta un ID "seguro": evita inyectar saltos de línea o texto falso en los logs
    private static final Pattern SAFE_ID = Pattern.compile("^[A-Za-z0-9._-]{1,64}$");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String incoming = request.getHeader(HEADER);
        String requestId = (incoming != null && SAFE_ID.matcher(incoming).matches())
                ? incoming
                : UUID.randomUUID().toString();

        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId); // se fija antes de la cadena: también sale en 401 y 403

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY); // los hilos del servidor se reutilizan: nunca dejar el ID colgado
        }
    }
}