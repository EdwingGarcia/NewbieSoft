package com.newbie.newbiecore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

/**
 * EnvironmentPostProcessor que carga las configuraciones desde la base de datos
 * ANTES de que Spring Boot procese los beans.
 *
 * Este es el mecanismo correcto para Spring Boot 3.x para agregar propiedades
 * muy temprano en el ciclo de vida de la aplicación.
 */
public class DatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseEnvironmentPostProcessor.class);

    private static final String PROPERTY_SOURCE_NAME = "databaseProperties";

    // Query para obtener todas las propiedades activas
    private static final String SELECT_ALL_PROPERTIES =
            "SELECT key, value FROM configuration_property WHERE is_active = true";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        try {
            // Obtener propiedades de conexión desde las fuentes ya cargadas (application.properties)
            String url = environment.getProperty("spring.datasource.url");
            String username = environment.getProperty("spring.datasource.username");
            String password = environment.getProperty("spring.datasource.password");
            String driverClassName = environment.getProperty("spring.datasource.driver-class-name",
                    "org.postgresql.Driver");

            if (url == null || username == null) {
                logger.warn("⚠️ Propiedades de DataSource no encontradas. " +
                        "DatabaseEnvironmentPostProcessor no será inicializado.");
                return;
            }

            // Cargar el driver
            try {
                Class.forName(driverClassName);
            } catch (ClassNotFoundException e) {
                logger.error("❌ Driver de BD no encontrado: {}", driverClassName);
                return;
            }

            // Cargar propiedades desde la BD
            Map<String, Object> dbProperties = loadPropertiesFromDatabase(url, username, password);

            if (dbProperties.isEmpty()) {
                logger.info("ℹ️ No se encontraron propiedades en la base de datos o la tabla no existe aún.");
                return;
            }

            // Crear PropertySource y agregarlo al Environment
            MapPropertySource dbPropertySource = new MapPropertySource(PROPERTY_SOURCE_NAME, dbProperties);

            MutablePropertySources propertySources = environment.getPropertySources();

            // Agregar ANTES de application.properties para que las propiedades de BD tengan prioridad
            // pero DESPUÉS de systemEnvironment para que las variables de entorno del sistema tengan prioridad
            if (propertySources.contains("systemEnvironment")) {
                propertySources.addAfter("systemEnvironment", dbPropertySource);
            } else if (propertySources.contains("systemProperties")) {
                propertySources.addAfter("systemProperties", dbPropertySource);
            } else {
                propertySources.addFirst(dbPropertySource);
            }

            logger.info("✅ DatabaseEnvironmentPostProcessor: {} propiedades cargadas desde la BD",
                    dbProperties.size());

        } catch (Exception e) {
            // No lanzar excepción para permitir que la aplicación inicie
            // usando solo las propiedades de application.properties
            logger.error("❌ Error en DatabaseEnvironmentPostProcessor: {}", e.getMessage());
            logger.info("ℹ️ La aplicación continuará usando solo application.properties");
        }
    }

    /**
     * Carga las propiedades desde la base de datos usando JDBC directo
     * (no podemos usar Spring Data JPA aquí porque aún no está inicializado)
     */
    private Map<String, Object> loadPropertiesFromDatabase(String url, String username, String password) {
        Map<String, Object> properties = new HashMap<>();

        try (Connection conn = DriverManager.getConnection(url, username, password);
             PreparedStatement ps = conn.prepareStatement(SELECT_ALL_PROPERTIES);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                String key = rs.getString("key");
                String value = rs.getString("value");
                if (key != null && value != null) {
                    properties.put(key, value);
                }
            }

            logger.debug("Propiedades cargadas desde BD: {}", properties.keySet());

        } catch (Exception e) {
            // La tabla puede no existir aún en el primer arranque
            logger.warn("⚠️ No se pudieron cargar propiedades de BD: {}", e.getMessage());
        }

        return properties;
    }

    @Override
    public int getOrder() {
        // Ejecutar con alta prioridad (después de ConfigFileApplicationListener)
        // Ordered.HIGHEST_PRECEDENCE + 11 asegura que application.properties ya está cargado
        return Ordered.HIGHEST_PRECEDENCE + 11;
    }
}