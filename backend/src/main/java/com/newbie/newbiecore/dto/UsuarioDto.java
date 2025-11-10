package com.newbie.newbiecore.dto;

import com.newbie.newbiecore.entity.Rol;
import lombok.Data;

@Data
public class UsuarioDto {
    private String cedula;
    private String nombre;
    private String correo;
    private String telefono;
    private String direccion;
    private RolDto rol;
    private boolean estado;

    @Data
    public static class RolDto {
        private Long idRol;
        private String nombre;
        private String descripcion;
    }
}
