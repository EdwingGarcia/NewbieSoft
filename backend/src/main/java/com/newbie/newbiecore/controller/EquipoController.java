package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.dto.EquipoListDto;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.service.EquipoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/equipos") // ✅ plural para que coincida con el front
@Tag(name = "Equipo", description = "Endpoints MVC equipo")
public class EquipoController {

    private final EquipoService equipoService;

    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }

    // Crear/registrar un equipo
    @PostMapping
    public ResponseEntity<Equipo> register(@RequestBody EquipoDto dto, Authentication auth) {
        Equipo e = equipoService.registrarEquipo(dto, auth);
        return ResponseEntity.ok(e);
    }

    // ✅ Listar todos los equipos (lo que consume el combobox)
    @GetMapping
    public ResponseEntity<List<EquipoListDto>> listarTodosEquipos() {
        List<EquipoListDto> equipos = equipoService.listarTodosParaCombobox();
        if (equipos.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(equipos);
    }

    // Listar equipos por cédula de cliente
    @GetMapping("/cliente/{cedula}")
    public ResponseEntity<List<EquipoDto>> listarPorCliente(@PathVariable String cedula) {
        List<EquipoDto> equipos = equipoService.listarPorCliente(cedula);
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

    // Obtener detalles de un equipo por ID
    @GetMapping("/{id}")
    public ResponseEntity<EquipoDto> obtenerPorId(@PathVariable Long id) {
        try {
            EquipoDto equipo = equipoService.obtenerPorId(id);
            return ResponseEntity.ok(equipo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // (Opcional) mantener esto si lo usas
    @GetMapping("/mis-equipos")
    public ResponseEntity<List<EquipoDto>> listarMisEquipos(Authentication auth) {
        List<EquipoDto> equipos = equipoService.listarMisEquipos(auth);
        if (equipos.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(equipos);
    }
}
