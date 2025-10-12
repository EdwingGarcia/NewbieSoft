package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reparacion_servicio")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReparacionServicio {
    @EmbeddedId
    private ReparacionServicioId id;

    @ManyToOne
    @MapsId("idReparacion")
    @JoinColumn(name = "id_reparacion")
    private Reparacion reparacion;

    @ManyToOne
    @MapsId("idServicio")
    @JoinColumn(name = "id_servicio")
    private Servicio servicio;

    private Integer cantidad = 1;
}
