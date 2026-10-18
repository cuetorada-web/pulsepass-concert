package com.pulsepass.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/** Escribe el mismo contrato de ErrorResponse (6 campos) fuera del DispatcherServlet. */
final class SecurityErrorWriter {

    private SecurityErrorWriter() {
    }

    static void write(HttpServletResponse response, HttpStatus status, String message)
            throws IOException {

        if (response.isCommitted()) {
            return; // la respuesta debe emitirse una sola vez
        }

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String body = """
                {"timestamp":"%s","status":%d,"error":"%s","message":"%s","details":{}}
                """.formatted(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message);

        response.getWriter().write(body);
    }
}