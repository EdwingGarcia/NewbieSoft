package com.newbie.newbiecore.dto.OrdenTrabajo;

import com.fasterxml.jackson.databind.JsonNode;
import com.newbie.newbiecore.dto.costos.OrdenTrabajoCostoDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrdenTrabajoDetalleDto(

        // ===== ORDEN =====
        Long ordenId,
        String numeroOrden,
        Instant fechaHoraIngreso,
        String medioContacto,
        String estado,
        String tipoServicio,
        String prioridad,

        // Técnico
        String tecnicoCedula,
        String tecnicoNombre,
        String tecnicoTelefono,
        String tecnicoCorreo,

        // Cliente
        String clienteCedula,
        String clienteNombre,
        String clienteTelefono,
        String clienteDireccion,
        String clienteCorreo,

        // Equipo
        Long equipoId,
        String tipoEquipo,
        String marca,
        String modelo,
        String numeroSerie,
        String hostname,
        String sistemaOperativo,
        JsonNode hardwareJson,

        // Ingreso
        String contrasenaEquipo,
        String accesorios,
        String problemaReportado,
        String observacionesIngreso,

        // Recepción
        Instant fechaHoraRecepcion,
        boolean firmaTecnicoRecepcion,
        boolean firmaClienteRecepcion,

        // Entrega
        String diagnosticoTrabajo,
        String observacionesRecomendaciones,
        String modalidad,
        Instant fechaHoraEntrega,
        String numeroFactura,
        String formaPago,
        boolean firmaTecnicoEntrega,
        boolean firmaClienteEntrega,
        boolean recibeASatisfaccion,

        // 💰 TOTALES
        BigDecimal subtotal,
        BigDecimal iva,
        BigDecimal total,

        // Cierre
        Boolean esEnGarantia,
        Long referenciaOrdenGarantia,
        String motivoCierre,
        String cerradaPor,

        // OTP
        String otpCodigo,
        Boolean otpValidado,
        Instant otpFechaValidacion,

        // Ficha técnica
        Long fichaId,
        Instant fechaFicha,
        String observacionesFicha,
        String tecnicoFichaCedula,
        String tecnicoFichaNombre,

        // 🔥 COSTOS DETALLADOS
        List<OrdenTrabajoCostoDto> costos
) {}
