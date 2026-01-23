package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.costos.*;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.entity.OrdenTrabajoCosto;
import com.newbie.newbiecore.repository.CatalogoItemRepository;
import com.newbie.newbiecore.repository.OrdenTrabajoCostoRepository;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoCostoService {

    private static final BigDecimal IVA_RATE = new BigDecimal("0.15");

    private final OrdenTrabajoRepository ordenRepo;
    private final CatalogoItemRepository catalogoRepo;
    private final OrdenTrabajoCostoRepository costoRepo;

    /* ==========================
       AGREGAR COSTO
       ========================== */
    @Transactional
    public void agregar(Long ordenId, AgregarCostoRequest req) {

        if (req.cantidad() == null || req.cantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        OrdenTrabajo orden = ordenRepo.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));

        validarOrdenEditable(orden);

        var item = catalogoRepo.findById(req.catalogoItemId())
                .orElseThrow(() -> new RuntimeException("Ítem de catálogo no encontrado"));

        if (!item.isActivo()) {
            throw new IllegalStateException("El ítem del catálogo no está activo");
        }

        OrdenTrabajoCosto costo = OrdenTrabajoCosto.builder()
                .ordenTrabajo(orden)
                .tipo(item.getTipo())
                .descripcion(item.getDescripcion())
                .costoUnitario(item.getCosto())
                .cantidad(req.cantidad())
                .build();

        costoRepo.save(costo);
    }

    /* ==========================
       LISTAR COSTOS
       ========================== */
    @Transactional(readOnly = true)
    public List<OrdenTrabajoCostoDto> listar(Long ordenId) {

        return costoRepo.findByOrdenTrabajo_Id(ordenId)
                .stream()
                .map(c -> new OrdenTrabajoCostoDto(
                        c.getId(),
                        c.getTipo(),
                        c.getDescripcion(),
                        c.getCostoUnitario(),
                        c.getCantidad(),
                        c.getSubtotal()
                ))
                .toList();
    }

    /* ==========================
       ACTUALIZAR CANTIDAD
       ========================== */
    @Transactional
    public void actualizarCantidad(Long costoId, Integer cantidad) {

        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("Cantidad inválida");
        }

        OrdenTrabajoCosto costo = costoRepo.findById(costoId)
                .orElseThrow(() -> new RuntimeException("Costo no encontrado"));

        validarOrdenEditable(costo.getOrdenTrabajo());

        costo.setCantidad(cantidad);
        costoRepo.save(costo);
    }

    /* ==========================
       ELIMINAR COSTO
       ========================== */
    @Transactional
    public void eliminar(Long costoId) {

        OrdenTrabajoCosto costo = costoRepo.findById(costoId)
                .orElseThrow(() -> new RuntimeException("Costo no encontrado"));

        validarOrdenEditable(costo.getOrdenTrabajo());

        costoRepo.delete(costo);
    }

    /* ==========================
       TOTALES CONSOLIDADOS
       ========================== */
    @Transactional(readOnly = true)
    public CostosTotalesDto totales(Long ordenId) {

        List<OrdenTrabajoCosto> costos =
                costoRepo.findByOrdenTrabajo_Id(ordenId);

        BigDecimal subtotal = costos.stream()
                .map(OrdenTrabajoCosto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal descuento = BigDecimal.ZERO;
        BigDecimal iva = subtotal.multiply(IVA_RATE);
        BigDecimal total = subtotal.add(iva).subtract(descuento);

        return new CostosTotalesDto(
                subtotal,
                descuento,
                iva,
                total
        );
    }

    /* ==========================
       VALIDACIONES
       ========================== */
    private void validarOrdenEditable(OrdenTrabajo orden) {
        if ("CERRADA".equalsIgnoreCase(orden.getEstado())) {
            throw new IllegalStateException("No se pueden modificar costos en una orden cerrada");
        }
    }
}
