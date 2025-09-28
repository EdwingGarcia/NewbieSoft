package com.newbie.newbiecore.entity;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "servicios")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Servicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servicio")
    private Long idServicio;

    @Column(nullable = false, length = 100)
    private String nombre;

    private String descripcion;

    private Double precio;
}
