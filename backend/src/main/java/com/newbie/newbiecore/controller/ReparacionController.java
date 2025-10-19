package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.ReparacionCreateDTO;
import com.newbie.newbiecore.dto.ReparacionResponseDTO;
import com.newbie.newbiecore.entity.Reparacion;
import com.newbie.newbiecore.service.FichaTecnicaService;
import com.newbie.newbiecore.service.ReparacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reparaciones")
public class ReparacionController {

    private final ReparacionService reparacionService;
    private final FichaTecnicaService fichaTecnicaService;

    public ReparacionController(ReparacionService reparacionService, FichaTecnicaService fichaTecnicaService) {
        this.reparacionService = reparacionService;
        this.fichaTecnicaService = fichaTecnicaService;
    }
    @PostMapping
    public ResponseEntity<Reparacion> crearReparacion(@RequestBody ReparacionCreateDTO dto) {
        return reparacionService.crearReparacion(dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().build());
    }
    // 🔍 Listar reparaciones por técnico
    @GetMapping("/tecnico/{cedula}")
    public ResponseEntity<List<ReparacionResponseDTO>> listarPorTecnico(@PathVariable String cedula) {
        return ResponseEntity.ok(reparacionService.listarPorTecnico(cedula));
    }

    // 🔍 Ver detalle
    @GetMapping("/{id}")
    public ResponseEntity<ReparacionResponseDTO> obtenerPorId(@PathVariable Long id) {
        return reparacionService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🛠️ Registrar diagnóstico
    @PutMapping("/{id}/diagnostico")
    public ResponseEntity<Reparacion> registrarDiagnostico(@PathVariable Long id, @RequestBody String diagnostico) {
        return reparacionService.registrarDiagnostico(id, diagnostico)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 📎 Subir XML como observación
    @PostMapping("/{id}/xml-observacion")
    public ResponseEntity<Reparacion> subirXml(@PathVariable Long id, @RequestParam MultipartFile file) throws IOException {
        return reparacionService.subirXml(id, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 📷 Subir evidencia
    @PostMapping("/{id}/evidencia")
    public ResponseEntity<Reparacion> subirEvidencia(@PathVariable Long id, @RequestParam MultipartFile file) throws IOException {
        return reparacionService.subirEvidencia(id, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔧 Actualizar datos técnicos
    @PutMapping("/{id}")
    public ResponseEntity<Reparacion> actualizar(@PathVariable Long id, @RequestBody ReparacionCreateDTO datos) {
        Reparacion parcial = Reparacion.builder()
                .estado(datos.getEstado())
                .observaciones(datos.getObservaciones())
                .costoTotal(datos.getCostoTotal())
                .build();
        return reparacionService.actualizar(id, parcial)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Cerrar reparación
    @PutMapping("/{id}/cerrar")
    public ResponseEntity<Reparacion> cerrar(@PathVariable Long id, @RequestBody String informeFinal) {
        return reparacionService.cerrar(id, informeFinal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/equipo/{equipoId}")
    public ResponseEntity<List<ReparacionResponseDTO>> historialPorEquipo(@PathVariable Long equipoId) {
        return ResponseEntity.ok(reparacionService.historialPorEquipo(equipoId));
    }

    // 🖊️ Firma de aceptación
    @PutMapping("/{id}/firma-aceptacion")
    public ResponseEntity<Reparacion> registrarFirmaAceptacion(@PathVariable Long id, @RequestBody String firma) {
        return fichaTecnicaService.registrarFirmaAceptacion(id, firma)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🖊️ Firma de conformidad
    @PutMapping("/{id}/firma-conformidad")
    public ResponseEntity<Reparacion> registrarFirmaConformidad(@PathVariable Long id, @RequestBody String firma) {
        return fichaTecnicaService.registrarFirmaConformidad(id, firma)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 📄 Subir XML técnico
    @PostMapping("/{id}/xml-tecnico")
    public ResponseEntity<Reparacion> subirXmlDatos(@PathVariable Long id, @RequestParam MultipartFile file) throws IOException {
        return fichaTecnicaService.subirXmlDatos(id, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 📸 Subir fotos
    @PostMapping("/{id}/fotos")
    public ResponseEntity<Reparacion> subirFotos(@PathVariable Long id, @RequestBody String fotosJson) {
        return fichaTecnicaService.subirFotos(id, fotosJson)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}