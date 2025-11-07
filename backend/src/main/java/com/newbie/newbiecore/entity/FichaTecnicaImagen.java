package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ficha_tecnica_imagenes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaTecnicaImagen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // muchas imágenes -> 1 ficha
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaTecnica fichaTecnica;

    // ruta relativa que expones con /uploads/**
    @Column(name = "ruta", length = 600, nullable = false)
    private String ruta;
}
