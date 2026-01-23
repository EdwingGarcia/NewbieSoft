package com.newbie.newbiecore.dto.Consultas;

import com.newbie.newbiecore.dto.EquipoDto;

import java.time.Instant;

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
        String motivoCierre
) {}
