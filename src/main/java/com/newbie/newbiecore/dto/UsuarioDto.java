package com.newbie.newbiecore.dto;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UsuarioDto {
    private Long id;
    private String nombre;
    private String correo;
    private String rol;
    private Boolean estado;
}
