package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "otp_validaciones")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpValidacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_otp")
    private Long idOtp;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    private String codigo;
    private Instant fechaEnvio = Instant.now();
    private Instant fechaValidacion;
    private Boolean valido = false;
}
