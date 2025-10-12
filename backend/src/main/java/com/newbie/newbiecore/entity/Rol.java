package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Rol {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rol")
    private Long idRol;

    @Column(name="nombre", nullable=false)
    private String nombre;

    @Column(name="descripcion")
    private String descripcion;
}
