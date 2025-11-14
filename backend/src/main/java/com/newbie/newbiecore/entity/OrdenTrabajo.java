package com.newbie.newbiecore.entity;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ordenes_trabajo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ORDEN Nro. 0001550
    @Column(name = "numero_orden", nullable = false, unique = true, length = 20)
    private String numeroOrden;

    /* ==============================
       CABECERA
       ============================== */

    // HORA DE INGRESO
    @CreationTimestamp
    @Column(name = "fecha_hora_ingreso", nullable = false, updatable = false)
    private Instant fechaHoraIngreso;

    // MEDIO DE CONTACTO (WhatsApp, llamada, presencial, correo, etc.)
    @Column(name = "medio_contacto", length = 50)
    private String medioContacto;

    // TÉCNICO ASIGNADO
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_cedula", referencedColumnName = "cedula")
    private Usuario tecnicoAsignado;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_cedula", referencedColumnName = "cedula")
    private Usuario cliente;


    // EQUIPO
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Equipo equipo;

    /* ==============================
       INFORMACIÓN DEL EQUIPO
       ============================== */

    // CONTRASEÑA (login SO / BIOS / etc.)
    @Column(name = "contrasena_equipo", length = 255)
    private String contrasenaEquipo;

    // ACCESORIOS entregados (cargador, mouse, base, etc.)
    @Column(name = "accesorios", length = 1000)
    private String accesorios;

    // PROBLEMA / FALLA REPORTADA
    @Column(name = "problema_reportado", length = 2000)
    private String problemaReportado;

    // OBSERVACIONES (daños o novedades del equipo) AL INGRESO
    @Column(name = "observaciones_ingreso", length = 2000)
    private String observacionesIngreso;

    /* ==============================
       RECEPCIÓN DE EQUIPO
       ============================== */

    // Momento en que se confirma la recepción (firma técnico + cliente)
    @Column(name = "fecha_hora_recepcion")
    private Instant fechaHoraRecepcion;

    @Column(name = "firma_tecnico_recepcion", nullable = false)
    private boolean firmaTecnicoRecepcion = false;

    @Column(name = "firma_cliente_recepcion", nullable = false)
    private boolean firmaClienteRecepcion = false;

    /* ==============================
       ENTREGA DE EQUIPO
       ============================== */

    // DIAGNÓSTICO / TRABAJO REALIZADO
    @Column(name = "diagnostico_trabajo", length = 4000)
    private String diagnosticoTrabajo;

    // OBSERVACIONES / RECOMENDACIONES
    @Column(name = "observaciones_recomendaciones", length = 4000)
    private String observacionesRecomendaciones;

    // MODALIDAD (Taller, domicilio, remoto, etc.)
    @Column(name = "modalidad", length = 50)
    private String modalidad;

    // FECHA Y HORA DE ENTREGA
    @Column(name = "fecha_hora_entrega")
    private Instant fechaHoraEntrega;

    // FACTURA (número de factura asociada)
    @Column(name = "numero_factura", length = 50)
    private String numeroFactura;

    // FORMA DE PAGO (efectivo, tarjeta, transferencia, etc.)
    @Column(name = "forma_pago", length = 50)
    private String formaPago;

    // Firma final
    @Column(name = "firma_tecnico_entrega", nullable = false)
    private boolean firmaTecnicoEntrega = false;

    @Column(name = "firma_cliente_entrega", nullable = false)
    private boolean firmaClienteEntrega = false;

    // El cliente marca que RECIBE EL EQUIPO A SATISFACCIÓN
    @Column(name = "recibe_a_satisfaccion", nullable = false)
    private boolean recibeASatisfaccion = false;

    /* ==============================
       OTROS
       ============================== */

    // Estado general de la orden (PENDIENTE, EN_DIAGNOSTICO, EN_REPARACION, LISTO, CERRADO, etc.)
    @Column(name = "estado", length = 30)
    private String estado;

    // El cliente aceptó las condiciones del servicio
    @Column(name = "condiciones_aceptadas", nullable = false)
    private boolean condicionesAceptadas = false;
}
