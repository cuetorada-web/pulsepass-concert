package com.pulsepass.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Credencial 1:1 con User. Vive en su propia tabla para que el hash
 * nunca pueda terminar serializado por MapStruct junto a UserResponse.
 */
@Entity
@Table(name = "user_credentials")
public class UserCredential {

    // La PK es la misma FK hacia users (@MapsId la toma de "user")
    @Id
    @Column(name = "user_id")
    private Long userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    protected UserCredential() {
        // Requerido por JPA
    }

    public UserCredential(User user, String passwordHash) {
        this.user = user;
        this.passwordHash = passwordHash;
        this.passwordChangedAt = LocalDateTime.now();
    }

    public Long getUserId() { return userId; }
    public User getUser() { return user; }
    public String getPasswordHash() { return passwordHash; }
    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
}