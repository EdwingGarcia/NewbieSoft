package com.newbie.newbiecore.dto.Cita;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CitaRequest {

    private LocalDateTime fechaHoraInicio;
    private String motivo;

    @JsonAlias({"usuarioId"}) // 👈 acepta nombre viejo
    private String clienteId;

    @JsonAlias({"tecnicoId", "tecnicoAsignado"}) // por si antes venía distinto
    private String tecnicoAsignadoId;
}