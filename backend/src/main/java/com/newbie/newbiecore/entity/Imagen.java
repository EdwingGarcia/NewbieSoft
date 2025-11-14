package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "imagenes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Imagen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)  // <<<<<< OBLIGATORIO
    @Column(length = 50, nullable = false)
    private CategoriaImagen categoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "orden_trabajo_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "imagenes"})
    private OrdenTrabajo ordenTrabajo;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant fechaSubida;

    @Column(name = "ruta", length = 600, nullable = false)
    private String ruta;

    @Column(length = 255)
    private String descripcion;
}
