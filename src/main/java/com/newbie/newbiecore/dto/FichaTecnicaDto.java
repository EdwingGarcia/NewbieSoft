package com.newbie.newbiecore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FichaTecnicaDto {
    private Long id;
    private Long reparacionId;
    private String firmaAceptacion;
    private String firmaConformidad;
    private String xmlDatos;
    private String fotos;
}
