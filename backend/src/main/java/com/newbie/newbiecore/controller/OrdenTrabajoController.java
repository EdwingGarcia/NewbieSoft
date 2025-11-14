package com.newbie.newbiecore.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.newbie.newbiecore.dto.OrdenTrabajo.ActualizarEntregaRequest;
import com.newbie.newbiecore.dto.OrdenTrabajo.CrearOrdenTrabajoRequest;
import com.newbie.newbiecore.dto.OrdenTrabajo.OrdenTrabajoDetalleDto;
import com.newbie.newbiecore.dto.OrdenTrabajo.OrdenTrabajoIngresoDto;
import com.newbie.newbiecore.service.OrdenTrabajoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenTrabajoService;

    @PostMapping
    public ResponseEntity<OrdenTrabajoIngresoDto> crear(@RequestBody CrearOrdenTrabajoRequest request) {
        var dto = ordenTrabajoService.crearOrden(request);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/ingreso")
    public ResponseEntity<OrdenTrabajoIngresoDto> obtenerIngreso(@PathVariable Long id) {
        var dto = ordenTrabajoService.obtenerIngreso(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/entrega")
    public ResponseEntity<Void> actualizarEntrega(
            @PathVariable Long id,
            @RequestBody ActualizarEntregaRequest request
    ) {
        ordenTrabajoService.actualizarEntrega(id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/detalle")
    public ResponseEntity<OrdenTrabajoDetalleDto> obtenerDetalle(@PathVariable Long id) {
        var dto = ordenTrabajoService.obtenerDetalle(id);
        return ResponseEntity.ok(dto);
    }
}
