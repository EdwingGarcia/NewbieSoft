package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;
import com.newbie.newbiecore.service.FichaTecnicaService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * Se espera (query/form-data):
     *  - cedulaTecnico  (String)
     *  - equipoId       (Long)
     *  - ordenTrabajoId (Long, opcional)
     *  - observaciones  (String, opcional)
     */
    @PostMapping
    public ResponseEntity<?> crearFichaTecnica(
            @RequestParam String cedulaTecnico,
            @RequestParam Long equipoId,
            @RequestParam(required = false) Long ordenTrabajoId,
            @RequestParam(required = false) String observaciones
    ) {
        try {
            FichaTecnicaDTO dto = fichaTecnicaService.crearONegociarDTO(
                    cedulaTecnico,
                    equipoId,
                    ordenTrabajoId,
                    observaciones
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalStateException e) {
            // Conflicto: ya existe ficha para esa OT, etc.
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            // Datos inválidos (técnico, equipo u OT no encontrados)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
    @GetMapping("/cliente/{cedula}")
    public ResponseEntity<List<FichaTecnicaDTO>> listarPorCliente(@PathVariable String cedula) {
        List<FichaTecnicaDTO> fichas = fichaTecnicaService.obtenerFichasPorCliente(cedula);

        if (fichas.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(fichas);
    }
    /** 📋 Listar todas las fichas técnicas (DTO) */
    @GetMapping
    public ResponseEntity<List<FichaTecnicaDTO>> listarTodas() {
        return ResponseEntity.ok(fichaTecnicaService.listarDTO());
    }

    /** 🔍 Obtener ficha técnica por id (DTO) */
    @GetMapping("/{id}")
    public ResponseEntity<FichaTecnicaDTO> obtenerPorId(@PathVariable Long id) {
        return fichaTecnicaService.obtenerDTO(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/equipo/{equipoId}")
    public ResponseEntity<List<FichaTecnicaDTO>> listarPorEquipo(@PathVariable Long equipoId) {
        return ResponseEntity.ok(fichaTecnicaService.listarPorEquipo(equipoId));
    }

    @GetMapping("/tecnico/{cedulaTecnico}")
    public ResponseEntity<List<FichaTecnicaDTO>> listarPorTecnico(@PathVariable String cedulaTecnico) {
        return ResponseEntity.ok(fichaTecnicaService.listarPorTecnico(cedulaTecnico));
    }



    /** 🔍 Buscar ficha por orden de trabajo (si existe) */
    @GetMapping("/orden-trabajo/{ordenTrabajoId}")
    public ResponseEntity<FichaTecnicaDTO> buscarPorOrdenTrabajo(@PathVariable Long ordenTrabajoId) {
        return fichaTecnicaService.buscarPorOrdenTrabajo(ordenTrabajoId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 📝 Actualizar SOLO observaciones.
     *
     * Body: texto plano con las observaciones
     * (si prefieres JSON tipo { "observaciones": "..." } se puede cambiar luego)
     */
    @PutMapping("/{id}/observaciones")
    public ResponseEntity<?> actualizarObservaciones(
            @PathVariable Long id,
            @RequestBody String observaciones
    ) {
        return fichaTecnicaService.actualizarObservaciones(id, observaciones)
                .map(dto -> ResponseEntity.ok().build())
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ✏️ Actualizar ficha completa con DTO.
     * No se modifican: id, equipoId, ordenTrabajoId, tecnicoId, fechaCreacion.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarFichaCompleta(
            @PathVariable Long id,
            @RequestBody FichaTecnicaDTO dto
    ) {
        try {
            return fichaTecnicaService.actualizarDesdeDTO(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * ♻️ Re-autocompletar la ficha desde el hardwareJson del equipo asociado.
     * Útil cuando se vuelve a hacer diagnóstico.
     */
    @PostMapping("/{id}/refrescar-hardware")
    public ResponseEntity<?> refrescarDesdeHardware(@PathVariable Long id) {
        try {
            return fichaTecnicaService.refrescarDesdeHardware(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /** 🗑️ Eliminar ficha técnica */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            fichaTecnicaService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
