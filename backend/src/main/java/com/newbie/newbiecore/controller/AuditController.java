package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.audit.AuditService;
import com.newbie.newbiecore.entity.AuditLog;
import com.newbie.newbiecore.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador para consultar los registros de auditoría.
 * Solo accesible para administradores.
 */
@RestController
@RequestMapping("/api/auditoria")
public class AuditController {

    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditService auditService, AuditLogRepository auditLogRepository) {
        this.auditService = auditService;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Obtener todos los registros de auditoría con paginación
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLog> logs = auditLogRepository.findAll(pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener registros por tipo de entidad
     */
    @GetMapping("/entidad/{tipoEntidad}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> porTipoEntidad(@PathVariable String tipoEntidad) {
        List<AuditLog> logs = auditService.obtenerPorTipoEntidad(tipoEntidad);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener registros por usuario
     */
    @GetMapping("/usuario/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> porUsuario(@PathVariable String username) {
        List<AuditLog> logs = auditService.obtenerPorUsuario(username);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener registros por clave de entidad (ej: OT-00015)
     */
    @GetMapping("/clave/{entityKey}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> porClaveEntidad(@PathVariable String entityKey) {
        List<AuditLog> logs = auditService.obtenerPorEntidad(entityKey);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener registros por rango de fechas
     */
    @GetMapping("/rango")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> porRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);
        
        List<AuditLog> logs = auditService.obtenerPorRangoFechas(inicio, fin);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener historial de una orden de trabajo específica
     */
    @GetMapping("/orden/{numeroOrden}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    public ResponseEntity<List<AuditLog>> historialOrden(@PathVariable String numeroOrden) {
        List<AuditLog> logs = auditService.obtenerPorEntidad(numeroOrden);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener estadísticas de auditoría
     */
    @GetMapping("/estadisticas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> estadisticas() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalRegistros = auditLogRepository.count();
        
        // Registros de hoy
        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        LocalDateTime finHoy = LocalDate.now().atTime(LocalTime.MAX);
        List<AuditLog> logsHoy = auditService.obtenerPorRangoFechas(inicioHoy, finHoy);
        
        // Registros de la semana
        LocalDateTime inicioSemana = LocalDate.now().minusDays(7).atStartOfDay();
        List<AuditLog> logsSemana = auditService.obtenerPorRangoFechas(inicioSemana, finHoy);
        
        stats.put("totalRegistros", totalRegistros);
        stats.put("registrosHoy", logsHoy.size());
        stats.put("registrosSemana", logsSemana.size());
        stats.put("ultimosRegistros", logsHoy.stream().limit(10).toList());
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Obtener registros de cambios de configuración
     */
    @GetMapping("/configuracion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> cambiosConfiguracion(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository.findConfigurationChanges(pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Obtener registros de acceso (login/logout)
     */
    @GetMapping("/accesos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> registrosAcceso() {
        List<AuditLog> logins = auditService.obtenerPorTipoEntidad("Usuario");
        return ResponseEntity.ok(logins);
    }
}
