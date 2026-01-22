package com.newbie.newbiecore.config;

import org.springframework.core.env.PropertySource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PropertySource personalizado que lee las configuraciones desde la base de datos.
 * Esto permite que las propiedades almacenadas en la tabla configuration_property
 * sean accesibles como si estuvieran en application.properties.
 */
public class DatabasePropertySource extends PropertySource<DataSource> {

    private static final Logger logger = LoggerFactory.getLogger(DatabasePropertySource.class);

    private static final String PROPERTY_SOURCE_NAME = "databaseProperties";

    // Cache de propiedades para evitar consultas constantes a la BD
    private final Map<String, String> propertyCache = new ConcurrentHashMap<>();

    // Flag para indicar si el cache está inicializado
    private volatile boolean cacheInitialized = false;

    // Query para obtener todas las propiedades
    private static final String SELECT_ALL_PROPERTIES =
            "SELECT key, value FROM configuration_property WHERE is_active = true";

    // Query para obtener una propiedad específica
    private static final String SELECT_PROPERTY_BY_KEY =
            "SELECT value FROM configuration_property WHERE key = ? AND is_active = true";

    public DatabasePropertySource(DataSource dataSource) {
        super(PROPERTY_SOURCE_NAME, dataSource);
        initializeCache();
    }

    public DatabasePropertySource(String name, DataSource dataSource) {
        super(name, dataSource);
        initializeCache();
    }

    /**
     * Inicializa el cache cargando todas las propiedades de la BD
     */
    private void initializeCache() {
        if (getSource() == null) {
            logger.warn("DataSource es null, no se pueden cargar propiedades de la BD");
            return;
        }

        try (Connection conn = getSource().getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT_ALL_PROPERTIES);
             ResultSet rs = ps.executeQuery()) {

            int count = 0;
            while (rs.next()) {
                String key = rs.getString("key");
                String value = rs.getString("value");
                if (key != null && value != null) {
                    propertyCache.put(key, value);
                    count++;
                }
            }

            cacheInitialized = true;
            logger.info("✅ DatabasePropertySource inicializado con {} propiedades desde la BD", count);

        } catch (Exception e) {
            logger.error("❌ Error inicializando DatabasePropertySource: {}", e.getMessage());
            // No lanzar excepción para permitir que la aplicación inicie
            // Las propiedades se cargarán bajo demanda si es posible
        }
    }

    @Override
    public Object getProperty(String name) {
        // Primero buscar en cache
        if (propertyCache.containsKey(name)) {
            return propertyCache.get(name);
        }

        // Si el cache no está inicializado, intentar cargar la propiedad directamente
        if (!cacheInitialized && getSource() != null) {
            try (Connection conn = getSource().getConnection();
                 PreparedStatement ps = conn.prepareStatement(SELECT_PROPERTY_BY_KEY)) {

                ps.setString(1, name);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        String value = rs.getString("value");
                        propertyCache.put(name, value);
                        return value;
                    }
                }
            } catch (Exception e) {
                logger.debug("No se pudo obtener propiedad '{}' de la BD: {}", name, e.getMessage());
            }
        }

        return null;
    }

    /**
     * Refresca el cache de propiedades desde la BD
     */
    public void refreshCache() {
        propertyCache.clear();
        cacheInitialized = false;
        initializeCache();
        logger.info("🔄 Cache de propiedades refrescado");
    }

    /**
     * Actualiza una propiedad específica en el cache
     */
    public void updateProperty(String key, String value) {
        if (value != null) {
            propertyCache.put(key, value);
        } else {
            propertyCache.remove(key);
        }
        logger.debug("Propiedad '{}' actualizada en cache", key);
    }

    /**
     * Obtiene todas las propiedades en cache
     */
    public Map<String, String> getAllProperties() {
        return new ConcurrentHashMap<>(propertyCache);
    }

    /**
     * Verifica si el cache está inicializado
     */
    public boolean isCacheInitialized() {
        return cacheInitialized;
    }
}