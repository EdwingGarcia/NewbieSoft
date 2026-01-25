package com.newbie.newbiecore.audit;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Configuración de auditoría JPA.
 * Habilita el llenado automático de
 * campos @CreatedDate, @LastModifiedDate, @CreatedBy, @LastModifiedBy
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return new AuditorAwareImpl();
    }

    /**
     * Implementación de AuditorAware que obtiene el usuario actual del contexto de
     * seguridad
     */
    static class AuditorAwareImpl implements AuditorAware<String> {

        @Override
        public Optional<String> getCurrentAuditor() {
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null || !authentication.isAuthenticated()) {
                    return Optional.of("SISTEMA");
                }

                Object principal = authentication.getPrincipal();
                if ("anonymousUser".equals(principal)) {
                    return Optional.of("ANONIMO");
                }

                return Optional.of(authentication.getName());
            } catch (Exception e) {
                return Optional.of("SISTEMA");
            }
        }
    }
}
