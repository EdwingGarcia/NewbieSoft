package com.newbie.newbiecore.dto.OrdenTrabajo;

import java.time.Instant;


public record ActualizarEntregaRequest(
        String diagnosticoTrabajo,
        String observacionesRecomendaciones,
        String modalidad,          // 👈 solo en la entrega
        Instant fechaHoraEntrega,
        String numeroFactura,
        String formaPago,
        boolean firmaTecnicoEntrega,
        boolean firmaClienteEntrega,
        boolean recibeASatisfaccion
) {}