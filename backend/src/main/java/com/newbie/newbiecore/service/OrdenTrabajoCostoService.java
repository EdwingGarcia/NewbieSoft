package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.costos.*;
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

    private final OrdenTrabajoRepository ordenRepo;
    private final CatalogoItemRepository catalogoRepo;
    private final OrdenTrabajoCostoRepository costoRepo;

    @Transactional
    public void agregar(Long ordenId, AgregarCostoRequest req) {

        if (req.cantidad() == null || req.cantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        var orden = ordenRepo.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));

        var item = catalogoRepo.findById(req.catalogoItemId())
                .orElseThrow(() -> new RuntimeException("Ítem de catálogo no encontrado"));

        if (!item.isActivo()) {
            throw new IllegalStateException("El ítem del catálogo no está activo");
        }

        var costo = OrdenTrabajoCosto.builder()
                .ordenTrabajo(orden)
                .tipo(item.getTipo())
                .descripcion(item.getDescripcion())
                .costoUnitario(item.getCosto())
                .cantidad(req.cantidad())
                .build();

        costoRepo.save(costo);
    }


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
                        c.getCostoUnitario().multiply(BigDecimal.valueOf(c.getCantidad()))
                ))
                .toList();
    }

    @Transactional
    public void eliminar(Long costoId) {
        costoRepo.deleteById(costoId);
    }

    @Transactional(readOnly = true)
    public CostosTotalesDto totales(Long ordenId) {
        var costos = costoRepo.findByOrdenTrabajo_Id(ordenId);

        BigDecimal subtotal = costos.stream()
                .map(c -> c.getCostoUnitario().multiply(BigDecimal.valueOf(c.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal iva = subtotal.multiply(BigDecimal.valueOf(0.15));
        BigDecimal total = subtotal.add(iva);

        return new CostosTotalesDto(subtotal, iva, total);
    }

    @Transactional
    public void actualizarCantidad(Long costoId, Integer cantidad) {

        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        var costo = costoRepo.findById(costoId)
                .orElseThrow(() -> new RuntimeException("Costo no encontrado"));

        costo.setCantidad(cantidad);

        costoRepo.save(costo);
    }

    

}
