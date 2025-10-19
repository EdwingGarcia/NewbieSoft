package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.dto.LoginResponse;
import com.newbie.newbiecore.dto.RegisterRequest;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.service.AuthService;
import com.newbie.newbiecore.service.EquipoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipo")
@Tag(name = "Equipo", description = "Endpoints MVC equipo")
public class EquipoController {
    private final EquipoService equipoService;

    @Autowired
    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody EquipoDto dto) {
        try {
            Equipo e= equipoService.registrarEquipo(dto);
            return ResponseEntity.ok(e);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // Endpoint para listar equipos por cédula de cliente
    @GetMapping("/cliente/{cedula}")
    public ResponseEntity<List<EquipoDto>> listarPorCliente(@PathVariable String cedula) {
        List<EquipoDto> equipos = equipoService.listarPorCliente(cedula);

        if (equipos.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204 si no hay equipos
        }

        return ResponseEntity.ok(equipos); // 200 con la lista
    }
    @GetMapping("/")
    public ResponseEntity<List<EquipoDto>> listarTodosEquipos() {
        List<EquipoDto> equipos = equipoService.listarTodosLosEquipos();
        if (equipos.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204 si no hay equipos
        }
        return ResponseEntity.ok(equipos); // 200 con la lista
    }


}
