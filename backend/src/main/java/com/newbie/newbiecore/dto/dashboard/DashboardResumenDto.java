package com.newbie.newbiecore.dto.dashboard;

import java.time.LocalDate;
import java.util.List;

public class DashboardResumenDto {

    private long totalOrdenes;
    private long ordenesAbiertas;
    private long ordenesEnProceso;
    private long ordenesCerradas;
    private long ordenesHoy;
    private long ordenesMes;

    // NUEVOS CAMPOS
    private long totalTecnicos;                 // técnicos que tienen al menos una OT
    private long tecnicosConOrdenesAbiertas;    // técnicos con OT abiertas
    private List<TecnicoDashboardDto> tecnicos; // ranking / detalle por técnico

    private LocalDate fechaGeneracion;

    public DashboardResumenDto() {
    }

    public DashboardResumenDto(
            long totalOrdenes,
            long ordenesAbiertas,
            long ordenesEnProceso,
            long ordenesCerradas,
            long ordenesHoy,
            long ordenesMes,
            long totalTecnicos,
            long tecnicosConOrdenesAbiertas,
            List<TecnicoDashboardDto> tecnicos,
            LocalDate fechaGeneracion
    ) {
        this.totalOrdenes = totalOrdenes;
        this.ordenesAbiertas = ordenesAbiertas;
        this.ordenesEnProceso = ordenesEnProceso;
        this.ordenesCerradas = ordenesCerradas;
        this.ordenesHoy = ordenesHoy;
        this.ordenesMes = ordenesMes;
        this.totalTecnicos = totalTecnicos;
        this.tecnicosConOrdenesAbiertas = tecnicosConOrdenesAbiertas;
        this.tecnicos = tecnicos;
        this.fechaGeneracion = fechaGeneracion;
    }

    public long getTotalOrdenes() {
        return totalOrdenes;
    }

    public long getOrdenesAbiertas() {
        return ordenesAbiertas;
    }

    public long getOrdenesEnProceso() {
        return ordenesEnProceso;
    }

    public long getOrdenesCerradas() {
        return ordenesCerradas;
    }

    public long getOrdenesHoy() {
        return ordenesHoy;
    }

    public long getOrdenesMes() {
        return ordenesMes;
    }

    public long getTotalTecnicos() {
        return totalTecnicos;
    }

    public long getTecnicosConOrdenesAbiertas() {
        return tecnicosConOrdenesAbiertas;
    }

    public List<TecnicoDashboardDto> getTecnicos() {
        return tecnicos;
    }

    public LocalDate getFechaGeneracion() {
        return fechaGeneracion;
    }
}
