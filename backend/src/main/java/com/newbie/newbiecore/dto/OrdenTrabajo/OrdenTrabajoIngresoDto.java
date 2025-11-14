package com.newbie.newbiecore.dto.OrdenTrabajo;

import java.time.Instant;


public record OrdenTrabajoIngresoDto(
        // Orden
        Long ordenId,
        String numeroOrden,
        String medioContacto,
        Instant fechaHoraIngreso,

        // Técnico asignado
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

        // Ingreso
        String contrasenaEquipo,
        String accesorios,

        // Problema + Observaciones
        String problemaReportado,
        String observacionesIngreso
) {}