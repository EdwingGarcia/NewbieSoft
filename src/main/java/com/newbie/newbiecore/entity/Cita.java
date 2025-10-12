package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "citas")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Cita {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Long idCita;

    @ManyToOne
    @JoinColumn(name = "cedula", nullable = false)
    private Usuario usuario;


    @ManyToOne
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;
    
    private Instant fecha;
    private String estado = "pendiente";
    private String observaciones;
}
