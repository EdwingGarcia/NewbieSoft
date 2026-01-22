package com.newbie.newbiecore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;

import javax.sql.DataSource;

/**
 * Configuración que maneja el DatabasePropertySource después de que
 * el contexto de Spring está completamente inicializado.
 *
 * Esta configuración complementa al DatabasePropertySourceInitializer,
 * permitiendo refrescar las propiedades en tiempo de ejecución.
 */
@Configuration
public class DatabasePropertySourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabasePropertySourceConfig.class);

    @Autowired
    private ConfigurableEnvironment environment;

    @Autowired
    private DataSource dataSource;

    /**
     * Bean que proporciona acceso al DatabasePropertySource para operaciones
     * de actualización y refresco en tiempo de ejecución.
     */
    @Bean
    public DatabasePropertySourceManager databasePropertySourceManager() {
        return new DatabasePropertySourceManager(environment, dataSource);
    }

    /**
     * Manager que permite operaciones sobre el DatabasePropertySource
     */
    public static class DatabasePropertySourceManager {

        private static final Logger log = LoggerFactory.getLogger(DatabasePropertySourceManager.class);

        private final ConfigurableEnvironment environment;
        private final DataSource dataSource;
        private DatabasePropertySource databasePropertySource;

        public DatabasePropertySourceManager(ConfigurableEnvironment environment, DataSource dataSource) {
            this.environment = environment;
            this.dataSource = dataSource;
            initializeIfNeeded();
        }

        /**
         * Inicializa el DatabasePropertySource si no existe
         */
        private void initializeIfNeeded() {
            MutablePropertySources propertySources = environment.getPropertySources();
            PropertySource<?> existing = propertySources.get("databaseProperties");

            if (existing instanceof DatabasePropertySource) {
                this.databasePropertySource = (DatabasePropertySource) existing;
                log.info("✅ DatabasePropertySource existente encontrado");
            } else if (existing == null) {
                // Crear nuevo si no existe (caso donde el inicializador falló)
                this.databasePropertySource = new DatabasePropertySource(dataSource);
                if (propertySources.contains("systemEnvironment")) {
                    propertySources.addAfter("systemEnvironment", databasePropertySource);
                } else {
                    propertySources.addFirst(databasePropertySource);
                }
                log.info("✅ Nuevo DatabasePropertySource creado y registrado");
            }
        }

        /**
         * Refresca todas las propiedades desde la base de datos
         */
        public void refreshAllProperties() {
            if (databasePropertySource != null) {
                databasePropertySource.refreshCache();
                log.info("🔄 Todas las propiedades han sido refrescadas desde la BD");
            }
        }

        /**
         * Actualiza una propiedad específica en el cache
         */
        public void updateProperty(String key, String value) {
            if (databasePropertySource != null) {
                databasePropertySource.updateProperty(key, value);
                log.debug("Propiedad '{}' actualizada en el PropertySource", key);
            }
        }

        /**
         * Obtiene el valor actual de una propiedad
         */
        public String getProperty(String key) {
            return environment.getProperty(key);
        }

        /**
         * Verifica si el DatabasePropertySource está activo
         */
        public boolean isActive() {
            return databasePropertySource != null && databasePropertySource.isCacheInitialized();
        }
    }
}