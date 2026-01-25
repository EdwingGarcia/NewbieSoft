package com.newbie.newbiecore.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

import java.sql.Connection;

/**
 * Inicializa los datos después de que Hibernate cree las tablas.
 * Ejecuta V1__init_data.sql si la tabla 'roles' está vacía.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(1) // Ejecutar primero, antes de otros CommandLineRunners
@ConditionalOnProperty(name = "app.data.auto-init", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 DataInitializer ejecutándose...");

        try {
            // Verificar si ya hay datos (usando la tabla roles como indicador)
            Integer roleCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM roles", Integer.class);

            if (roleCount != null && roleCount > 0) {
                log.info("✅ Datos ya inicializados ({} roles encontrados). Saltando inicialización.", roleCount);
                return;
            }

            log.info("📦 Base de datos vacía detectada. Ejecutando script de inicialización...");

            // Asegurar que existan los índices UNIQUE necesarios para ON CONFLICT
            ensureUniqueConstraints();

            // Cargar el script SQL
            ClassPathResource resource = new ClassPathResource("db/migration/V1__init_data.sql");

            if (!resource.exists()) {
                log.warn("⚠️ No se encontró el archivo db/migration/V1__init_data.sql");
                return;
            }

            // Usar ScriptUtils de Spring para ejecutar el script correctamente
            Connection connection = jdbcTemplate.getDataSource().getConnection();
            try {
                ScriptUtils.executeSqlScript(connection, resource);
                log.info("✅ Script de inicialización ejecutado correctamente.");
            } finally {
                connection.close();
            }

            // Verificar resultado
            Integer newRoleCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM roles", Integer.class);
            Integer userCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM usuarios", Integer.class);
            Integer catalogCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM catalogo_items", Integer.class);

            log.info("📊 Datos inicializados: {} roles, {} usuarios, {} items de catálogo",
                    newRoleCount, userCount, catalogCount);

        } catch (Exception e) {
            log.warn("⚠️ Error durante la inicialización de datos: {}. " +
                    "Esto puede ser normal en la primera ejecución.", e.getMessage());
        }
    }

    /**
     * Crea los índices UNIQUE necesarios para que ON CONFLICT funcione
     */
    private void ensureUniqueConstraints() {
        try {
            // UNIQUE en roles.nombre
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_nombre ON roles(nombre)");
            log.debug("✓ Índice único en roles.nombre asegurado");
        } catch (Exception e) {
            log.debug("Índice roles.nombre ya existe o no se pudo crear: {}", e.getMessage());
        }

        try {
            // UNIQUE en usuarios.cedula
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cedula ON usuarios(cedula)");
            log.debug("✓ Índice único en usuarios.cedula asegurado");
        } catch (Exception e) {
            log.debug("Índice usuarios.cedula ya existe o no se pudo crear: {}", e.getMessage());
        }

        try {
            // UNIQUE en configuration_property.key
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_config_prop_key ON configuration_property(key)");
            log.debug("✓ Índice único en configuration_property.key asegurado");
        } catch (Exception e) {
            log.debug("Índice configuration_property.key ya existe o no se pudo crear: {}", e.getMessage());
        }
    }
}
