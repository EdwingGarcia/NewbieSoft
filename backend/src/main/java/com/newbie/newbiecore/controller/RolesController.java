package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.RolRequest;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.service.RolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@Tag(name = "Roles", description = "Gestión de roles de usuario")
public class RolesController {

    private final RolService rolService;

    public RolesController(RolService rolService) {
        this.rolService = rolService;
    }

    @Operation(summary = "Crear un nuevo rol", description = "Permite registrar un nuevo rol en el sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rol creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    public ResponseEntity<Rol> crearRol(@RequestBody RolRequest request) {
        Rol rol = new Rol();
        rol.setNombre(request.getNombre());
        rol.setDescripcion(request.getDescripcion());
        return ResponseEntity.ok(rolService.crearRol(rol));
    }


    @Operation(summary = "Listar todos los roles", description = "Obtiene la lista completa de roles")
    @GetMapping
    public ResponseEntity<List<Rol>> listarRoles() {
        return ResponseEntity.ok(rolService.listarRoles());
    }

    @Operation(summary = "Obtener rol por ID", description = "Busca un rol específico por su identificador")
    @GetMapping("/{id}")
    public ResponseEntity<Rol> obtenerRolPorId(@PathVariable Long id) {
        return rolService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Actualizar rol", description = "Permite modificar un rol existente")
    @PutMapping("/{id}")
    public ResponseEntity<Rol> actualizarRol(@PathVariable Long id, @RequestBody Rol rol) {
        return rolService.actualizarRol(id, rol)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Eliminar rol", description = "Elimina un rol existente por su ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRol(@PathVariable Long id) {
        return rolService.eliminarRol(id) ?
                ResponseEntity.noContent().build() :
                ResponseEntity.notFound().build();
    }
}