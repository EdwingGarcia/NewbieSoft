package com.newbie.newbiecore.dto.costos;

import java.math.BigDecimal;

public record OrdenTrabajoCostoDto(
        Long id,
        String tipo,
        String descripcion,
        BigDecimal costoUnitario,
        Integer cantidad,
        BigDecimal subtotal
) {}
