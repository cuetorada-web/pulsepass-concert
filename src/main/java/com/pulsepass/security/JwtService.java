package com.pulsepass.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final String EXPECTED_ALGORITHM = "HS256";
    private static final int MIN_KEY_BYTES = 32;

    private final JwtProperties properties;
    private final SecretKey key;
    private final JwtParser parser;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = buildKey(properties.secretBase64());
        // El parser es inmutable y thread-safe: se construye una sola vez
        this.parser = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(properties.issuer())
                .build();
    }

    /** Falla al arrancar si la clave falta, no es Base64 o es débil (PRD 12.2). */
    private static SecretKey buildKey(String secretBase64) {
        if (secretBase64 == null || secretBase64.isBlank()) {
            throw new IllegalStateException("PULSEPASS_JWT_SECRET_BASE64 is missing");
        }

        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secretBase64.trim());
        } catch (RuntimeException ex) {
            throw new IllegalStateException("JWT secret is not valid Base64");
        }

        if (bytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT secret must be at least " + MIN_KEY_BYTES + " bytes after Base64 decoding");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(SecurityPrincipal principal) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(principal.getId().toString())   // ID persistente, no el email
                .issuer(properties.issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.accessTokenTtl())))
                .id(UUID.randomUUID().toString())        // jti
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public long getExpiresInSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    /**
     * Verifica firma, issuer y expiración (lo hace JJWT) y además exige:
     * algoritmo HS256, y presencia de exp, jti y sub numérico.
     * Devuelve el ID de usuario. Cualquier problema lanza JwtException
     * (o IllegalArgumentException si el token es nulo o vacío).
     */
    public Long validateAndExtractUserId(String token) {

        Jws<Claims> jws = parser.parseSignedClaims(token);

        if (!EXPECTED_ALGORITHM.equals(jws.getHeader().getAlgorithm())) {
            throw new JwtException("Unexpected signing algorithm");
        }

        Claims claims = jws.getPayload();

        if (claims.getExpiration() == null) {
            throw new JwtException("Missing exp claim");
        }
        if (claims.getId() == null || claims.getId().isBlank()) {
            throw new JwtException("Missing jti claim");
        }

        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtException("Missing sub claim");
        }

        try {
            return Long.valueOf(subject);
        } catch (NumberFormatException ex) {
            throw new JwtException("Invalid sub claim");
        }
    }
}