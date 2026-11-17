package com.pulsepass.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        SecurityAuditLog.unauthorized(request);   // NUEVO

        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        // Mensaje genérico: no revela si el token estaba vencido, alterado, etc. (SEC009)
        SecurityErrorWriter.write(response, HttpStatus.UNAUTHORIZED,
                "Credenciales ausentes o inválidas");
    }
}