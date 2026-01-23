package com.newbie.newbiecore.dto.costos;

import java.math.BigDecimal;

public record CostosTotalesDto(
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal iva,
        BigDecimal total
) {}
