package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Cliente (en tu front se llama "usuario")
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "cedula", referencedColumnName = "cedula", nullable = false)
    @JsonIgnoreProperties({"password", "roles", "hibernateLazyInitializer", "handler"})
    @ToString.Exclude
    private Usuario usuario;

    // ✅ Técnico asignado (opcional) -> en tu front se llama "tecnico"
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tecnico_cedula", referencedColumnName = "cedula")
    @JsonIgnoreProperties({"password", "roles", "hibernateLazyInitializer", "handler"})
    @ToString.Exclude
    private Usuario tecnico;

    @Column(name = "fecha_programada", nullable = false)
    private LocalDateTime fechaProgramada;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private String motivo;

    @Column(nullable = false)
    private String estado;

    @PrePersist
    public void prePersist() {
        if (this.fechaCreacion == null) this.fechaCreacion = LocalDateTime.now();
        if (this.estado == null) this.estado = "PENDIENTE";
    }
}
