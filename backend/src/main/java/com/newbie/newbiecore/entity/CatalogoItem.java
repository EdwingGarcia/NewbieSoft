package com.newbie.newbiecore.entity;

import java.math.BigDecimal;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "catalogo_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Solo PRODUCTO o SERVICIO
    @Column(nullable = false, length = 20)
    private String tipo;

    // Nombre/Descripción (un solo campo, como dijiste)
    @Column(nullable = false, length = 255)
    private String descripcion;

    // Precio unitario
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costo;

    // Eliminación lógica
    @Column(nullable = false)
    private boolean activo = true;
}
