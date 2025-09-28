package com.newbie.newbiecore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClienteDto {
    private Long id;
    private String nombre;
    private String cedula;
    private String correo;
    private String telefono;
    private String direccion;
}
