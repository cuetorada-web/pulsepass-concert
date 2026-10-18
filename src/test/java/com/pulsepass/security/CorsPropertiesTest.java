package com.pulsepass.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CorsPropertiesTest {

    @Test
    void defaultsAreRestrictive() {
        CorsProperties properties = new CorsProperties(null, null, null, null);

        assertThat(properties.allowedOrigins()).isEmpty();
        assertThat(properties.allowedMethods()).containsExactly("GET", "POST", "PATCH", "OPTIONS");
        assertThat(properties.allowedHeaders()).containsExactly("Authorization", "Content-Type", "X-Request-Id");
        assertThat(properties.maxAge()).isEqualTo(Duration.ofHours(1));
    }

    // La aplicación debe negarse a arrancar con un comodín
    @Test
    void wildcardOriginIsRejected() {
        assertThatThrownBy(() -> new CorsProperties(List.of("*"), null, null, null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void blankEntriesAreDroppedAndValuesAreTrimmed() {
        CorsProperties properties = new CorsProperties(
                List.of(" http://localhost:5173 ", "", "   "), null, null, null);

        assertThat(properties.allowedOrigins()).containsExactly("http://localhost:5173");
    }
}