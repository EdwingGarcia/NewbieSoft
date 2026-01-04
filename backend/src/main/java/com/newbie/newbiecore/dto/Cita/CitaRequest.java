package com.newbie.newbiecore.dto.Cita;

import java.time.LocalDateTime;

public class CitaRequest {
    private LocalDateTime fechaHoraInicio;
    private String motivo;
    private String usuarioId; // CORREGIDO: Long -> String

    // Getters y Setters
    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getUsuarioId() { return usuarioId; } // CORREGIDO
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; } // CORREGIDO
}