package com.newbie.newbiecore.entity;

import java.math.BigDecimal;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "orden_trabajo_costos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajoCosto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A qué OT pertenece esta línea
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_trabajo_id", nullable = false)
    private OrdenTrabajo ordenTrabajo;

    // Copia del catálogo al momento de agregar (histórico)
    @Column(nullable = false, length = 20)
    private String tipo; // PRODUCTO | SERVICIO

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(name = "costo_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitario;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
private BigDecimal subtotal;

@PrePersist
@PreUpdate
private void calcularSubtotal() {
    if (costoUnitario != null && cantidad != null) {
        this.subtotal = costoUnitario.multiply(BigDecimal.valueOf(cantidad));
    }
}

}
