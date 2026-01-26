package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.OrdenTrabajo.*;
import com.newbie.newbiecore.service.OrdenTrabajoImagenService;
import com.newbie.newbiecore.service.OrdenTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import com.newbie.newbiecore.dto.OrdenTrabajo.*;
import org.springframework.web.bind.annotation.*;

@RefreshScope
@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenTrabajoService;
    private final OrdenTrabajoImagenService ordenTrabajoImagenService;

    /*
     * =============================================================
     * CREAR ORDEN DE TRABAJO (INGRESO)
     * =============================================================
     */
    @PostMapping
    public ResponseEntity<OrdenTrabajoIngresoDto> crear(
            @RequestBody CrearOrdenTrabajoRequest request,
            Authentication auth) {
        var dto = ordenTrabajoService.crearOrden(request, auth);
        return ResponseEntity.ok(dto);
        // Si quieres CREATED (201):
        // return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @org.springframework.beans.factory.annotation.Value("${app.upload-dir}")
    private String uploadDir;

    @GetMapping("/{numeroOrden}/documentos")
    public ResponseEntity<InputStreamResource> descargarDocumentos(@PathVariable String numeroOrden) {
        try {
            Path documentosPath = Paths.get(uploadDir, numeroOrden, "documentos");
            if (!Files.exists(documentosPath)) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos)) {
                Files.walk(documentosPath)
                        .filter(Files::isRegularFile)
                        .forEach(file -> {
                            try {
                                ZipEntry entry = new ZipEntry(documentosPath.relativize(file).toString());
                                zos.putNextEntry(entry);
                                Files.copy(file, zos);
                                zos.closeEntry();
                            } catch (Exception e) {
                                // Ignorar archivos problemáticos
                            }
                        });
            }
            ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Documentos_" + numeroOrden + ".zip")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new InputStreamResource(bais));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /*
     * =============================================================
     * OBTENER SOLO LA SECCIÓN DE INGRESO
     * =============================================================
     */
    @GetMapping("/{id}/ingreso")
    public ResponseEntity<OrdenTrabajoIngresoDto> obtenerIngreso(@PathVariable Long id) {
        var dto = ordenTrabajoService.obtenerIngreso(id);
        return ResponseEntity.ok(dto);
    }

    /*
     * =============================================================
     * ACTUALIZAR ENTREGA / CIERRE
     * =============================================================
     */
    @PutMapping("/{id}/entrega")
    public ResponseEntity<Void> actualizarEntrega(
            @PathVariable Long id,
            @RequestBody ActualizarEntregaRequest request) {
        ordenTrabajoService.actualizarEntrega(id, request);
        return ResponseEntity.noContent().build();
    }

    /*
     * =============================================================
     * OBTENER DETALLE COMPLETO (INGRESO + ENTREGA + EQUIPO + FICHA + META)
     * =============================================================
     */
    @GetMapping("/{id}/detalle")
    public ResponseEntity<OrdenTrabajoDetalleDto> obtenerDetalle(@PathVariable Long id, Authentication auth) {
        var dto = ordenTrabajoService.obtenerDetalle(id, auth);
        return ResponseEntity.ok(dto);
    }

    /*
     * =============================================================
     * SUBIR IMÁGENES DE LA ORDEN
     * =============================================================
     */
    @PostMapping("/{id}/imagenes")
    public ResponseEntity<Void> subirImagenes(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false, defaultValue = "INGRESO") String categoria,
            @RequestParam(required = false) String descripcion) {
        try {
            ordenTrabajoImagenService.subirImagenes(id, files, categoria, descripcion);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /*
     * =============================================================
     * LISTAR ÓRDENES PARA EL DASHBOARD
     * =============================================================
     */
    @GetMapping
    public ResponseEntity<List<OrdenTrabajoListaDto>> listar() {
        var lista = ordenTrabajoService.listarOrdenes();
        return ResponseEntity.ok(lista);
    }

    /*
     * =============================================================
     * LISTAR IMÁGENES DE UNA ORDEN
     * =============================================================
     */
    @GetMapping("/{id}/imagenes")
    public ResponseEntity<List<ImagenDto>> listarImagenes(@PathVariable Long id) {
        var imagenes = ordenTrabajoImagenService.listarImagenes(id);

        if (imagenes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(imagenes);
    }

    @GetMapping("/mis-ordenes")
    public ResponseEntity<List<OrdenTrabajoListaDto>> listarMisOrdenes(Authentication auth) {
        var lista = ordenTrabajoService.listarMisOrdenes(auth);
        return ResponseEntity.ok(lista);
    }

}
