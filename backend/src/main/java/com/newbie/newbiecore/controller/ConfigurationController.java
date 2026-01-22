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

    /* =========================
       GET ALL (GROUPED)
    ========================= */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Obtener todas las configuraciones",
            description = "Retorna todas las configuraciones agrupadas por categoría"
    )
    public ResponseEntity<Map<String, Object>> getAllConfigurations(
            @Parameter(description = "Si es true, muestra valores sensibles enmascarados")
            @RequestParam(defaultValue = "true") boolean maskSensitive
    ) {

        Map<String, List<ConfigurationPropertyDTO>> grouped =
                configurationService.getAllConfigurationsGrouped(maskSensitive);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", grouped,
                "categories", configurationService.getAllCategories()
        ));
    }

    /* =========================
       GET LIST
    ========================= */
    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener configuraciones como lista")
    public ResponseEntity<Map<String, Object>> getAllConfigurationsAsList(
            @RequestParam(defaultValue = "true") boolean maskSensitive
    ) {

        List<ConfigurationPropertyDTO> configurations =
                configurationService.getAllConfigurations(maskSensitive);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", configurations,
                "total", configurations.size()
        ));
    }

    /* =========================
       GET BY CATEGORY
    ========================= */
    @GetMapping("/category/{category}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener configuraciones por categoría")
    public ResponseEntity<Map<String, Object>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "true") boolean maskSensitive
    ) {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "category", category,
                "data", configurationService.getByCategory(category, maskSensitive)
        ));
    }

    /* =========================
       GET CATEGORIES
    ========================= */
    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener categorías disponibles")
    public ResponseEntity<Map<String, Object>> getCategories() {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", configurationService.getAllCategories()
        ));
    }

    /* =========================
       GET BY ID
    ========================= */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener configuración por ID")
    public ResponseEntity<Map<String, Object>> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean maskSensitive
    ) {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", configurationService.getById(id, maskSensitive)
        ));
    }

    /* =========================
       SEARCH
    ========================= */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar configuraciones")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "true") boolean maskSensitive
    ) {

        List<ConfigurationPropertyDTO> results =
                configurationService.search(q, maskSensitive);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "query", q,
                "total", results.size(),
                "data", results
        ));
    }

    /* =========================
       UPDATE SINGLE
    ========================= */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar una configuración")
    public ResponseEntity<Map<String, Object>> updateConfiguration(
            @PathVariable Long id,
            @Valid @RequestBody UpdateConfigurationDTO updateDTO
    ) {

        ConfigurationPropertyDTO updated =
                configurationService.updateConfiguration(id, updateDTO.getValue());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Configuración actualizada correctamente",
                "data", updated
        ));
    }

    /* =========================
       BULK UPDATE
    ========================= */
    @PutMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar múltiples configuraciones")
    public ResponseEntity<Map<String, Object>> bulkUpdate(
            @Valid @RequestBody BulkUpdateConfigurationDTO bulkUpdate
    ) {

        List<ConfigurationPropertyDTO> updated =
                configurationService.bulkUpdate(bulkUpdate);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Configuraciones actualizadas correctamente",
                "updatedCount", updated.size(),
                "data", updated
        ));
    }

    /* =========================
       GET RAW VALUE (SUPER ADMIN)
    ========================= */
    @GetMapping("/value/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Obtener valor real de una configuración (SUPER_ADMIN)")
    public ResponseEntity<Map<String, Object>> getConfigurationValue(
            @PathVariable String key
    ) {

        ConfigurationPropertyDTO config =
                configurationService.getByKey(key, false);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "key", key,
                "value", config.getValue()
        ));
    }
}
