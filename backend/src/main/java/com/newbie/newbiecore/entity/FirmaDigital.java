package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"reparacion", "firmante"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(
        name = "firmas_digitales",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_firma_unica_por_reparacion_firmante_tipo",
                columnNames = {"reparacion_id","firmante_id","tipo"}
        )
)
public class FirmaDigital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reparacion_id", nullable = false)
    private Reparacion reparacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "firmante_id", nullable = false)
    private Usuario firmante;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoFirma tipo; // ACEPTACION / CONFORMIDAD / TECNICO

    @Lob
    @Column(name = "firma_base64", nullable = false, columnDefinition = "text")
    private String firmaBase64; // data:image/png;base64,...

    @Column(name = "hash_documento", length = 128, nullable = false)
    private String hashDocumento; // p.ej. SHA-256 (hex)

    @CreationTimestamp
    @Column(name = "fecha_firma", nullable = false, updatable = false)
    private Instant fechaFirma;
}
