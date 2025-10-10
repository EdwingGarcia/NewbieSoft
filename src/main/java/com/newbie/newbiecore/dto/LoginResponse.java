package com.newbie.newbiecore.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String correo;
    private String rol;                    // Rol principal o más representativo
    private List<String> roles;            // Lista de roles completos
    private List<String> permissions;      // Permisos específicos del usuario
    private List<String> screens;          // Pantallas que puede ver el usuario
}
