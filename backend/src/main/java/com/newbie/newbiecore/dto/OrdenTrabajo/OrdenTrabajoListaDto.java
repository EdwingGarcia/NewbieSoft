package com.newbie.newbiecore.dto.OrdenTrabajo;

import java.time.Instant;
import java.util.List;

public record OrdenTrabajoListaDto(
        Long id,
        String numeroOrden,
        String estado,
        String tipoServicio,    // 👈 NUEVO
        String prioridad,       // 👈 NUEVO

        Instant fechaHoraIngreso,
        Instant fechaHoraEntrega,

        String medioContacto,
        String modalidad,

        String clienteCedula,
        String clienteNombre,

        String tecnicoCedula,
        String tecnicoNombre,

        Long equipoId,
        String equipoModelo,
        String equipoHostname,

        String problemaReportado,
        String observacionesIngreso,
        String diagnosticoTrabajo,
        String observacionesRecomendaciones,

        List<ImagenDto> imagenes
) {}
