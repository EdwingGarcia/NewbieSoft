package com.newbie.newbiecore.util;

import com.newbie.newbiecore.dto.UsuarioDto;
import com.newbie.newbiecore.entity.Usuario;

public class MapperUtils {

    public static UsuarioDto toDto(Usuario usuario) {
        return UsuarioDto.builder()
                .id(usuario.getIdUsuario())
                .nombre(usuario.getNombre())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().getNombre())
                .estado(usuario.getEstado())
                .build();
    }
}
