package com.newbie.newbiecore.entity;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Table(
        name = "firmas_digitales",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_firma_unica_por_reparacion_firmante_tipo",
                        columnNames = {"reparacion_id","firmante_id","tipo"}
                ),
                @UniqueConstraint(
                        name = "uk_firma_unica_por_ficha_firmante_tipo",
                        columnNames = {"ficha_tecnica_id","firmante_id","tipo"}
                )
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class FirmaDigital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // 2) o puede ser una ficha técnica
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_tecnica_id")
    private FichaTecnica fichaTecnica;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "firmante_id", nullable = false)
    private Usuario firmante;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoFirma tipo; // TECNICO / CLIENTE / ...

    @Lob
    @Column(name = "firma_base64", nullable = false, columnDefinition = "TEXT")
    private String firmaBase64;

    @CreationTimestamp
    @Column(name = "fecha_firma", nullable = false, updatable = false)
    private Instant fechaFirma;
}
