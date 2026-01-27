package com.blog.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Objects;
import java.util.regex.Pattern;

@Configuration
public class DatabaseProvisioningConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseProvisioningConfig.class);
    private static final String POSTGRES_PREFIX = "jdbc:postgresql://";
    private static final Pattern SAFE_DB_NAME = Pattern.compile("^[A-Za-z0-9_]+$");

    private final DataSourceProperties dataSourceProperties;

    @Value("${app.database.auto-create:true}")
    private boolean autoCreateDatabase;

    @Value("${app.database.admin-database:postgres}")
    private String adminDatabase;

    public DatabaseProvisioningConfig(DataSourceProperties dataSourceProperties) {
        this.dataSourceProperties = dataSourceProperties;
    }

    /**
     * Ensure the target database exists before Flyway tries to migrate.
     * This requires the configured user to have CREATEDB privilege.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            if (autoCreateDatabase) {
                ensureDatabaseExists();
            }
            flyway.migrate();
        };
    }

    private void ensureDatabaseExists() {
        String url = dataSourceProperties.getUrl();
        String username = dataSourceProperties.getUsername();
        String password = dataSourceProperties.getPassword();

        if (url == null || !url.startsWith(POSTGRES_PREFIX)) {
            log.info("Datasource is not PostgreSQL or URL is missing; skipping auto-create database.");
            return;
        }

        ParsedJdbcUrl parsed = parsePostgresJdbcUrl(url);
        validateDatabaseName(parsed.database());

        if (Objects.equals(parsed.database(), adminDatabase)) {
            log.info("Target database equals admin database ({}); skipping auto-create.", adminDatabase);
            return;
        }

        String adminUrl = buildAdminJdbcUrl(parsed);
        log.info("Checking database existence via admin URL: {}", adminUrl);

        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            log.warn("PostgreSQL driver not found while auto-creating database.");
            return;
        }

        try (Connection connection = DriverManager.getConnection(adminUrl, username, password)) {
            if (databaseExists(connection, parsed.database())) {
                log.info("Database '{}' already exists; continuing.", parsed.database());
                return;
            }

            createDatabase(connection, parsed.database());
            log.info("Database '{}' created successfully.", parsed.database());
        } catch (Exception ex) {
            log.error("Failed to auto-create database '{}': {}", parsed.database(), ex.getMessage());
            throw new IllegalStateException("Auto-create database failed", ex);
        }
    }

    private ParsedJdbcUrl parsePostgresJdbcUrl(String jdbcUrl) {
        String remainder = jdbcUrl.substring(POSTGRES_PREFIX.length());

        String query = null;
        int queryIndex = remainder.indexOf('?');
        if (queryIndex >= 0) {
            query = remainder.substring(queryIndex + 1);
            remainder = remainder.substring(0, queryIndex);
        }

        int slashIndex = remainder.indexOf('/');
        if (slashIndex < 0 || slashIndex == remainder.length() - 1) {
            throw new IllegalArgumentException("Invalid PostgreSQL JDBC URL: " + jdbcUrl);
        }

        String hostPort = remainder.substring(0, slashIndex);
        String database = remainder.substring(slashIndex + 1);

        return new ParsedJdbcUrl(hostPort, database, query);
    }

    private String buildAdminJdbcUrl(ParsedJdbcUrl parsed) {
        StringBuilder sb = new StringBuilder(POSTGRES_PREFIX)
            .append(parsed.hostPort())
            .append('/')
            .append(adminDatabase);

        if (parsed.query() != null && !parsed.query().isBlank()) {
            sb.append('?').append(parsed.query());
        }
        return sb.toString();
    }

    private void validateDatabaseName(String database) {
        if (!SAFE_DB_NAME.matcher(database).matches()) {
            throw new IllegalArgumentException(
                "Unsafe database name for auto-create: '" + database + "'. " +
                "Only letters, numbers, and underscore are allowed."
            );
        }
    }

    private boolean databaseExists(Connection connection, String database) throws Exception {
        String sql = "SELECT 1 FROM pg_database WHERE datname = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, database);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private void createDatabase(Connection connection, String database) throws Exception {
        String sql = "CREATE DATABASE \"" + database + "\"";
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private record ParsedJdbcUrl(String hostPort, String database, String query) {
    }
}