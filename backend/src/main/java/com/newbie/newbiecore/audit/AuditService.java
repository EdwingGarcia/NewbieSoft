package com.newbie.newbiecore.audit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.newbie.newbiecore.entity.AuditLog;
import com.newbie.newbiecore.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio centralizado de auditoría.
 * Registra todas las acciones importantes del sistema para trazabilidad.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        // Configurar para ignorar propiedades con @JsonIgnore
        this.objectMapper.addMixIn(Object.class, IgnoreHibernatePropertiesMixin.class);
    }

    /**
     * Registra una acción de auditoría
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(TipoAccion tipoAccion, String entityType, String entityKey, String detalles) {
        registrar(tipoAccion, entityType, entityKey, null, null, detalles);
    }

    /**
     * Registra una acción de auditoría con valores anterior y nuevo
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(TipoAccion tipoAccion, String entityType, String entityKey, 
                          Object valorAnterior, Object valorNuevo, String detalles) {
        try {
            AuditLog log = new AuditLog();
            log.setAction(tipoAccion.name());
            log.setEntityType(entityType);
            log.setEntityKey(entityKey);
            log.setDetails(detalles);
            log.setTimestamp(LocalDateTime.now());
            log.setUsername(obtenerUsuarioActual());
            log.setIpAddress(obtenerIpCliente());

            if (valorAnterior != null) {
                log.setOldValue(serializarObjeto(valorAnterior));
            }
            if (valorNuevo != null) {
                log.setNewValue(serializarObjeto(valorNuevo));
            }

            auditLogRepository.save(log);
        } catch (Exception e) {
            // No lanzar excepción para no afectar la operación principal
            System.err.println("Error al registrar auditoría: " + e.getMessage());
        }
    }

    /**
     * Registra creación de entidad
     */
    public void registrarCreacion(String entityType, String entityKey, Object entidad, String detalles) {
        registrar(TipoAccion.CREAR, entityType, entityKey, null, entidad, detalles);
    }

    /**
     * Registra actualización de entidad
     */
    public void registrarActualizacion(String entityType, String entityKey, Object valorAnterior, Object valorNuevo, String detalles) {
        registrar(TipoAccion.ACTUALIZAR, entityType, entityKey, valorAnterior, valorNuevo, detalles);
    }

    /**
     * Registra eliminación de entidad
     */
    public void registrarEliminacion(String entityType, String entityKey, Object entidad, String detalles) {
        registrar(TipoAccion.ELIMINAR, entityType, entityKey, entidad, null, detalles);
    }

    /**
     * Registra inicio de sesión
     */
    public void registrarLogin(String usuario, boolean exitoso) {
        TipoAccion accion = exitoso ? TipoAccion.LOGIN : TipoAccion.LOGIN_FALLIDO;
        registrar(accion, "Usuario", usuario, exitoso ? "Inicio de sesión exitoso" : "Intento de inicio de sesión fallido");
    }

    /**
     * Registra cierre de sesión
     */
    public void registrarLogout(String usuario) {
        registrar(TipoAccion.LOGOUT, "Usuario", usuario, "Cierre de sesión");
    }

    /**
     * Registra cambio de estado de orden de trabajo
     */
    public void registrarCambioEstadoOT(String numeroOrden, String estadoAnterior, String estadoNuevo) {
        String detalles = String.format("Estado cambiado de '%s' a '%s'", estadoAnterior, estadoNuevo);
        registrar(TipoAccion.OT_ESTADO_CAMBIADO, "OrdenTrabajo", numeroOrden, estadoAnterior, estadoNuevo, detalles);
    }

    /**
     * Registra firma de documento
     */
    public void registrarFirma(TipoAccion tipoFirma, String numeroOrden, String firmante) {
        String detalles = String.format("Firmado por: %s", firmante);
        registrar(tipoFirma, "FirmaOrdenTrabajo", numeroOrden, detalles);
    }

    /**
     * Registra generación de PDF
     */
    public void registrarPdfGenerado(String tipoPdf, String referencia) {
        String detalles = String.format("PDF generado: %s para %s", tipoPdf, referencia);
        registrar(TipoAccion.PDF_GENERADO, "Documento", referencia, detalles);
    }

    /**
     * Registra generación de PDF con información detallada
     */
    public void registrarPdfGenerado(String numeroOrden, String tipoPdf, String responsable, String descripcion) {
        String detalles = String.format("PDF: %s - Responsable: %s - %s", tipoPdf, responsable != null ? responsable : "N/A", descripcion);
        registrar(TipoAccion.PDF_GENERADO, "Documento", numeroOrden, detalles);
    }

    /**
     * Registra firma de documento con información completa
     */
    public void registrarFirma(String numeroOrden, String tipoFirma, String tipoFirmante, 
                               String nombreFirmante, String cedulaFirmante, String descripcion) {
        TipoAccion accion = "CONFORMIDAD".equals(tipoFirma) ? TipoAccion.FIRMA_CONFORMIDAD : TipoAccion.FIRMA_RECIBO;
        String detalles = String.format("Tipo: %s, Firmante: %s (%s), Cédula: %s - %s", 
            tipoFirma, nombreFirmante, tipoFirmante, 
            cedulaFirmante != null ? cedulaFirmante : "N/A", descripcion);
        registrar(accion, "FirmaOrdenTrabajo", numeroOrden, detalles);
    }

    /**
     * Registra cambio de configuración
     */
    public void registrarCambioConfiguracion(String clave, String valorAnterior, String valorNuevo) {
        String detalles = String.format("Configuración '%s' modificada", clave);
        registrar(TipoAccion.CONFIG_MODIFICADA, "ConfigurationProperty", clave, valorAnterior, valorNuevo, detalles);
    }

    /**
     * Consultar logs por tipo de entidad
     */
    @Transactional(readOnly = true)
    public List<AuditLog> obtenerPorTipoEntidad(String entityType) {
        return auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType);
    }

    /**
     * Consultar logs por usuario
     */
    @Transactional(readOnly = true)
    public List<AuditLog> obtenerPorUsuario(String username) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username);
    }

    /**
     * Consultar logs por clave de entidad (ej: número de orden)
     */
    @Transactional(readOnly = true)
    public List<AuditLog> obtenerPorEntidad(String entityKey) {
        return auditLogRepository.findByEntityKeyOrderByTimestampDesc(entityKey);
    }

    /**
     * Consultar logs por rango de fechas
     */
    @Transactional(readOnly = true)
    public List<AuditLog> obtenerPorRangoFechas(LocalDateTime inicio, LocalDateTime fin) {
        return auditLogRepository.findByDateRange(inicio, fin);
    }

    // ============ MÉTODOS PRIVADOS ============

    private String obtenerUsuarioActual() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return auth.getName();
            }
        } catch (Exception e) {
            // Ignorar errores de contexto de seguridad
        }
        return "SISTEMA";
    }

    private String obtenerIpCliente() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Ignorar errores de contexto
        }
        return "N/A";
    }

    private String serializarObjeto(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return obj.toString();
        }
    }

    // Mixin para ignorar propiedades de Hibernate
    private abstract class IgnoreHibernatePropertiesMixin {
        @JsonIgnore abstract Object getHandler();
        @JsonIgnore abstract Object getHibernateLazyInitializer();
    }
}
