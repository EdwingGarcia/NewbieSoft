package com.newbie.newbiecore.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Inicializador que crea la base de datos PostgreSQL ANTES de que Spring
 * intente conectarse. Se ejecuta muy temprano en el ciclo de vida de Spring.
 */
public class DatabaseInitializer implements EnvironmentPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE; // Ejecutar después de que las propiedades estén cargadas
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Verificar si está habilitada la auto-creación
        String autoCreate = environment.getProperty("app.database.auto-create", "true");
        if (!"true".equalsIgnoreCase(autoCreate)) {
            return;
        }

        String datasourceUrl = environment.getProperty("spring.datasource.url");
        String username = environment.getProperty("spring.datasource.username");
        String password = environment.getProperty("spring.datasource.password");

        if (datasourceUrl == null || !datasourceUrl.contains("postgresql")) {
            return; // Solo funciona con PostgreSQL
        }

        String dbName = extractDatabaseName(datasourceUrl);
        String baseUrl = extractBaseUrl(datasourceUrl);

        if (dbName == null || baseUrl == null) {
            System.out.println("[DatabaseInitializer] ⚠️ No se pudo extraer información de la URL: " + datasourceUrl);
            return;
        }

        System.out.println("[DatabaseInitializer] 🔍 Verificando si la base de datos '" + dbName + "' existe...");

        // Conectar a la base de datos 'postgres' (siempre existe)
        String postgresUrl = baseUrl + "/postgres";

        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            System.out.println("[DatabaseInitializer] ⚠️ Driver PostgreSQL no encontrado");
            return;
        }

        try (Connection conn = DriverManager.getConnection(postgresUrl, username, password)) {
            boolean exists = false;
            try (Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery("SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'")) {
                exists = rs.next();
            }

            if (!exists) {
                System.out.println("[DatabaseInitializer] 📦 Creando base de datos '" + dbName + "'...");
                try (Statement stmt = conn.createStatement()) {
                    stmt.executeUpdate("CREATE DATABASE " + dbName);
                    System.out.println("[DatabaseInitializer] ✅ Base de datos '" + dbName + "' creada exitosamente.");
                }
            } else {
                System.out.println("[DatabaseInitializer] ✅ Base de datos '" + dbName + "' ya existe.");
            }
        } catch (Exception e) {
            System.out.println("[DatabaseInitializer] ⚠️ Error al verificar/crear BD: " + e.getMessage());
            // No lanzar excepción - dejar que Spring intente conectar normalmente
        }
    }

    private String extractDatabaseName(String url) {
        try {
            // jdbc:postgresql://host:port/database_name?params
            String withoutPrefix = url.substring(url.lastIndexOf("/") + 1);
            if (withoutPrefix.contains("?")) {
                withoutPrefix = withoutPrefix.substring(0, withoutPrefix.indexOf("?"));
            }
            return withoutPrefix;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractBaseUrl(String url) {
        try {
            // jdbc:postgresql://host:port/database_name -> jdbc:postgresql://host:port
            int lastSlash = url.lastIndexOf("/");
            if (lastSlash > 0) {
                return url.substring(0, lastSlash);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
