package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;
import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaMapper;
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

    /**
     * 🆕 Crear nueva ficha técnica AUTORRELLENADA
     *
     * Se espera (por query o form-data):
     *  - cedulaTecnico
     *  - equipoId
     *  - ordenTrabajoId
     *  - observaciones (opcional)
     */
    @PostMapping
    public ResponseEntity<?> crearFichaTecnica(
            @RequestParam String cedulaTecnico,
            @RequestParam Long equipoId,
            @RequestParam Long ordenTrabajoId,
            @RequestParam(required = false) String observaciones
    ) {
        try {
            var ficha = fichaTecnicaService.crearONegociar(
                    cedulaTecnico,
                    equipoId,
                    ordenTrabajoId,
                    observaciones
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(FichaTecnicaMapper.toDTO(ficha));

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }






    /** 📋 Listar todas las fichas técnicas (DTO) */
    @GetMapping
    public ResponseEntity<List<FichaTecnicaDTO>> listarTodas() {
        return ResponseEntity.ok(fichaTecnicaService.listarDTO());
    }


    /** 📝 Actualizar observaciones
     *
     * OJO: Aquí estás recibiendo el body como String plano.
     * Ejemplo body: "Equipo con golpes en la carcasa"
     * Si prefieres JSON tipo { "observaciones": "..." } lo cambiamos.
     */
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
