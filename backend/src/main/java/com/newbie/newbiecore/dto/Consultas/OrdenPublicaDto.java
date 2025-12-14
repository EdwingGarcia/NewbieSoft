package com.newbie.newbiecore.dto.Consultas;

import java.time.Instant;

public record OrdenPublicaDto(
        String numeroOrden,
        String estado,
        String tipoServicio,
        String prioridad,
        Instant fechaHoraIngreso,
        Instant fechaHoraEntrega,
        String problemaReportado
) {}
