package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "citas") // Asegúrate de que tu tabla en Postgres se llame "citas"
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- RELACIÓN CORREGIDA ---
    @ManyToOne(fetch = FetchType.EAGER)
    // 'name': Es el nombre de la columna en la tabla 'citas' (Tu DB pedía "cedula" en el primer error)
    // 'referencedColumnName': Es el nombre de la llave primaria en la entidad Usuario (que es "cedula")
    @JoinColumn(name = "cedula", referencedColumnName = "cedula", nullable = false)
    @JsonIgnoreProperties({"password", "roles", "hibernateLazyInitializer", "handler"})
    private Usuario usuario;
    // ---------------------------

    @Column(name = "fecha_programada", nullable = false)
    private LocalDateTime fechaProgramada;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private String motivo;

    @Column(nullable = false)
    private String estado;

    @PrePersist
    public void prePersist() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = "PENDIENTE";
        }
    }
}