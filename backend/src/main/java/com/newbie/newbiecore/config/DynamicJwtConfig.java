package com.newbie.newbiecore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * Configuración dinámica de JWT.
 *
 * Esta clase mantiene los valores actuales de JWT y se refresca
 * automáticamente cuando cambian las propiedades en la BD.
 */
@Component
@RefreshScope
public class DynamicJwtConfig {

    private static final Logger logger = LoggerFactory.getLogger(DynamicJwtConfig.class);

    @Value("${jwt.secret:defaultSecretKeyThatShouldBeChangedInProduction123456789}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    @Value("${jwt.issuer:NewbieCore}")
    private String issuer;

    @PostConstruct
    public void init() {
        logger.info("🔄 DynamicJwtConfig inicializado/refrescado");
        logger.info("   - Issuer: {}", issuer);
        logger.info("   - Expiration: {} ms ({} horas)", expiration, expiration / 3600000);
        logger.info("   - Refresh Expiration: {} ms ({} días)", refreshExpiration, refreshExpiration / 86400000);
    }

    public String getSecret() {
        return secret;
    }

    public long getExpiration() {
        return expiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public String getIssuer() {
        return issuer;
    }
}