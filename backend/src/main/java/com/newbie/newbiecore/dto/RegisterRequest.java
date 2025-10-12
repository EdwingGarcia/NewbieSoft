package com.newbie.newbiecore.dto;

import com.newbie.newbiecore.entity.Rol;


import lombok.Data;

@Data
public class RegisterRequest {
	private String cedula;
    private String nombre;
    private String correo;
    private String password;
    private Rol rol; // ADMINISTRADOR, TECNICO, CLIENTE
}
