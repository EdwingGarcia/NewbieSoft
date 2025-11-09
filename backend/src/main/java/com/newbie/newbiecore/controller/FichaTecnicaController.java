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

    @PostMapping
    public ResponseEntity<FichaTecnica> crearFichaTecnica(
            @RequestParam String cedulaTecnico,
            @RequestParam Long equipoId,
            @RequestParam(required = false) String observaciones) {

        FichaTecnica ficha = fichaTecnicaService.crearNueva(cedulaTecnico, equipoId, observaciones);
        return ResponseEntity.ok(ficha);
    }


    @PostMapping("/{id}/uploadImg")
    public ResponseEntity<?> subirImagenes(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            FichaTecnica ficha = fichaTecnicaService.subirImagenesLocal(id, files);
            return ResponseEntity.ok(ficha);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al guardar las imágenes: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<FichaTecnicaDTO>> listarTodas() {
        return ResponseEntity.ok(fichaTecnicaService.listarDTO());
    }

    @GetMapping("/equipo/{equipoId}")
    public ResponseEntity<List<FichaTecnica>> listarPorEquipo(@PathVariable Long equipoId) {
        return ResponseEntity.ok(fichaTecnicaService.listarPorEquipo(equipoId));
    }

    @GetMapping("/tecnico/{cedulaTecnico}")
    public ResponseEntity<List<FichaTecnica>> listarPorTecnico(@PathVariable String cedulaTecnico) {
        return ResponseEntity.ok(fichaTecnicaService.listarPorTecnico(cedulaTecnico));
    }

    @PutMapping("/{id}/observaciones")
    public ResponseEntity<FichaTecnica> actualizarObservaciones(
            @PathVariable Long id,
            @RequestBody String observaciones) {
        return fichaTecnicaService.actualizarObservaciones(id, observaciones)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FichaTecnicaDTO> obtenerPorId(@PathVariable Long id) {
        return fichaTecnicaService.obtenerDTO(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }



}
