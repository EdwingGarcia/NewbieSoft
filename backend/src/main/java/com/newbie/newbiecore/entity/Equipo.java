package com.newbie.newbiecore.entity;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Usuario usuario; // cliente

    @Column(name="numero_serie")
    private String numeroSerie;

    private String modelo;
    private String marca;

    @Column(name = "tipo_equipo")
    private String tipo; // Desktop / Laptop / All-in-One, etc.

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
