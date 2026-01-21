package com.newbie.newbiecore.dto.catalogo;

import java.math.BigDecimal;

public record CatalogoItemDto(
        Long id,
        String tipo,
        String descripcion,
        BigDecimal costo
) {}
