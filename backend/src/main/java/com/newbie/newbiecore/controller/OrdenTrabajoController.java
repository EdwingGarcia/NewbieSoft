package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.OrdenTrabajo.*;
import com.newbie.newbiecore.service.OrdenTrabajoImagenService;
import com.newbie.newbiecore.service.OrdenTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenTrabajoService;
    private final OrdenTrabajoImagenService ordenTrabajoImagenService;

    /** Crear orden de trabajo (ingreso) */
    @PostMapping
    public ResponseEntity<OrdenTrabajoIngresoDto> crear(
            @RequestBody CrearOrdenTrabajoRequest request
    ) {
        var dto = ordenTrabajoService.crearOrden(request);
        // Puedes dejar 200 OK si ya lo consumes así en el frontend
        return ResponseEntity.ok(dto);
        // return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /** Obtener datos de ingreso de la orden */
    @GetMapping("/{id}/ingreso")
    public ResponseEntity<OrdenTrabajoIngresoDto> obtenerIngreso(@PathVariable Long id) {
        var dto = ordenTrabajoService.obtenerIngreso(id);
        return ResponseEntity.ok(dto);
    }

    /** Actualizar datos de entrega de la orden */
    @PutMapping("/{id}/entrega")
    public ResponseEntity<Void> actualizarEntrega(
            @PathVariable Long id,
            @RequestBody ActualizarEntregaRequest request
    ) {
        ordenTrabajoService.actualizarEntrega(id, request);
        return ResponseEntity.noContent().build();
    }

    /** Obtener detalle completo de la orden (ingreso + entrega + equipo + cliente, etc.) */
    @GetMapping("/{id}/detalle")
    public ResponseEntity<OrdenTrabajoDetalleDto> obtenerDetalle(@PathVariable Long id) {
        var dto = ordenTrabajoService.obtenerDetalle(id);
        return ResponseEntity.ok(dto);
    }

    /** Subir imágenes asociadas a la orden de trabajo (ingreso/diagnóstico/entrega) */
    @PostMapping("/{id}/imagenes")
    public ResponseEntity<Void> subirImagenes(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false, defaultValue = "INGRESO") String categoria,
            @RequestParam(required = false) String descripcion
    ) {
        try {
            ordenTrabajoImagenService.subirImagenes(id, files, categoria, descripcion);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    /** Listar todas las órdenes para el dashboard */
    @GetMapping
    public ResponseEntity<List<OrdenTrabajoListaDto>> listar() {
        var lista = ordenTrabajoService.listarOrdenes();
        return ResponseEntity.ok(lista);
    }
    /** Listar imágenes de la orden de trabajo */
    @GetMapping("/{id}/imagenes")
    public ResponseEntity<List<ImagenDto>> listarImagenes(@PathVariable Long id) {
        var imagenes = ordenTrabajoImagenService.listarImagenes(id);
        if (imagenes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(imagenes);
    }
}
