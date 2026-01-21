package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.AuditLog;
import com.newbie.newbiecore.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    @Autowired(required = false)
    private AuditLogRepository auditLogRepository;

    /**
     * Registra un cambio en la configuración
     */
    public void logConfigurationChange(String propertyKey, String oldValue, String newValue, String username) {
        try {
            if (auditLogRepository != null) {
                AuditLog log = new AuditLog();
                log.setAction("CONFIG_UPDATE");
                log.setEntityType("ConfigurationProperty");
                log.setEntityKey(propertyKey);
                log.setOldValue(oldValue);
                log.setNewValue(newValue);
                log.setUsername(username);
                log.setTimestamp(LocalDateTime.now());
                log.setIpAddress(getClientIpAddress());

                auditLogRepository.save(log);
            }

            logger.info("AUDIT: Usuario '{}' modificó configuración '{}' de '{}' a '{}'",
                    username, propertyKey, oldValue, newValue);

        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría: {}", e.getMessage());
        }
    }

    /**
     * Registra una acción general
     */
    public void logAction(String action, String entityType, String entityId, String details, String username) {
        try {
            if (auditLogRepository != null) {
                AuditLog log = new AuditLog();
                log.setAction(action);
                log.setEntityType(entityType);
                log.setEntityKey(entityId);
                log.setDetails(details);
                log.setUsername(username);
                log.setTimestamp(LocalDateTime.now());
                log.setIpAddress(getClientIpAddress());

                auditLogRepository.save(log);
            }

            logger.info("AUDIT: {} - {} - {} - {} by {}", action, entityType, entityId, details, username);

        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría: {}", e.getMessage());
        }
    }

    private String getClientIpAddress() {
        return "127.0.0.1";
    }
}