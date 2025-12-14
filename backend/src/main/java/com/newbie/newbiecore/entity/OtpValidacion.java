package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "otp_validaciones")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpValidacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idOtp;

    @ManyToOne
    @JoinColumn(name = "usuario_cedula", nullable = false)
    private Usuario usuario;

    private String codigo;
    private Instant fechaEnvio;
    private Instant fechaExpiracion;

    private Instant fechaValidacion;
    private Boolean valido;

    private Integer intentos;
    private Integer maxIntentos;

    @Column(length = 80)
    private String tokenConsulta;
    private Instant tokenExpira;

    @Column(length = 30)
    private String tipo; // "CONSULTA_CLIENTE"
}
