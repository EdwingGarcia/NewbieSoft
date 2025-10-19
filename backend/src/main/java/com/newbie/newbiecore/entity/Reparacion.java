package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "reparaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reparacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reparacion")
    private Long idReparacion;

    @ManyToOne
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    @ManyToOne
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;

    @Column(name = "fecha_inicio")
    private Instant fechaInicio;

    @Column(name = "fecha_fin")
    private Instant fechaFin;

    private String estado; // pendiente, en curso, finalizado
    private String diagnostico;
    private String observaciones;

    @Column(name = "costo_total")
    private Double costoTotal;

    // Campos de ficha técnica integrados
    @Column(name = "firma_aceptacion")
    private String firmaAceptacion; // base64 o URL

    @Column(name = "firma_conformidad")
    private String firmaConformidad;

    @Column(name = "xml_datos", columnDefinition = "text")
    private String xmlDatos;

    @Column(name = "fotos", columnDefinition = "text")
    private String fotos; // JSON o CSV de URLs/paths

    @Column(name = "fecha_ficha")
    private Instant fechaFicha;
}