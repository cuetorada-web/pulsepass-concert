package com.pulsepass.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Política CORS parametrizada (NFR-SEC008). Los orígenes deben ser EXPLÍCITOS:
 * la lista vacía significa "ningún origen de navegador permitido".
 */
@ConfigurationProperties(prefix = "pulsepass.security.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        List<String> allowedMethods,
        List<String> allowedHeaders,
        Duration maxAge
) {

    public CorsProperties {
        allowedOrigins = clean(allowedOrigins);

        // Un comodín abriría la API a cualquier sitio web: la aplicación no arranca así
        if (allowedOrigins.contains("*")) {
            throw new IllegalStateException(
                    "pulsepass.security.cors.allowed-origins must list explicit origins, '*' is not allowed");
        }

        allowedMethods = clean(allowedMethods).isEmpty()
                ? List.of("GET", "POST", "PATCH", "OPTIONS")
                : clean(allowedMethods);

        allowedHeaders = clean(allowedHeaders).isEmpty()
                ? List.of("Authorization", "Content-Type", "X-Request-Id")
                : clean(allowedHeaders);

        maxAge = maxAge == null ? Duration.ofHours(1) : maxAge;
    }

    private static List<String> clean(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().map(String::trim).filter(value -> !value.isEmpty()).toList();
    }
}