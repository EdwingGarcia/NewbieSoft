package com.newbie.newbiecore.dto.costos;

public record AgregarCostoRequest(
    Long catalogoItemId,
    Integer cantidad
) {}
