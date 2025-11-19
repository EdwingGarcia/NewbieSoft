package com.newbie.newbiecore.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.FichaTecnica;
import com.newbie.newbiecore.entity.Imagen;
import com.newbie.newbiecore.entity.Usuario;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
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

    /* ===========================================================
       ======================= IDENTIDAD ==========================
       =========================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ORDEN Nro. 0001550
    @Column(name = "numero_orden", nullable = false, unique = true, length = 20)
    private String numeroOrden;

    /* ===========================================================
       ===================== RELACIONES ===========================
       =========================================================== */

    @OneToMany(mappedBy = "ordenTrabajo", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({ "ordenTrabajo" })
    @Builder.Default
    private List<Imagen> imagenes = new ArrayList<>();


    // TÉCNICO ASIGNADO
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_cedula", referencedColumnName = "cedula")
    private Usuario tecnicoAsignado;

    // CLIENTE
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_cedula", referencedColumnName = "cedula")
    private Usuario cliente;

    // EQUIPO
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Equipo equipo;

    /* ===========================================================
       ======================== CABECERA ==========================
       =========================================================== */

    // HORA DE INGRESO (creación de la OT)
    @CreationTimestamp
    @Column(name = "fecha_hora_ingreso", nullable = false, updatable = false)
    private Instant fechaHoraIngreso;

    // MEDIO DE CONTACTO (WhatsApp, llamada, presencial, correo, etc.)
    @Column(name = "medio_contacto", length = 50)
    private String medioContacto;

    // Tipo de servicio: DIAGNOSTICO, MANTENIMIENTO, REPARACION, FORMATEO, INSTALACION_SO, ETC.
    @Column(name = "tipo_servicio", length = 50)
    private String tipoServicio;

    // Prioridad: BAJA, MEDIA, ALTA, URGENTE
    @Column(name = "prioridad", length = 20)
    private String prioridad;

    /* ===========================================================
       =============== INFORMACIÓN DEL EQUIPO (CASO) ==============
       =========================================================== */

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

    /* ===========================================================
       ================== RECEPCIÓN DE EQUIPO =====================
       =========================================================== */

    // Momento en que se confirma la recepción (firma técnico + cliente)
    @Column(name = "fecha_hora_recepcion")
    private Instant fechaHoraRecepcion;

    @Column(name = "firma_tecnico_recepcion", nullable = false)
    private boolean firmaTecnicoRecepcion = false;

    @Column(name = "firma_cliente_recepcion", nullable = false)
    private boolean firmaClienteRecepcion = false;

    /* ===========================================================
       =================== TIEMPOS DE SERVICIO ====================
       =========================================================== */

    // DIAGNÓSTICO
    @Column(name = "fecha_hora_inicio_diagnostico")
    private Instant fechaHoraInicioDiagnostico;

    @Column(name = "fecha_hora_fin_diagnostico")
    private Instant fechaHoraFinDiagnostico;

    // REPARACIÓN
    @Column(name = "fecha_hora_inicio_reparacion")
    private Instant fechaHoraInicioReparacion;

    @Column(name = "fecha_hora_fin_reparacion")
    private Instant fechaHoraFinReparacion;

    /* ===========================================================
       ================== DETALLE DE TRABAJO ======================
       =========================================================== */

    // DIAGNÓSTICO / TRABAJO REALIZADO (resumen entendible para el cliente)
    @Column(name = "diagnostico_trabajo", length = 4000)
    private String diagnosticoTrabajo;

    // OBSERVACIONES / RECOMENDACIONES
    @Column(name = "observaciones_recomendaciones", length = 4000)
    private String observacionesRecomendaciones;

    // MODALIDAD (Taller, domicilio, remoto, etc.)
    @Column(name = "modalidad", length = 50)
    private String modalidad;

    /* ===========================================================
       ==================== BLOQUE ECONÓMICO ======================
       =========================================================== */

    // FACTURA (número de factura asociada)
    @Column(name = "numero_factura", length = 50)
    private String numeroFactura;

    // FORMA DE PAGO (efectivo, tarjeta, transferencia, etc.)
    @Column(name = "forma_pago", length = 50)
    private String formaPago;

    // COSTOS
    @Column(name = "costo_mano_obra")
    private BigDecimal costoManoObra;

    @Column(name = "costo_repuestos")
    private BigDecimal costoRepuestos;

    @Column(name = "costo_otros")
    private BigDecimal costoOtros;

    @Column(name = "descuento")
    private BigDecimal descuento;

    @Column(name = "subtotal")
    private BigDecimal subtotal;

    @Column(name = "iva")
    private BigDecimal iva;

    @Column(name = "total")
    private BigDecimal total;

    /* ===========================================================
       =================== ENTREGA DE EQUIPO ======================
       =========================================================== */

    // FECHA Y HORA DE ENTREGA
    @Column(name = "fecha_hora_entrega")
    private Instant fechaHoraEntrega;

    // Firma final
    @Column(name = "firma_tecnico_entrega", nullable = false)
    private boolean firmaTecnicoEntrega = false;

    @Column(name = "firma_cliente_entrega", nullable = false)
    private boolean firmaClienteEntrega = false;

    // El cliente marca que RECIBE EL EQUIPO A SATISFACCIÓN
    @Column(name = "recibe_a_satisfaccion", nullable = false)
    private boolean recibeASatisfaccion = false;

    /* ===========================================================
       ===================== OTP / AUTORIZACIÓN ==================
       =========================================================== */

    // Último OTP asociado a la orden (si decides guardar el código aquí)
    @Column(name = "otp_codigo", length = 10)
    private String otpCodigo;

    // Indica si el OTP fue validado
    @Column(name = "otp_validado")
    private Boolean otpValidado;

    // Momento en que se validó el OTP
    @Column(name = "otp_fecha_validacion")
    private Instant otpFechaValidacion;

    /* ===========================================================
       ====================== GARANTÍA / CIERRE ==================
       =========================================================== */

    // Indica si la reparación actual se hace en garantía
    @Column(name = "es_en_garantia")
    private Boolean esEnGarantia;

    // Referencia a una OT anterior (por garantía)
    @Column(name = "referencia_orden_garantia")
    private Long referenciaOrdenGarantia;

    // Usuario que cierra la orden (cedula / username)
    @Column(name = "cerrada_por", length = 20)
    private String cerradaPor;

    // Motivo de cierre (NO REPARADO, REPUESTO NO DISPONIBLE, ABANDONO, etc.)
    @Column(name = "motivo_cierre", length = 500)
    private String motivoCierre;

    /* ===========================================================
       ========================== ESTADO ==========================
       =========================================================== */

    // Estado general de la orden (PENDIENTE, EN_DIAGNOSTICO, EN_REPARACION, LISTO, CERRADO, etc.)
    @Column(name = "estado", length = 30)
    private String estado;

    // El cliente aceptó las condiciones del servicio
    @Column(name = "condiciones_aceptadas", nullable = false)
    private boolean condicionesAceptadas = false;
}
