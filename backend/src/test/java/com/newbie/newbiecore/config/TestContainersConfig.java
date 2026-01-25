package com.newbie.newbiecore.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Profile;

/**
 * Configuración de tests que usa PostgreSQL local.
 * La conexión a la base de datos se configura en application-test.properties.
 */
@TestConfiguration
@Profile("test")
public class TestContainersConfig {
    // La configuración del mail se toma de application-test.properties
    // No se mockea el JavaMailSender ya que DynamicMailConfig lo gestiona
}
