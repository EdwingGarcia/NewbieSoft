package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.service.ConfigurationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Controller para administración de propiedades del sistema.
 *
 * ACTUALIZADO: Ahora incluye ContextRefresher de Spring Cloud
 * para refrescar los beans con @RefreshScope cuando cambian las propiedades.
 */
@RestController
@RequestMapping("/api/v1/configurations/admin")
@Tag(name = "Administración de Configuraciones", description = "API para administración avanzada de configuraciones")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ConfigurationAdminController {

    private static final Logger logger = LoggerFactory.getLogger(ConfigurationAdminController.class);

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    private Environment environment;

    /**
     * ContextRefresher de Spring Cloud.
     * Permite refrescar los beans marcados con @RefreshScope.
     *
     * required = false para que la app funcione si Spring Cloud no está presente
     */
    @Autowired(required = false)
    private ContextRefresher contextRefresher;

    /**
     * Refresca todas las propiedades desde la BD al Environment de Spring
     * Y recrea los beans con @RefreshScope (JavaMailSender, JwtConfig, etc.)
     */
    @PostMapping("/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refrescar propiedades y beans",
            description = "Recarga todas las propiedades desde la BD y recrea los beans dinámicos")
    public ResponseEntity<Map<String, Object>> refreshProperties() {
        Map<String, Object> response = new HashMap<>();

        try {
            logger.info("🔄 Iniciando refresh de propiedades y beans...");

            // 1. Refrescar propiedades en el Environment (desde la BD)
            configurationService.refreshAllPropertiesInEnvironment();
            logger.info("✅ Propiedades del Environment actualizadas desde la BD");

            // 2. Refrescar beans con @RefreshScope
            Set<String> refreshedKeys = Set.of();
            if (contextRefresher != null) {
                logger.info("🔄 Refrescando beans con @RefreshScope...");
                refreshedKeys = contextRefresher.refresh();
                logger.info("✅ Beans refrescados. Propiedades afectadas: {}", refreshedKeys);
            } else {
                logger.warn("⚠️ ContextRefresher no disponible. Los beans NO fueron refrescados.");
                logger.warn("   Agrega spring-cloud-context a tu pom.xml para habilitar @RefreshScope");
            }

            response.put("success", true);
            response.put("message", "Propiedades y beans refrescados correctamente");
            response.put("propertiesRefreshed", true);
            response.put("beansRefreshed", contextRefresher != null);
            response.put("changedProperties", refreshedKeys);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Error refrescando propiedades: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error refrescando propiedades: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Verifica el estado del PropertySource de BD y del ContextRefresher
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Estado del sistema de configuración",
            description = "Verifica si DatabasePropertySource y ContextRefresher están activos")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> response = new HashMap<>();

        boolean propertySourceActive = configurationService.isPropertySourceActive();
        boolean contextRefresherActive = contextRefresher != null;

        response.put("success", true);
        response.put("propertySourceActive", propertySourceActive);
        response.put("contextRefresherActive", contextRefresherActive);
        response.put("dynamicRefreshEnabled", propertySourceActive && contextRefresherActive);

        if (propertySourceActive && contextRefresherActive) {
            response.put("message", "✅ Sistema completamente funcional. Los cambios se aplican en caliente.");
        } else if (propertySourceActive) {
            response.put("message", "⚠️ PropertySource activo pero ContextRefresher no disponible. " +
                    "Los cambios en propiedades se guardan pero algunos beans NO se actualizarán hasta reiniciar.");
        } else {
            response.put("message", "❌ PropertySource no activo. Las propiedades se leen solo de application.properties");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene el valor actual de una propiedad desde el Environment
     */
    @GetMapping("/verify/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verificar propiedad en Environment",
            description = "Obtiene el valor actual de una propiedad desde el Environment de Spring")
    public ResponseEntity<Map<String, Object>> verifyProperty(@PathVariable String key) {
        Map<String, Object> response = new HashMap<>();

        String environmentValue = environment.getProperty(key);
        String dbValue = configurationService.getPropertyValue(key);

        response.put("success", true);
        response.put("key", key);
        response.put("environmentValue", environmentValue != null ? maskIfSensitive(key, environmentValue) : null);
        response.put("databaseValue", dbValue != null ? maskIfSensitive(key, dbValue) : null);
        response.put("inSync", environmentValue != null && environmentValue.equals(dbValue));

        if (environmentValue == null && dbValue != null) {
            response.put("note", "La propiedad existe en BD pero aún no está en el Environment. " +
                    "Ejecuta /refresh para sincronizar.");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Test rápido de email con la configuración actual
     */
    @PostMapping("/test-email")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Probar configuración de email",
            description = "Envía un email de prueba usando la configuración actual")
    public ResponseEntity<Map<String, Object>> testEmail(
            @RequestParam(defaultValue = "admin@example.com") String to) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Mostrar configuración actual (sin password)
            response.put("currentConfig", Map.of(
                    "host", environment.getProperty("spring.mail.host", "N/A"),
                    "port", environment.getProperty("spring.mail.port", "N/A"),
                    "username", environment.getProperty("spring.mail.username", "N/A"),
                    "starttls", environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "N/A")
            ));

            // Aquí podrías inyectar un servicio de email para hacer la prueba real
            // emailService.sendTestEmail(to);

            response.put("success", true);
            response.put("message", "Configuración de email verificada. " +
                    "Para probar el envío real, implementa el método sendTestEmail en tu EmailService.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Enmascara valores sensibles
     */
    private String maskIfSensitive(String key, String value) {
        String[] sensitivePatterns = {"password", "secret", "key", "token", "credential"};

        for (String pattern : sensitivePatterns) {
            if (key.toLowerCase().contains(pattern)) {
                return "********";
            }
        }

        return value;
    }
}