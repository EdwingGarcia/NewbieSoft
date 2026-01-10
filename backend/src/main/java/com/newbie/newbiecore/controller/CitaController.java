package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.Cita.CitaRequest;
import com.newbie.newbiecore.entity.Cita;
import com.newbie.newbiecore.service.CitaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;

    /**
     * ✅ Nuevo: agenda con clienteId y tecnicoAsignadoId (opcional)
     * POST /api/citas/agendar
     */
    @PostMapping("/agendar")
    public ResponseEntity<Cita> agendarCita(@RequestBody CitaRequest request) {
        Cita cita = citaService.agendarCita(request);
        return ResponseEntity.ok(cita);
    }

    /**
     * ✅ Nuevo: citas por CLIENTE (antes /usuario/{id})
     * GET /api/citas/cliente/{clienteId}
     */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Cita>> citasPorCliente(@PathVariable String clienteId) {
        return ResponseEntity.ok(citaService.obtenerCitasPorCliente(clienteId));
    }

    /**
     * ✅ Nuevo: citas por TÉCNICO
     * GET /api/citas/tecnico/{tecnicoId}
     */
    @GetMapping("/tecnico/{tecnicoId}")
    public ResponseEntity<List<Cita>> citasPorTecnico(@PathVariable String tecnicoId) {
        return ResponseEntity.ok(citaService.obtenerCitasPorTecnico(tecnicoId));
    }

    /**
     * ✅ Igual: admin lista todas
     * GET /api/citas/todas
     */
    @GetMapping("/todas")
    public ResponseEntity<List<Cita>> todasLasCitas() {
        return ResponseEntity.ok(citaService.obtenerTodasLasCitas());
    }
    @PostMapping("/{citaId}/completar")
    public ResponseEntity<Void> completarCita(@PathVariable Long citaId) {
        boolean updated = citaService.marcarComoCompletada(citaId);

        // Solo quieres 200 cuando SÍ se modificó a COMPLETADA
        return updated
                ? ResponseEntity.ok().build()
                : ResponseEntity.badRequest().build();
    }

}
