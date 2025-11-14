package com.newbie.newbiecore.dto.OrdenTrabajo;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record OrdenTrabajoDetalleDto(
        // ===== ORDEN =====
        Long ordenId,
        String numeroOrden,
        Instant fechaHoraIngreso,
        String medioContacto,
        String estado,

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

        // Ficha técnica
        Long fichaId,
        Instant fechaFicha,
        String observacionesFicha,
        String tecnicoFichaCedula,
        String tecnicoFichaNombre,
        List<String> urlsImagenesFicha
) {}
