package com.newbie.newbiecore.dto.Consultas;

import com.newbie.newbiecore.dto.EquipoDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO público para consultas de cliente.
 * Incluye información de costos para transparencia.
 */
public record OrdenPublicaDto(
                String numeroOrden,
                String estado,
                String tipoServicio,
                Instant fechaHoraIngreso,
                Instant fechaHoraEntrega,
                EquipoDto equipo,
                String accesorios,
                String problemaReportado,
                String observacionesIngreso,
                String diagnosticoTrabajo,
                String observacionesRecomendaciones,
                String motivoCierre,
                // Costos
                List<CostoItemDto> costos,
                BigDecimal totalCostos) {
        /**
         * DTO para cada item de costo (producto o servicio)
         */
        public record CostoItemDto(
                        String tipo, // PRODUCTO | SERVICIO
                        String descripcion,
                        BigDecimal costoUnitario,
                        Integer cantidad,
                        BigDecimal subtotal) {
        }
}
