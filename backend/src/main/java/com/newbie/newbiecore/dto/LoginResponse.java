package com.newbie.newbiecore.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;                  // Access Token (JWT principal)
    private String refreshToken;           // Refresh Token
    private String correo;                 // Correo del usuario
    private String rol;                    // Rol principal
    private List<String> roles;            // Lista de roles
    private List<String> permissions;      // Permisos específicos
    private List<String> screens;          // Pantallas habilitadas
}