package com.pulsepass.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Bitácora de denegaciones (NFR-SEC006). El requestId lo agrega el patrón de log desde el MDC. */
public final class SecurityAuditLog {

    private static final Logger log = LoggerFactory.getLogger("SECURITY_AUDIT");

    private SecurityAuditLog() {
    }

    /** 401: no hay una identidad válida. */
    public static void unauthorized(HttpServletRequest request) {
        log.warn("DENIED 401 {} {} user={}", request.getMethod(), request.getRequestURI(), currentUser());
    }

    /** 403: hay identidad, pero sin permiso. */
    public static void forbidden(HttpServletRequest request) {
        log.warn("DENIED 403 {} {} user={}", request.getMethod(), request.getRequestURI(), currentUser());
    }

    // Se registra el ID interno, no el correo ni el nombre
    private static String currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof SecurityPrincipal principal) {
            return "id=" + principal.getId();
        }
        return "anonymous";
    }
}