package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "notificacion_ot")
public class NotificacionOt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ot_id", nullable = false)
    private Long otId;

    @Column(name = "tecnico_nombre", nullable = false, length = 150)
    private String tecnicoNombre;

    @Column(name = "nombre_equipo", nullable = false, length = 200)
    private String nombreEquipo;

    @Column(name = "correo_destino", nullable = false, length = 200)
    private String correoDestino;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @CreationTimestamp
    @Column(name = "fecha_envio", nullable = false, updatable = false)
    private Instant fechaEnvio;

    public NotificacionOt() {}

    public NotificacionOt(Long otId, String tecnicoNombre, String nombreEquipo,
                          String correoDestino, String mensaje) {
        this.otId = otId;
        this.tecnicoNombre = tecnicoNombre;
        this.nombreEquipo = nombreEquipo;
        this.correoDestino = correoDestino;
        this.mensaje = mensaje;
    }

    public Long getId() { return id; }
    public Long getOtId() { return otId; }
    public String getTecnicoNombre() { return tecnicoNombre; }
    public String getNombreEquipo() { return nombreEquipo; }
    public String getCorreoDestino() { return correoDestino; }
    public String getMensaje() { return mensaje; }
    public Instant getFechaEnvio() { return fechaEnvio; }
}
