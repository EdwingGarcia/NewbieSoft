package com.newbie.newbiecore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EquipoListDto {
    private Long idEquipo;
    private String tipo;
    private String marca;
    private String modelo;
    private String numeroSerie;
    private String hostname;
    private String sistemaOperativo;
}
