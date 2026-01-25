package com.newbie.newbiecore.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Configuración que crea automáticamente la base de datos PostgreSQL si no
 * existe.
 * Esto simplifica el despliegue en nuevos servidores.
 * 
 * Se activa por defecto. Para desactivar: app.database.auto-create=false
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "app.database.auto-create", havingValue = "true", matchIfMissing = true)
public class DatabaseAutoCreateConfig {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @PostConstruct
    public void createDatabaseIfNotExists() {
        // Extraer el nombre de la base de datos de la URL
        // Formato: jdbc:postgresql://host:port/database_name
        String dbName = extractDatabaseName(datasourceUrl);
        String baseUrl = extractBaseUrl(datasourceUrl);

        if (dbName == null || baseUrl == null) {
            log.warn("No se pudo extraer la información de la base de datos de la URL: {}", datasourceUrl);
            return;
        }

        log.info("Verificando si la base de datos '{}' existe...", dbName);

        // Conectar a la base de datos 'postgres' (siempre existe) para verificar/crear
        String postgresUrl = baseUrl + "/postgres";

        try (Connection conn = DriverManager.getConnection(postgresUrl, username, password)) {
            // Verificar si la base de datos existe
            boolean exists = false;
            try (Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery(
                            "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'")) {
                exists = rs.next();
            }

            if (!exists) {
                log.info("La base de datos '{}' no existe. Creándola...", dbName);
                try (Statement stmt = conn.createStatement()) {
                    stmt.executeUpdate("CREATE DATABASE " + dbName);
                    log.info("✅ Base de datos '{}' creada exitosamente.", dbName);
                }
            } else {
                log.info("✅ La base de datos '{}' ya existe.", dbName);
            }
        } catch (Exception e) {
            log.warn("No se pudo verificar/crear la base de datos automáticamente: {}. " +
                    "Esto es normal si la base de datos ya existe o si no hay permisos.",
                    e.getMessage());
            // No lanzamos excepción para permitir que la aplicación intente conectar
            // normalmente
        }
    }

    /**
     * Extrae el nombre de la base de datos de una URL JDBC PostgreSQL.
     * Ejemplo: jdbc:postgresql://localhost:5432/newbie_db -> newbie_db
     */
    private String extractDatabaseName(String url) {
        try {
            // Remover parámetros si existen (ej: ?ssl=true)
            String cleanUrl = url.split("\\?")[0];

            // Obtener la última parte después del último /
            int lastSlash = cleanUrl.lastIndexOf('/');
            if (lastSlash != -1 && lastSlash < cleanUrl.length() - 1) {
                return cleanUrl.substring(lastSlash + 1);
            }
        } catch (Exception e) {
            log.error("Error extrayendo nombre de base de datos: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Extrae la URL base (sin el nombre de la base de datos).
     * Ejemplo: jdbc:postgresql://localhost:5432/newbie_db ->
     * jdbc:postgresql://localhost:5432
     */
    private String extractBaseUrl(String url) {
        try {
            // Remover parámetros si existen
            String cleanUrl = url.split("\\?")[0];

            int lastSlash = cleanUrl.lastIndexOf('/');
            if (lastSlash != -1) {
                return cleanUrl.substring(0, lastSlash);
            }
        } catch (Exception e) {
            log.error("Error extrayendo URL base: {}", e.getMessage());
        }
        return null;
    }
}
