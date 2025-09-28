package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "usuarios")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name="nombre", nullable=false)
    private String nombre;

    @Column(name="correo", nullable=false, unique=true)
    private String correo;

    @Column(name="password", nullable=false)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="rol_id")
    private Rol rol;

    @Column(name="estado")
    private Boolean estado = true;
}
