package com.newbie.newbiecore.service;

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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConfigurationService {

    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);

    @Autowired
    private ConfigurationPropertyRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Obtiene todas las configuraciones agrupadas por categoría
     */
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

    /**
     * Obtiene todas las configuraciones como lista
     */
    public List<ConfigurationPropertyDTO> getAllConfigurations(boolean maskSensitive) {
        return repository.findAllOrderByCategoryAndKey().stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.toList());
    }

    /**
     * Obtiene configuraciones por categoría
     */
    public List<ConfigurationPropertyDTO> getByCategory(String category, boolean maskSensitive) {
        return repository.findByCategoryOrderByKeyAsc(category).stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una configuración por ID
     */
    public ConfigurationPropertyDTO getById(Long id, boolean maskSensitive) {
        ConfigurationProperty property = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con ID: " + id));
        return ConfigurationPropertyDTO.fromEntity(property, maskSensitive);
    }

    /**
     * Obtiene una configuración por clave
     */
    public ConfigurationPropertyDTO getByKey(String key, boolean maskSensitive) {
        ConfigurationProperty property = repository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada: " + key));
        return ConfigurationPropertyDTO.fromEntity(property, maskSensitive);
    }

    /**
     * Obtiene el valor de una propiedad por clave (uso interno)
     */
    public String getPropertyValue(String key) {
        return repository.findByKey(key)
                .map(ConfigurationProperty::getValue)
                .orElse(null);
    }

    /**
     * Obtiene todas las categorías disponibles
     */
    public List<String> getAllCategories() {
        return repository.findAllCategories();
    }

    /**
     * Busca configuraciones por texto
     */
    public List<ConfigurationPropertyDTO> search(String searchText, boolean maskSensitive) {
        return repository.searchByKeyOrDescription(searchText).stream()
                .map(p -> ConfigurationPropertyDTO.fromEntity(p, maskSensitive))
                .collect(Collectors.toList());
    }

    /**
     * Actualiza una configuración individual
     */
    @Transactional
    public ConfigurationPropertyDTO updateConfiguration(Long id, String newValue) {
        ConfigurationProperty property = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con ID: " + id));

        if (!property.getIsEditable()) {
            throw new ConfigurationException("La configuración '" + property.getKey() + "' no es editable");
        }

        String oldValue = property.getValue();
        String currentUser = getCurrentUsername();

        validateValue(newValue, property.getValueType());

        property.setValue(newValue);
        property.setUpdatedBy(currentUser);

        ConfigurationProperty saved = repository.save(property);

        auditLogService.logConfigurationChange(
                property.getKey(),
                property.getIsSensitive() ? "***" : oldValue,
                property.getIsSensitive() ? "***" : newValue,
                currentUser
        );

        logger.info("Configuración actualizada: {} por usuario: {}", property.getKey(), currentUser);

        return ConfigurationPropertyDTO.fromEntity(saved, true);
    }

    /**
     * Actualiza múltiples configuraciones en lote
     */
    @Transactional
    public List<ConfigurationPropertyDTO> bulkUpdate(BulkUpdateConfigurationDTO bulkUpdate) {
        List<ConfigurationPropertyDTO> updatedConfigs = new ArrayList<>();
        String currentUser = getCurrentUsername();

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

                    ConfigurationProperty saved = repository.save(property);

                    auditLogService.logConfigurationChange(
                            property.getKey(),
                            property.getIsSensitive() ? "***" : oldValue,
                            property.getIsSensitive() ? "***" : update.getValue(),
                            currentUser
                    );

                    updatedConfigs.add(ConfigurationPropertyDTO.fromEntity(saved, true));
                }
            } catch (Exception e) {
                logger.error("Error actualizando configuración ID {}: {}", update.getId(), e.getMessage());
                throw new ConfigurationException("Error actualizando configuración: " + e.getMessage());
            }
        }

        logger.info("Actualización en lote completada. {} configuraciones actualizadas por {}",
                updatedConfigs.size(), currentUser);

        return updatedConfigs;
    }

    /**
     * Valida el valor según el tipo de propiedad
     */
    private void validateValue(String value, ConfigurationProperty.ValueType type) {
        if (value == null) {
            return;
        }

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
                break;
        }
    }

    /**
     * Obtiene el username actual del contexto de seguridad
     */
    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    /**
     * Inicializa las configuraciones por defecto desde application.properties
     */
    @PostConstruct
    @Transactional
    public void initializeDefaultConfigurations() {
        if (repository.count() > 0) {
            logger.info("Las configuraciones ya están inicializadas en la base de datos");
            return;
        }

        logger.info("Inicializando configuraciones por defecto...");

        List<ConfigurationProperty> defaultConfigs = getDefaultConfigurations();
        repository.saveAll(defaultConfigs);

        logger.info("Se inicializaron {} configuraciones por defecto", defaultConfigs.size());
    }

    /**
     * Define las configuraciones por defecto
     */
    private List<ConfigurationProperty> getDefaultConfigurations() {
        List<ConfigurationProperty> configs = new ArrayList<>();

        // === APLICACIÓN ===
        configs.add(createConfig("spring.application.name", "NewbieCore", "Aplicación",
                "Nombre de la aplicación", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("server.port", "8080", "Aplicación",
                "Puerto del servidor", false, ConfigurationProperty.ValueType.NUMBER));

        // === BASE DE DATOS ===
        configs.add(createConfig("spring.datasource.url", "jdbc:postgresql://localhost:5433/newbie_db",
                "Base de Datos", "URL de conexión a PostgreSQL", false, ConfigurationProperty.ValueType.URL));
        configs.add(createConfig("spring.datasource.username", "postgres", "Base de Datos",
                "Usuario de base de datos", true, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("spring.datasource.password", "postgres", "Base de Datos",
                "Contraseña de base de datos", true, ConfigurationProperty.ValueType.PASSWORD));
        configs.add(createConfig("spring.jpa.hibernate.ddl-auto", "update", "Base de Datos",
                "Estrategia DDL de Hibernate", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("spring.jpa.show-sql", "true", "Base de Datos",
                "Mostrar consultas SQL", false, ConfigurationProperty.ValueType.BOOLEAN));
        configs.add(createConfig("spring.jpa.properties.hibernate.dialect",
                "org.hibernate.dialect.PostgreSQLDialect", "Base de Datos",
                "Dialecto de Hibernate", false, ConfigurationProperty.ValueType.STRING));

        // === SEGURIDAD JWT ===
        configs.add(createConfig("app.jwt.secret", "MySuperSecretKeyForJWTs1234567890!!",
                "Seguridad", "Clave secreta JWT", true, ConfigurationProperty.ValueType.PASSWORD));
        configs.add(createConfig("app.jwt.expiration-ms", "3600000", "Seguridad",
                "Tiempo de expiración del token (ms)", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("app.jwt.refresh-expiration-ms", "604800000", "Seguridad",
                "Tiempo de expiración del refresh token (ms)", false, ConfigurationProperty.ValueType.NUMBER));

        // === CONFIGURACIÓN DE CORREO (SMTP) ===
        configs.add(createConfig("spring.mail.host", "smtp.gmail.com", "Correo SMTP",
                "Servidor SMTP", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("spring.mail.port", "587", "Correo SMTP",
                "Puerto SMTP", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("spring.mail.username", "sysinai3110@gmail.com", "Correo SMTP",
                "Usuario de correo", true, ConfigurationProperty.ValueType.EMAIL));
        configs.add(createConfig("spring.mail.password", "yhcw vnba ftuc rflg", "Correo SMTP",
                "Contraseña de aplicación de correo", true, ConfigurationProperty.ValueType.PASSWORD));
        configs.add(createConfig("spring.mail.properties.mail.smtp.auth", "true", "Correo SMTP",
                "Habilitar autenticación SMTP", false, ConfigurationProperty.ValueType.BOOLEAN));
        configs.add(createConfig("spring.mail.properties.mail.smtp.starttls.enable", "true", "Correo SMTP",
                "Habilitar STARTTLS", false, ConfigurationProperty.ValueType.BOOLEAN));
        configs.add(createConfig("spring.mail.properties.mail.smtp.starttls.required", "true", "Correo SMTP",
                "Requerir STARTTLS", false, ConfigurationProperty.ValueType.BOOLEAN));
        configs.add(createConfig("spring.mail.properties.mail.smtp.connectiontimeout", "5000", "Correo SMTP",
                "Timeout de conexión (ms)", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("spring.mail.properties.mail.smtp.timeout", "5000", "Correo SMTP",
                "Timeout de lectura (ms)", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("spring.mail.properties.mail.smtp.writetimeout", "5000", "Correo SMTP",
                "Timeout de escritura (ms)", false, ConfigurationProperty.ValueType.NUMBER));
        configs.add(createConfig("spring.mail.properties.mail.debug", "true", "Correo SMTP",
                "Modo debug de correo", false, ConfigurationProperty.ValueType.BOOLEAN));

        // === LOGGING ===
        configs.add(createConfig("logging.level.org.springframework.web", "DEBUG", "Logging",
                "Nivel de log para Spring Web", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("logging.level.org.hibernate.SQL", "DEBUG", "Logging",
                "Nivel de log para Hibernate SQL", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("logging.level.org.springframework.security", "DEBUG", "Logging",
                "Nivel de log para Spring Security", false, ConfigurationProperty.ValueType.STRING));

        // === ARCHIVOS ===
        configs.add(createConfig("spring.servlet.multipart.max-file-size", "20MB", "Archivos",
                "Tamaño máximo de archivo", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("spring.servlet.multipart.max-request-size", "20MB", "Archivos",
                "Tamaño máximo de request", false, ConfigurationProperty.ValueType.STRING));
        configs.add(createConfig("app.upload-dir", "C:/Users/Usuario/OneDrive/Desktop/Pruebas",
                "Archivos", "Directorio de uploads", false, ConfigurationProperty.ValueType.STRING));

        // === SERVICIOS EXTERNOS ===
        configs.add(createConfig("google.recaptcha.secret", "6LeSskosAAAAABoBNNxr5ThV3Qx2CanpZleWi98g",
                "Servicios Externos", "Clave secreta de reCAPTCHA", true, ConfigurationProperty.ValueType.PASSWORD));

        // === ACTUATOR ===
        configs.add(createConfig("management.endpoints.web.exposure.include", "mappings", "Actuator",
                "Endpoints expuestos de Actuator", false, ConfigurationProperty.ValueType.STRING));

        return configs;
    }

    private ConfigurationProperty createConfig(String key, String value, String category,
                                               String description, boolean isSensitive, ConfigurationProperty.ValueType type) {
        ConfigurationProperty config = new ConfigurationProperty();
        config.setKey(key);
        config.setValue(value);
        config.setCategory(category);
        config.setDescription(description);
        config.setIsSensitive(isSensitive);
        config.setIsEditable(true);
        config.setValueType(type);
        return config;
    }
}