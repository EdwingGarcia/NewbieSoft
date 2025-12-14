package com.newbie.newbiecore.dto.Consultas;

public record ConsultaOtpVerifyResponse(boolean ok, String message, String consultaToken, long expiresInSeconds) {}
