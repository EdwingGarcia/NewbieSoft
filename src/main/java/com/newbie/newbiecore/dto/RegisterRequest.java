package com.newbie.newbiecore.dto;


import lombok.Data;

@Data
public class RegisterRequest {
	private String cedula;
    private String nombre;
    private String correo;
    private String password;
    private String rol; // ADMINISTRADOR, TECNICO, CLIENTE
}
