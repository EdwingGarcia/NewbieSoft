package com.newbie.newbiecore.dto.Consultas;

// Agregamos el campo recaptchaToken
public record ConsultaOtpRequest(
        String cedula,
        String correo,
        String recaptchaToken
) {}