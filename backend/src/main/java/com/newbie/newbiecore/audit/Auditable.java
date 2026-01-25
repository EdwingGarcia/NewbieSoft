package com.newbie.newbiecore.audit;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Clase base para entidades que requieren campos de auditoría automáticos.
 * Las entidades que extiendan esta clase tendrán automáticamente:
 * - Fecha de creación
 * - Usuario que creó
 * - Fecha de última modificación
 * - Usuario que modificó
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class Auditable {

    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private Instant fechaCreacion;

    @CreatedBy
    @Column(name = "creado_por", length = 100, updatable = false)
    private String creadoPor;

    @LastModifiedDate
    @Column(name = "fecha_modificacion")
    private Instant fechaModificacion;

    @LastModifiedBy
    @Column(name = "modificado_por", length = 100)
    private String modificadoPor;
}
