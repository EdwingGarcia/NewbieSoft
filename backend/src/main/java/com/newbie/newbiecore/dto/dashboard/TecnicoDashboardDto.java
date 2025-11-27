package com.newbie.newbiecore.dto.dashboard;

public class TecnicoDashboardDto {

    private String tecnicoCedula;
    private String tecnicoNombre;
    private long totalOrdenes;
    private long ordenesAbiertas;
    private long ordenesEnProceso;
    private long ordenesCerradas;

    public TecnicoDashboardDto(
            String tecnicoCedula,
            String tecnicoNombre,
            long totalOrdenes,
            long ordenesAbiertas,
            long ordenesEnProceso,
            long ordenesCerradas
    ) {
        this.tecnicoCedula = tecnicoCedula;
        this.tecnicoNombre = tecnicoNombre;
        this.totalOrdenes = totalOrdenes;
        this.ordenesAbiertas = ordenesAbiertas;
        this.ordenesEnProceso = ordenesEnProceso;
        this.ordenesCerradas = ordenesCerradas;
    }

    public String getTecnicoCedula() {
        return tecnicoCedula;
    }

    public String getTecnicoNombre() {
        return tecnicoNombre;
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
}
