package com.newbie.newbiecore.entity;

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

    /** Técnico responsable de la ficha */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tecnico_id", nullable = false)
    private Usuario tecnico;

    /** Equipo al que pertenece esta ficha técnica */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    /** ID del archivo en Google Drive */
    @Column(name = "imagen_drive_file_id", length = 128)
    private String imagenDriveFileId;

    /** URL directa pública de la imagen (uc?id=...) */
    @Column(name = "imagen_url", length = 512)
    private String imagenUrl;

    /** Enlace de vista en Drive (webViewLink) */
    @Column(name = "imagen_webview_link", length = 512)
    private String imagenWebViewLink;

    /** Observaciones del técnico */
    @Column(columnDefinition = "TEXT")
    private String observaciones;

    /** Fecha de creación */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant fechaCreacion;
}
