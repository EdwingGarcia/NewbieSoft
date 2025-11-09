package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "equipos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id_equipo")
    private Long idEquipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cedula", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hardware_json", columnDefinition = "jsonb")
    private JsonNode hardwareJson;
}
