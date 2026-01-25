package com.newbie.newbiecore.service;

import com.newbie.newbiecore.config.DatabasePropertySourceConfig.DatabasePropertySourceManager;
import com.newbie.newbiecore.dto.Config.BulkUpdateConfigurationDTO;
import com.newbie.newbiecore.dto.Config.ConfigurationPropertyDTO;
import com.newbie.newbiecore.dto.Config.UpdateConfigurationDTO;
import com.newbie.newbiecore.exception.ResourceNotFoundException;
import com.newbie.newbiecore.exception.ConfigurationException;
import com.newbie.newbiecore.entity.ConfigurationProperty;
import com.newbie.newbiecore.repository.ConfigurationPropertyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de configuraciones del sistema.
 *
 * ACTUALIZADO: Ahora incluye auto-refresh opcional para actualizar
 * los beans de Spring Cloud automáticamente cuando cambian propiedades críticas.
 */
@Service
@RefreshScope
public class ConfigurationService {

    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);

    @Autowired
    private ConfigurationPropertyRepository repository;
    @Autowired(required = false)
    private ConfigurationReloadService reloadService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private DatabasePropertySourceManager propertySourceManager;

    /**
     * ContextRefresher de Spring Cloud para refrescar beans con @RefreshScope
     */
    @Autowired(required = false)
    private ContextRefresher contextRefresher;

    /**
     * Si está en true, los beans se refrescan automáticamente al cambiar propiedades críticas
     */
    @Value("${app.config.auto-refresh:true}")
    private boolean autoRefreshEnabled;

    /**
     * Prefijos de propiedades que disparan auto-refresh de beans
     */
    private static final Set<String> AUTO_REFRESH_PREFIXES = Set.of(
            "spring.mail.",
            "jwt.",
            "app.security."
    );

    // ==================== MÉTODOS DE LECTURA ====================

    public Map<String, List<ConfigurationPropertyDTO>> getAllConfigurationsGrouped(boolean maskSensitive) {
        List<ConfigurationProperty> properties = repository.findAllOrderByCategoryAndKey();

        return properties.stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.groupingBy(
                        ConfigurationPropertyDTO::getCategory,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    public List<ConfigurationPropertyDTO> getAllConfigurations(boolean maskSensitive) {
        return repository.findAllOrderByCategoryAndKey().stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.toList());
    }

    public List<ConfigurationPropertyDTO> getByCategory(String category, boolean maskSensitive) {
        return repository.findByCategoryOrderByKeyAsc(category).stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.toList());
    }

    public ConfigurationPropertyDTO getById(Long id, boolean maskSensitive) {
        ConfigurationProperty property = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con ID: " + id));
        return ConfigurationPropertyDTO.fromEntity(property, maskSensitive);
    }

    public ConfigurationPropertyDTO getByKey(String key, boolean maskSensitive) {
        ConfigurationProperty property = repository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada: " + key));
        return ConfigurationPropertyDTO.fromEntity(property, maskSensitive);
    }

    public String getPropertyValue(String key) {
        return repository.findByKey(key)
                .map(ConfigurationProperty::getValue)
                .orElse(null);
    }

    public List<String> getAllCategories() {
        return repository.findAllCategories();
    }

    public List<ConfigurationPropertyDTO> search(String searchText, boolean maskSensitive) {
        return repository.searchByKeyOrDescription(searchText).stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.toList());
    }

    // ==================== MÉTODOS DE ACTUALIZACIÓN ====================

    /**
     * Actualiza una configuración individual
     */
    public ConfigurationPropertyDTO updateConfiguration(Long id, String newValue) {

        // 1️⃣ Guarda en BD (método @Transactional)
        ConfigurationProperty saved =
                updateConfigurationInDb(id, newValue);

        // 2️⃣ Refresh del cache de propiedades (siempre)
        if (propertySourceManager != null) {
            propertySourceManager.updateProperty(saved.getKey(), newValue);
        }

        // 3️⃣ Refresh de beans solo si es necesario (propiedades críticas)
        if (shouldAutoRefresh(saved.getKey())) {
            if (reloadService != null) {
                reloadService.refresh();
            }
        } else {
            logger.info("✅ Propiedad '{}' actualizada. No requiere refresh de beans.", saved.getKey());
        }

        return ConfigurationPropertyDTO.fromEntity(saved, true);
    }


    // 4. Create a protected/private method for the DB logic
    @Transactional
    protected ConfigurationProperty updateConfigurationInDb(Long id, String newValue) {
        logger.info("========== INICIO UPDATE DB ==========");

        ConfigurationProperty property = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con ID: " + id));

        if (!property.getIsEditable()) {
            throw new ConfigurationException("La configuración no es editable");
        }

        String oldValue = property.getValue();
        String currentUser = getCurrentUsername();

        if (Objects.equals(oldValue, newValue)) {
            return property;
        }

        validateValue(newValue, property.getValueType());

        property.setValue(newValue);
        property.setUpdatedBy(currentUser);
        property.setUpdatedAt(LocalDateTime.now());

        ConfigurationProperty saved = repository.saveAndFlush(property);

        // Sync to Memory (Fast operation, safe inside transaction)
        syncPropertyToEnvironment(property.getKey(), newValue);

        // Audit Log
        try {
            auditLogService.logConfigurationChange(property.getKey(), oldValue, newValue, currentUser);
        } catch (Exception e) {
            logger.error("Audit Log Error", e);
        }

        return saved;
    }

    /**
     * Actualiza múltiples configuraciones en lote
     */
    @Transactional
    public List<ConfigurationPropertyDTO> bulkUpdate(BulkUpdateConfigurationDTO bulkUpdate) {
        List<ConfigurationPropertyDTO> updatedConfigs = new ArrayList<>();
        String currentUser = getCurrentUsername();
        boolean needsRefresh = false;

        for (UpdateConfigurationDTO update : bulkUpdate.getConfigurations()) {
            try {
                ConfigurationProperty property = repository.findById(update.getId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Configuración no encontrada con ID: " + update.getId()));

                if (!property.getIsEditable()) {
                    logger.warn("Intento de editar configuración no editable: {}", property.getKey());
                    continue;
                }

                String oldValue = property.getValue();

                if (!Objects.equals(oldValue, update.getValue())) {
                    validateValue(update.getValue(), property.getValueType());

                    property.setValue(update.getValue());
                    property.setUpdatedBy(currentUser);
                    property.setUpdatedAt(LocalDateTime.now());

                    ConfigurationProperty saved = repository.save(property);

                    syncPropertyToEnvironment(property.getKey(), update.getValue());

                    // Verificar si esta propiedad requiere refresh
                    if (shouldAutoRefresh(property.getKey())) {
                        needsRefresh = true;
                    }

                    try {
                        auditLogService.logConfigurationChange(
                                property.getKey(),
                                property.getIsSensitive() ? "***" : oldValue,
                                property.getIsSensitive() ? "***" : update.getValue(),
                                currentUser
                        );
                    } catch (Exception e) {
                        logger.error("⚠️ Error en audit log: {}", e.getMessage());
                    }

                    updatedConfigs.add(ConfigurationPropertyDTO.fromEntity(saved, true));
                    logger.info("✅ Actualizada: {} por {}", property.getKey(), currentUser);
                }
            } catch (ResourceNotFoundException e) {
                logger.warn("Configuración no encontrada en bulk update: {}", update.getId());
            }
        }

        // Flush todas las operaciones
        repository.flush();

        // Un solo refresh al final si es necesario
        if (needsRefresh) {
            doContextRefresh();
        }

        return updatedConfigs;
    }

    // ==================== MÉTODOS DE REFRESH ====================

    /**
     * Sincroniza una propiedad al Environment de Spring
     */
    private void syncPropertyToEnvironment(String key, String value) {
        if (propertySourceManager != null) {
            propertySourceManager.updateProperty(key, value);
            logger.debug("Propiedad '{}' sincronizada con el Environment", key);
        }
    }

    /**
     * Refresca todas las propiedades desde la BD al Environment
     */
    public void refreshAllPropertiesInEnvironment() {
        if (propertySourceManager != null) {
            propertySourceManager.refreshAllProperties();
            logger.info("✅ Todas las propiedades han sido refrescadas desde la BD");
        }
    }

    /**
     * Verifica si el PropertySource de BD está activo
     */
    public boolean isPropertySourceActive() {
        return propertySourceManager != null && propertySourceManager.isActive();
    }

    /**
     * Determina si una propiedad debe disparar auto-refresh de beans
     */
    private boolean shouldAutoRefresh(String key) {
        return AUTO_REFRESH_PREFIXES.stream().anyMatch(key::startsWith);
    }

    /**
     * Dispara auto-refresh si la propiedad lo requiere
     */
    private void triggerAutoRefreshIfNeeded(String key) {
        if (autoRefreshEnabled && shouldAutoRefresh(key)) {
            logger.info("🔄 Propiedad '{}' requiere refresh de beans", key);
            doContextRefresh();
        }
    }

    /**
     * Ejecuta el refresh de beans con @RefreshScope
     */
    private void doContextRefresh() {
        if (contextRefresher != null) {
            try {
                logger.info("🔄 Ejecutando ContextRefresher.refresh()...");
                Set<String> refreshedKeys = contextRefresher.refresh();
                logger.info("✅ Beans refrescados. Keys afectadas: {}", refreshedKeys);
            } catch (Exception e) {
                logger.error("❌ Error en ContextRefresher: {}", e.getMessage());
            }
        } else {
            logger.warn("⚠️ ContextRefresher no disponible. Los beans NO fueron refrescados.");
        }
    }

    // ==================== VALIDACIÓN ====================

    private void validateValue(String value, ConfigurationProperty.ValueType type) {
        if (value == null) return;

        switch (type) {
            case NUMBER:
                try {
                    Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    throw new ConfigurationException("El valor debe ser numérico");
                }
                break;
            case BOOLEAN:
                if (!value.equalsIgnoreCase("true") && !value.equalsIgnoreCase("false")) {
                    throw new ConfigurationException("El valor debe ser 'true' o 'false'");
                }
                break;
            case URL:
                if (!value.matches("^(https?|jdbc)://.*")) {
                    throw new ConfigurationException("El valor debe ser una URL válida");
                }
                break;
            case EMAIL:
                if (!value.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                    throw new ConfigurationException("El valor debe ser un email válido");
                }
                break;
            default:
                // STRING y PASSWORD no requieren validación especial
                break;
        }
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    // ==================== INICIALIZACIÓN ====================

    @PostConstruct
    @Transactional
    public void initializeDefaultConfigurations() {
        if (repository.count() > 0) {
            logger.info("Configuraciones ya existentes, saltando inicialización");
            return;
        }

        logger.info("📝 Inicializando configuraciones por defecto...");
        List<ConfigurationProperty> defaultConfigs = getDefaultConfigurations();
        repository.saveAll(defaultConfigs);
        logger.info("✅ Se inicializaron {} configuraciones por defecto", defaultConfigs.size());
    }

    private List<ConfigurationProperty> getDefaultConfigurations() {
        List<ConfigurationProperty> configs = new ArrayList<>();

        // Email
        configs.add(createConfig("spring.mail.host", "smtp.gmail.com", "Correo SMTP",
                "Servidor SMTP", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("spring.mail.port", "587", "Correo SMTP",
                "Puerto SMTP", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("spring.mail.username", "", "Correo SMTP",
                "Usuario SMTP", false, ConfigurationProperty.ValueType.EMAIL));
        configs.add(createConfig("spring.mail.password", "", "Correo SMTP",
                "Contraseña SMTP", true, ConfigurationProperty.ValueType.PASSWORD));
        configs.add(createConfig("spring.mail.properties.mail.smtp.auth", "true", "Correo SMTP",
                "Autenticación SMTP", false, ConfigurationProperty.ValueType.BOOLEAN));
        configs.add(createConfig("spring.mail.properties.mail.smtp.starttls.enable", "true", "Correo SMTP",
                "Habilitar STARTTLS", false, ConfigurationProperty.ValueType.BOOLEAN));

        // JWT
        configs.add(createConfig("jwt.expiration", "86400000", "Seguridad",
                "Tiempo de expiración del token (ms)", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("jwt.refresh-expiration", "604800000", "Seguridad",
                "Tiempo de expiración del refresh token (ms)", false, ConfigurationProperty.ValueType.NUMBER));

        // App
        configs.add(createConfig("app.name", "NewbieCore", "Aplicación",
                "Nombre de la aplicación", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("app.config.auto-refresh", "true", "Aplicación",
                "Auto-refresh de beans al cambiar propiedades", false, ConfigurationProperty.ValueType.BOOLEAN));

        return configs;
    }

    private ConfigurationProperty createConfig(String key, String value, String category,
                                               String description, boolean isSensitive,
                                               ConfigurationProperty.ValueType type) {
        ConfigurationProperty config = new ConfigurationProperty();
        config.setKey(key);
        config.setValue(value);
        config.setCategory(category);
        config.setDescription(description);
        config.setIsSensitive(isSensitive);
        config.setIsEditable(true);
        config.setValueType(type);
        config.setIsActive(true);
        return config;
    }
}