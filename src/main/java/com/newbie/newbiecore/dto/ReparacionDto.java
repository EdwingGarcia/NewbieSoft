package com.newbie.newbiecore.dto;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReparacionDto {
    private Long id;
    private String equipoModelo;
    private String tecnicoNombre;
    private String estado;
    private String diagnostico;
    private Double costoTotal;
}
