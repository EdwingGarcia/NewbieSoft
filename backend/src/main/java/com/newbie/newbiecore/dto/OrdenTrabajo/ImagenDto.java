package com.newbie.newbiecore.dto.OrdenTrabajo;

import com.newbie.newbiecore.entity.CategoriaImagen;

import java.time.Instant;

public record ImagenDto(
        Long id,
        String ruta,
        CategoriaImagen categoria,
        String descripcion,
        Instant fechaSubida
) {}