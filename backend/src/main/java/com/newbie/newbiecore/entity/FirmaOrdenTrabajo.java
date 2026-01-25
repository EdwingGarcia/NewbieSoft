package com.newbie.newbiecore.entity;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidad para registrar las firmas de órdenes de trabajo.
 * Soporta firmas de clientes registrados y terceros no registrados.
 */
@Entity
@Table(name = "firmas_orden_trabajo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FirmaOrdenTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con la orden de trabajo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_trabajo_id")
    private OrdenTrabajo ordenTrabajo;

    // Número de orden para referencia rápida
    @Column(name = "numero_orden", length = 50)
    private String numeroOrden;

    // Tipo de firma: CONFORMIDAD o RECIBO
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_firma", nullable = false, length = 20)
    private TipoFirmaOT tipoFirma;

    // Tipo de firmante: CLIENTE o TERCERO
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_firmante", nullable = false, length = 20)
    private TipoFirmante tipoFirmante;

    // Si es cliente registrado, referencia al usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Usuario cliente;

    // Datos del firmante (para cliente se copia, para tercero es obligatorio)
    @Column(name = "firmante_nombre", length = 150)
    private String firmanteNombre;

    @Column(name = "firmante_cedula", length = 20)
    private String firmanteCedula;

    @Column(name = "firmante_relacion", length = 100)
    private String firmanteRelacion;

    // NOTA: La firma digital se almacena únicamente dentro del PDF generado
    // No se guarda la firma suelta por razones legales y de seguridad
    // Este campo se mantiene temporalmente por compatibilidad con BD existente
    // EJECUTAR: ALTER TABLE firmas_orden_trabajo ALTER COLUMN firma_base64 DROP NOT
    // NULL;
    @Lob
    @Column(name = "firma_base64", columnDefinition = "TEXT")
    private String firmaBase64 = ""; // Valor vacío por compatibilidad

    // Ruta del PDF generado
    @Column(name = "pdf_path", length = 500)
    private String pdfPath;

    // Información del equipo y procedimiento (para el registro)
    @Column(name = "equipo_info", length = 255)
    private String equipoInfo;

    @Lob
    @Column(name = "procedimiento", columnDefinition = "TEXT")
    private String procedimiento;

    @CreationTimestamp
    @Column(name = "fecha_firma", nullable = false, updatable = false)
    private Instant fechaFirma;

    // IP o dispositivo desde donde se firmó (opcional)
    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
