package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.Config.BulkUpdateConfigurationDTO;
import com.newbie.newbiecore.dto.Config.ConfigurationPropertyDTO;
import com.newbie.newbiecore.dto.Config.UpdateConfigurationDTO;
import com.newbie.newbiecore.service.ConfigurationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/configurations")
@Tag(name = "Configuraciones", description = "API para gestión de configuraciones del sistema")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ConfigurationController {

    @Autowired
    private ConfigurationService configurationService;

    /**
     * Obtiene todas las configuraciones agrupadas por categoría
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener todas las configuraciones",
            description = "Retorna todas las configuraciones del sistema agrupadas por categoría")
    public ResponseEntity<Map<String, Object>> getAllConfigurations(
            @Parameter(description = "Si es true, muestra los valores sensibles enmascarados")
            @RequestParam(defaultValue = "true") boolean maskSensitive) {

        Map<String, List<ConfigurationPropertyDTO>> grouped =
                configurationService.getAllConfigurationsGrouped(maskSensitive);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", grouped);
        response.put("categories", configurationService.getAllCategories());

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene todas las configuraciones como lista plana
     */
    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener configuraciones como lista",
            description = "Retorna todas las configuraciones como una lista plana")
    public ResponseEntity<Map<String, Object>> getAllConfigurationsAsList(
            @RequestParam(defaultValue = "true") boolean maskSensitive) {

        List<ConfigurationPropertyDTO> configurations =
                configurationService.getAllConfigurations(maskSensitive);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", configurations);
        response.put("total", configurations.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene configuraciones por categoría
     */
    @GetMapping("/category/{category}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener configuraciones por categoría")
    public ResponseEntity<Map<String, Object>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "true") boolean maskSensitive) {

        List<ConfigurationPropertyDTO> configurations =
                configurationService.getByCategory(category, maskSensitive);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", configurations);
        response.put("category", category);

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene todas las categorías disponibles
     */
    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener categorías disponibles")
    public ResponseEntity<Map<String, Object>> getCategories() {
        List<String> categories = configurationService.getAllCategories();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", categories);

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene una configuración por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener configuración por ID")
    public ResponseEntity<Map<String, Object>> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean maskSensitive) {

        ConfigurationPropertyDTO configuration =
                configurationService.getById(id, maskSensitive);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", configuration);

        return ResponseEntity.ok(response);
    }

    /**
     * Busca configuraciones por texto
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar configuraciones")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "true") boolean maskSensitive) {

        List<ConfigurationPropertyDTO> results =
                configurationService.search(q, maskSensitive);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", results);
        response.put("query", q);
        response.put("total", results.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Actualiza una configuración individual
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar una configuración")
    public ResponseEntity<Map<String, Object>> updateConfiguration(
            @PathVariable Long id,
            @Valid @RequestBody UpdateConfigurationDTO updateDTO) {

        ConfigurationPropertyDTO updated =
                configurationService.updateConfiguration(id, updateDTO.getValue());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Configuración actualizada correctamente");
        response.put("data", updated);

        return ResponseEntity.ok(response);
    }

    /**
     * Actualiza múltiples configuraciones en lote
     */
    @PutMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar múltiples configuraciones")
    public ResponseEntity<Map<String, Object>> bulkUpdate(
            @Valid @RequestBody BulkUpdateConfigurationDTO bulkUpdate) {

        List<ConfigurationPropertyDTO> updated =
                configurationService.bulkUpdate(bulkUpdate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Configuraciones actualizadas correctamente");
        response.put("data", updated);
        response.put("updatedCount", updated.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene el valor de una configuración específica (sin máscara, para uso interno)
     * Este endpoint debe estar muy protegido
     */
    @GetMapping("/value/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Obtener valor real de una configuración (SUPER_ADMIN)")
    public ResponseEntity<Map<String, Object>> getConfigurationValue(
            @PathVariable String key) {

        ConfigurationPropertyDTO config =
                configurationService.getByKey(key, false);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("key", key);
        response.put("value", config.getValue());

        return ResponseEntity.ok(response);
    }
}