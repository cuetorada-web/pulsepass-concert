package com.pulsepass.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String ISSUER = "pulsepass-api";

    private static String newSecret() {
        return Encoders.BASE64.encode(Jwts.SIG.HS256.key().build().getEncoded());
    }

    private static JwtService service(String secret, String issuer, Duration ttl) {
        return new JwtService(new JwtProperties(issuer, secret, ttl));
    }

    private static SecurityPrincipal principal() {
        return new SecurityPrincipal(42L, "andrea", "andrea@email.com", null, true,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    void shouldGenerateAndValidateToken() {
        JwtService jwt = service(newSecret(), ISSUER, Duration.ofMinutes(15));

        String token = jwt.generateToken(principal());

        assertThat(jwt.validateAndExtractUserId(token)).isEqualTo(42L);
        assertThat(jwt.getExpiresInSeconds()).isEqualTo(900);
    }

    @Test
    void shouldRejectExpiredToken() {
        JwtService jwt = service(newSecret(), ISSUER, Duration.ofSeconds(-10));

        String token = jwt.generateToken(principal());

        assertThatThrownBy(() -> jwt.validateAndExtractUserId(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void shouldRejectTokenSignedWithAnotherKey() {
        String token = service(newSecret(), ISSUER, Duration.ofMinutes(15)).generateToken(principal());
        JwtService other = service(newSecret(), ISSUER, Duration.ofMinutes(15));

        assertThatThrownBy(() -> other.validateAndExtractUserId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void shouldRejectWrongIssuer() {
        String secret = newSecret();
        String token = service(secret, "otro-emisor", Duration.ofMinutes(15)).generateToken(principal());
        JwtService jwt = service(secret, ISSUER, Duration.ofMinutes(15));

        assertThatThrownBy(() -> jwt.validateAndExtractUserId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void shouldRejectTamperedToken() {
        JwtService jwt = service(newSecret(), ISSUER, Duration.ofMinutes(15));
        String[] parts = jwt.generateToken(principal()).split("\\.");

        // Cambiamos el primer carácter de la firma
        String badSignature = (parts[2].charAt(0) == 'A' ? "B" : "A") + parts[2].substring(1);
        String tampered = parts[0] + "." + parts[1] + "." + badSignature;

        assertThatThrownBy(() -> jwt.validateAndExtractUserId(tampered))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void shouldRejectBlankToken() {
        JwtService jwt = service(newSecret(), ISSUER, Duration.ofMinutes(15));

        assertThatThrownBy(() -> jwt.validateAndExtractUserId(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shouldFailToStartWithWeakKey() {
        String weak = Encoders.BASE64.encode("demasiado-corta".getBytes());

        assertThatThrownBy(() -> service(weak, ISSUER, Duration.ofMinutes(15)))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void shouldFailToStartWithoutKey() {
        assertThatThrownBy(() -> service(null, ISSUER, Duration.ofMinutes(15)))
                .isInstanceOf(IllegalStateException.class);
    }
}