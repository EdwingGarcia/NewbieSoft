package com.newbie.newbiecore.dto.OrdenTrabajo;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;

public record OrdenTrabajoDetalleDto(
        // ===== ORDEN =====
        Long ordenId,
        String numeroOrden,
        Instant fechaHoraIngreso,
        String medioContacto,
        String estado,
        String tipoServicio,
        String prioridad,

        // Técnico asignado (cabecera)
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

        // ✅ CAMPOS ECONÓMICOS
        BigDecimal costoManoObra,
        BigDecimal costoRepuestos,
        BigDecimal costoOtros,
        BigDecimal descuento,
        BigDecimal subtotal,
        BigDecimal iva,
        BigDecimal total,

        // ✅ GARANTÍA / CIERRE
        Boolean esEnGarantia,
        Long referenciaOrdenGarantia,
        String motivoCierre,
        String cerradaPor,

        // ✅ OTP
        String otpCodigo,
        Boolean otpValidado,
        Instant otpFechaValidacion,

        // ===== Ficha técnica (meta) =====
        Long fichaId,
        Instant fechaFicha,
        String observacionesFicha,
        String tecnicoFichaCedula,
        String tecnicoFichaNombre
) {}
