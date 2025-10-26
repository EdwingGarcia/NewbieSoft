package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.service.EquipoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/equipo") // <- prefijo singular, como en tus logs
@Tag(name = "Equipo", description = "Endpoints MVC equipo")
public class EquipoController {

    private final EquipoService equipoService;

    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }

    // Crear/registrar un equipo
    @PostMapping
    public ResponseEntity<Equipo> register(@RequestBody EquipoDto dto) {
        Equipo e = equipoService.registrarEquipo(dto);
        return ResponseEntity.ok(e);
    }

    // Listar equipos por cédula de cliente
    @GetMapping("/cliente/{cedula}")
    public ResponseEntity<List<EquipoDto>> listarPorCliente(@PathVariable String cedula) {
        List<EquipoDto> equipos = equipoService.listarPorCliente(cedula);
        if (equipos.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(equipos);
    }

    // Listar todos los equipos
    @GetMapping("/")
    public ResponseEntity<List<EquipoDto>> listarTodosEquipos() {
        List<EquipoDto> equipos = equipoService.listarTodosLosEquipos();
        if (equipos.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(equipos);
    }

    // Subir y procesar XML de HWiNFO para un equipo existente
    @PostMapping(
            path = "/{equipoId}/hardware/upload-xml",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Equipo> uploadHwinfoXml(
            @PathVariable Long equipoId,
            @RequestPart("file") MultipartFile file
    ) {
        Equipo actualizado = equipoService.procesarXmlYActualizar(equipoId, file);
        return ResponseEntity.ok(actualizado);
    }
}
