package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "equipos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Equipo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id_equipo")
    private Long idEquipo;

    @ManyToOne
    @JoinColumn(name = "cedula", nullable = false)
    private Usuario usuario;


    @Column(name="numero_serie")
    private String numeroSerie;

    private String modelo;
    private String marca;

    @Column(name="fecha_registro")
    private Instant fechaRegistro;
    @Column(name="hostname")
    private String hostname;

    @Column(name="sistema_operativo")
    private String sistemaOperativo;

    @JdbcTypeCode(SqlTypes.JSON)                // 👈 clave para JSON/JSONB
    @Column(name = "hardware_json", columnDefinition = "jsonb")
    private JsonNode hardwareJson;
}
