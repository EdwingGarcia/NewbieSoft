package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.entity.Reparacion;
import com.newbie.newbiecore.service.ReparacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/repairs")
@Tag(name = "Reparaciones", description = "Gestión de reparaciones técnicas")
public class ReparacionController {

    private final ReparacionService reparacionService;

    public ReparacionController(ReparacionService reparacionService) {
        this.reparacionService = reparacionService;
    }

    @Operation(summary = "Listar reparaciones asignadas al técnico logueado")
    @GetMapping
    public ResponseEntity<List<Reparacion>> listar(Principal principal) {
        return ResponseEntity.ok(reparacionService.listarPorTecnico(principal.getName()));
    }

    @Operation(summary = "Ver detalle de reparación")
    @GetMapping("/{id}")
    public ResponseEntity<Reparacion> detalle(@PathVariable Long id) {
        return reparacionService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Registrar diagnóstico inicial")
    @PostMapping("/{id}/diagnosis")
    public ResponseEntity<Reparacion> diagnostico(@PathVariable Long id, @RequestBody String diagnostico) {
        return reparacionService.registrarDiagnostico(id, diagnostico)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Subir archivo XML con datos técnicos")
    @PostMapping("/{id}/upload-xml")
    public ResponseEntity<Reparacion> subirXml(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        return reparacionService.subirXml(id, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Subir fotos/evidencias")
    @PostMapping("/{id}/upload-evidence")
    public ResponseEntity<Reparacion> subirEvidencia(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        return reparacionService.subirEvidencia(id, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Actualizar datos técnicos")
    @PutMapping("/{id}/update")
    public ResponseEntity<Reparacion> actualizar(@PathVariable Long id, @RequestBody Reparacion datos) {
        return reparacionService.actualizar(id, datos)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Cerrar reparación con informe final")
    @PostMapping("/{id}/close")
    public ResponseEntity<Reparacion> cerrar(@PathVariable Long id, @RequestBody String informeFinal) {
        return reparacionService.cerrar(id, informeFinal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Consultar historial por equipo (ID)")
    @GetMapping("/history/{equipoId}")
    public ResponseEntity<List<Reparacion>> historialPorEquipo(@PathVariable Long equipoId) {
        return ResponseEntity.ok(reparacionService.historialPorEquipo(equipoId));
    }
}