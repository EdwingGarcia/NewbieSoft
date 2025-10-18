package com.newbie.newbiecore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EquipoDto {
    private Long id;
    private String numeroSerie;
    private String modelo;
    private String marca;
    private String cedulaCliente;
}
