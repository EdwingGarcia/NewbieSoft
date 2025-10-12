package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name="fichas_tecnicas")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FichaTecnica {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id_ficha")
    private Long idFicha;

    @OneToOne
    @JoinColumn(name="reparacion_id")
    private Reparacion reparacion;

    @Column(name="firma_aceptacion")
    private String firmaAceptacion; // base64 o URL

    @Column(name="firma_conformidad")
    private String firmaConformidad;

    @Column(name="xml_datos", columnDefinition="text")
    private String xmlDatos;

    @Column(name="fotos", columnDefinition="text")
    private String fotos; // JSON o CSV de URLs/paths

    @Column(name="fecha")
    private Instant fecha;
}
