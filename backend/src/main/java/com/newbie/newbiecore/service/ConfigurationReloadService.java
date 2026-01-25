package com.newbie.newbiecore.service;

import com.newbie.newbiecore.config.DatabasePropertySourceConfig.DatabasePropertySourceManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class ConfigurationReloadService {

    private static final Logger log = LoggerFactory.getLogger(ConfigurationReloadService.class);

    private final ContextRefresher contextRefresher;

    @Autowired(required = false)
    private DatabasePropertySourceManager propertySourceManager;

    public ConfigurationReloadService(ContextRefresher contextRefresher) {
        this.contextRefresher = contextRefresher;
    }

    /**
     * Refresca las configuraciones:
     * 1. Primero refresca el cache del DatabasePropertySource
     * 2. Luego refresca los beans con @RefreshScope
     */
    public void refresh() {
        log.info("🔄 Iniciando refresh de configuraciones...");

        // 1. Refrescar el cache de propiedades de la BD
        if (propertySourceManager != null) {
            try {
                propertySourceManager.refreshAllProperties();
                log.info("✅ Cache de propiedades refrescado desde BD");
            } catch (Exception e) {
                log.error("❌ Error refrescando cache de propiedades: {}", e.getMessage());
            }
        }

        // 2. Refrescar los beans con @RefreshScope
        try {
            Set<String> refreshedKeys = contextRefresher.refresh();
            log.info("✅ ContextRefresher completado. Keys refrescadas: {}", refreshedKeys);
        } catch (Exception e) {
            log.error("❌ Error en ContextRefresher.refresh(): {}", e.getMessage(), e);
        }
    }

    /**
     * Solo refresca el cache de propiedades sin refrescar los beans
     * Útil para actualizaciones que no afectan beans con @RefreshScope
     */
    public void refreshPropertiesOnly() {
        if (propertySourceManager != null) {
            propertySourceManager.refreshAllProperties();
            log.info("✅ Solo cache de propiedades refrescado");
        }
    }
}
