package com.pulsepass;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class FlywayLegacyMigrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("pulsepass")
            .withUsername("postgres")
            .withPassword("postgres");

    private Flyway flyway(String target) {
        FluentConfiguration config = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration");
        if (target != null) {
            config.target(target);
        }
        return config.load();
    }

    private static int count(Statement statement, String sql) throws SQLException {
        try (ResultSet rs = statement.executeQuery(sql)) {
            rs.next();
            return rs.getInt(1);
        }
    }

    @Test
    void v4KeepsLegacyUsersGivesThemUserRoleAndInventsNoPassword() throws Exception {

        // 1) Esquema "antiguo": solo hasta V3, con un usuario ya existente
        flyway("3").migrate();

        try (Connection connection = DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement statement = connection.createStatement()) {

            statement.executeUpdate(
                    "INSERT INTO users (username, email, active) VALUES ('legado', 'legado@email.com', true)");

            // 2) Se aplica V4 sobre un esquema que ya tiene datos
            MigrateResult result = flyway(null).migrate();
            assertThat(result.migrationsExecuted).isEqualTo(1);

            // 3) El usuario sigue ahí, con ROLE_USER y SIN credencial (no puede iniciar sesión)
            assertThat(count(statement, "select count(*) from users where username = 'legado'")).isEqualTo(1);
            assertThat(count(statement, "select count(*) from user_roles where role = 'USER'")).isEqualTo(1);
            assertThat(count(statement, "select count(*) from user_credentials")).isZero();
        }

        // 4) Ejecutar de nuevo no hace nada (idempotente)
        assertThat(flyway(null).migrate().migrationsExecuted).isZero();
    }
}