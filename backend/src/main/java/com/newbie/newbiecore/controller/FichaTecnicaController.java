package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.FichaTecnicaDTO;
import com.newbie.newbiecore.entity.FichaTecnica;
import com.newbie.newbiecore.service.FichaTecnicaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/fichas")
public class FichaTecnicaController {

    private final FichaTecnicaService fichaTecnicaService;

    public FichaTecnicaController(FichaTecnicaService fichaTecnicaService) {
        this.fichaTecnicaService = fichaTecnicaService;
    }

    /** 🆕 Crear nueva ficha técnica */
    @PostMapping
    public ResponseEntity<Void> crearFichaTecnica(
            @RequestParam String cedulaTecnico,
            @RequestParam Long equipoId,
            @RequestParam(required = false) String observaciones) {
        fichaTecnicaService.crearNueva(cedulaTecnico, equipoId, observaciones);
        return ResponseEntity.ok().build(); // ✅ Solo OK
    }

    /** 🖼️ Subir múltiples imágenes a una ficha técnica */
    @PostMapping("/{id}/uploadImg")
    public ResponseEntity<Void> subirImagenes(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            fichaTecnicaService.subirImagenesLocal(id, files);
            return ResponseEntity.ok().build(); // ✅ Solo OK
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** 📋 Listar todas las fichas técnicas */
    @GetMapping
    public ResponseEntity<List<FichaTecnicaDTO>> listarTodas() {
        return ResponseEntity.ok(fichaTecnicaService.listarDTO());
    }

    /** 🔍 Listar fichas técnicas por equipo */
    @GetMapping("/equipo/{equipoId}")
    public ResponseEntity<List<FichaTecnica>> listarPorEquipo(@PathVariable Long equipoId) {
        return ResponseEntity.ok(fichaTecnicaService.listarPorEquipo(equipoId));
    }

    /** 🔍 Listar fichas técnicas por técnico */
    @GetMapping("/tecnico/{cedulaTecnico}")
    public ResponseEntity<List<FichaTecnica>> listarPorTecnico(@PathVariable String cedulaTecnico) {
        return ResponseEntity.ok(fichaTecnicaService.listarPorTecnico(cedulaTecnico));
    }

    /** 📝 Actualizar observaciones */
    @PutMapping("/{id}/observaciones")
    public ResponseEntity<Void> actualizarObservaciones(
            @PathVariable Long id,
            @RequestBody String observaciones) {
        boolean updated = fichaTecnicaService.actualizarObservaciones(id, observaciones).isPresent();
        return updated ? ResponseEntity.ok().build() : ResponseEntity.notFound().build(); // ✅ Solo OK
    }

    /** 🔍 Obtener ficha técnica con DTO */
    @GetMapping("/{id}")
    public ResponseEntity<FichaTecnicaDTO> obtenerPorId(@PathVariable Long id) {
        return fichaTecnicaService.obtenerDTO(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
