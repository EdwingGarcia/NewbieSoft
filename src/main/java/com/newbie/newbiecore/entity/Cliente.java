package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "clientes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Cliente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id_cliente")
    private Long idCliente;

    @Column(name="nombre", nullable=false)
    private String nombre;

    @Column(name="cedula", nullable=false, unique=true)
    private String cedula;

    @Column(name="correo")
    private String correo;

    @Column(name="telefono")
    private String telefono;

    @Column(name="direccion")
    private String direccion;

    @ManyToOne
    @JoinColumn(name="usuario_id")
    private Usuario usuario; // quien creó/registro si aplica
}
