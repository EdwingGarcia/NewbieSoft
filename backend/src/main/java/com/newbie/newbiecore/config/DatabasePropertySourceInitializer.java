package com.newbie.newbiecore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MutablePropertySources;

import javax.sql.DataSource;

/**
 * Inicializador que registra el DatabasePropertySource en el Environment de Spring.
 * Se ejecuta muy temprano en el ciclo de vida de la aplicación, antes de que
 * se procesen los beans.
 *
 * IMPORTANTE: Las propiedades de conexión a BD deben estar en application.properties
 * ya que se necesitan para conectar a la BD y cargar el resto de propiedades.
 */
public class DatabasePropertySourceInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext>, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(DatabasePropertySourceInitializer.class);

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();

        try {
            // Obtener propiedades de conexión desde application.properties
            String url = environment.getProperty("spring.datasource.url");
            String username = environment.getProperty("spring.datasource.username");
            String password = environment.getProperty("spring.datasource.password");
            String driverClassName = environment.getProperty("spring.datasource.driver-class-name",
                    "org.postgresql.Driver");

            if (url == null || username == null) {
                logger.warn("⚠️ Propiedades de DataSource no encontradas en application.properties. " +
                        "DatabasePropertySource no será inicializado.");
                return;
            }

            // Crear DataSource temporal para cargar propiedades
            DataSource dataSource = DataSourceBuilder.create()
                    .url(url)
                    .username(username)
                    .password(password)
                    .driverClassName(driverClassName)
                    .build();

            // Crear y registrar el PropertySource
            DatabasePropertySource dbPropertySource = new DatabasePropertySource(dataSource);

            MutablePropertySources propertySources = environment.getPropertySources();

            // Agregar DESPUÉS de systemProperties pero ANTES de application.properties
            // Esto permite que las propiedades de BD sobrescriban application.properties
            // pero no las variables de entorno del sistema
            if (propertySources.contains("systemEnvironment")) {
                propertySources.addAfter("systemEnvironment", dbPropertySource);
            } else {
                propertySources.addFirst(dbPropertySource);
            }

            logger.info("✅ DatabasePropertySource registrado exitosamente en el Environment");

        } catch (Exception e) {
            logger.error("❌ Error inicializando DatabasePropertySource: {}", e.getMessage());
            // No lanzar excepción para permitir que la aplicación inicie
            // usando solo las propiedades de application.properties
        }
    }

    @Override
    public int getOrder() {
        // Ejecutar con alta prioridad (número bajo = más temprano)
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}