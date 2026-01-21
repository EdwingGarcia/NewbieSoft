package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.costos.*;
import com.newbie.newbiecore.service.OrdenTrabajoCostoService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes/{ordenId}/costos")
@RequiredArgsConstructor
public class OrdenTrabajoCostoController {

    private final OrdenTrabajoCostoService service;

    // ➕ Agregar costo
    @PostMapping
    public ResponseEntity<Void> agregar(
            @PathVariable Long ordenId,
            @RequestBody AgregarCostoRequest req
    ) {
        service.agregar(ordenId, req);
        return ResponseEntity.ok().build();
    }


    // 📄 Listar costos de la orden
    @GetMapping
    public List<OrdenTrabajoCostoDto> listar(@PathVariable Long ordenId) {
        return service.listar(ordenId);
    }

    // 📊 Totales
    @GetMapping("/totales")
    public CostosTotalesDto totales(@PathVariable Long ordenId) {
        return service.totales(ordenId);
    }

    // ✏️ ACTUALIZAR CANTIDAD (🆕)
    @PutMapping("/{costoId}/cantidad")
    public void actualizarCantidad(
            @PathVariable Long costoId,
            @RequestBody ActualizarCantidadRequest req
    ) {
        service.actualizarCantidad(costoId, req.cantidad());
    }

    // 🗑️ Eliminar costo
    @DeleteMapping("/{costoId}")
    public void eliminar(@PathVariable Long costoId) {
        service.eliminar(costoId);
    }
}
