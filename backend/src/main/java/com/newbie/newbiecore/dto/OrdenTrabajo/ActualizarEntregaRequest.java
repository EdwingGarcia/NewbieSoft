package com.newbie.newbiecore.dto.OrdenTrabajo;

public record ActualizarEntregaRequest(
        // Estado + clasificación
        String tipoServicio,
        String prioridad,
        String estado,
        Boolean cerrarOrden,

        // Texto técnico
        String diagnosticoTrabajo,
        String observacionesRecomendaciones,

        // Costos (vienen como number desde el front)
        Double costoManoObra,
        Double costoRepuestos,
        Double costoOtros,
        Double descuento,
        Double subtotal,
        Double iva,
        Double total,

        // Garantía y cierre
        Boolean esEnGarantia,
        Long referenciaOrdenGarantia,
        String motivoCierre,
        String cerradaPor,

        // OTP
        String otpCodigo,
        Boolean otpValidado
) {}
