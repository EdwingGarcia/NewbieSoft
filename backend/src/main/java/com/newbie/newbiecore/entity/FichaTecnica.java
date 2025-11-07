package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "fichas_tecnicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaTecnica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // técnico (LAZY)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tecnico_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario tecnico;

    // equipo (LAZY)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Equipo equipo;


    @OneToMany(mappedBy = "fichaTecnica", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"fichaTecnica"})   // para no hacer bucle
    private java.util.List<FichaTecnicaImagen> imagenes = new java.util.ArrayList<>();


    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant fechaCreacion;
}
