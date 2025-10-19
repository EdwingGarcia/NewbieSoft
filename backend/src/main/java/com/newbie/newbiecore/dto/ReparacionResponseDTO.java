package com.newbie.newbiecore.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class ReparacionResponseDTO {
    private Long idReparacion;
    private Long equipoId;
    private String numeroSerie;
    private String modelo;
    private String marca;
    private String tecnicoCedula;
    private String tecnicoNombre;
    private String tecnicoCorreo;
    private Instant fechaInicio;
    private Instant fechaFin;
    private String estado;
    private String diagnostico;
}
