-- =========================================================
-- V4__security_credentials_roles.sql
-- PulsePass - Fase 4: credenciales y roles
-- =========================================================

CREATE TABLE user_credentials (
    user_id              BIGINT       PRIMARY KEY,
    password_hash        VARCHAR(100) NOT NULL,
    password_changed_at  TIMESTAMP,

    CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_roles (
    user_id  BIGINT      NOT NULL,
    role     VARCHAR(20) NOT NULL,

    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_user_roles_role CHECK (role IN ('USER', 'STAFF', 'ADMIN'))
);

-- Usuarios legados: reciben ROLE_USER, pero NO se les crea credencial.
-- Sin password_hash no pueden iniciar sesión hasta una activación segura
-- (el PRD prohíbe inventar contraseñas por defecto).
INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users;
