package com.newbie.newbiecore.dto;



import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class ReparacionCreateDTO {
    @NotNull
    private Long equipoId;
    private String tecnicoId;
    private Instant fechaInicio;
    private String estado;
    private String diagnostico;
    private String observaciones;
    private Double costoTotal;
}