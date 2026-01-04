package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.Cita.CitaRequest;
import com.newbie.newbiecore.entity.Cita;
import com.newbie.newbiecore.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "http://localhost:3000")
public class CitaController {

    @Autowired
    private CitaService citaService;

    @PostMapping("/agendar")
    public ResponseEntity<Cita> agendarCita(@RequestBody CitaRequest request) {
        Cita cita = citaService.agendarCita(request);
        return ResponseEntity.ok(cita);
    }

    // CORREGIDO: @PathVariable String id
    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<Cita>> misCitas(@PathVariable String id) {
        return ResponseEntity.ok(citaService.obtenerCitasPorUsuario(id));
    }

    @GetMapping("/todas")
    public ResponseEntity<List<Cita>> todasLasCitas() {
        return ResponseEntity.ok(citaService.obtenerTodasLasCitas());
    }
}