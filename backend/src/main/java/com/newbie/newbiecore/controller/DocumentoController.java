package com.newbie.newbiecore.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador seguro para servir documentos (PDFs, imágenes, etc.)
 * Requiere autenticación JWT para acceder a los archivos.
 */
@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    @Value("${app.upload-dir}")
    private String baseUploadDir;

    /**
     * Obtener documento de una orden de trabajo
     * Ruta: /api/documentos/{numeroOrden}/documentos/{nombreArchivo}
     * Ejemplo: /api/documentos/OT-00015/documentos/Conformidad_OT_15.pdf
     */
    @GetMapping("/{numeroOrden}/documentos/{nombreArchivo:.+}")
    public ResponseEntity<byte[]> obtenerDocumento(
            @PathVariable String numeroOrden,
            @PathVariable String nombreArchivo,
            Authentication authentication) {
        // Verificar autenticación
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("No autorizado".getBytes());
        }

        try {
            // Construir ruta segura (evitar path traversal)
            String sanitizedNumeroOrden = sanitizePath(numeroOrden);
            String sanitizedNombreArchivo = sanitizePath(nombreArchivo);

            Path filePath = Paths.get(baseUploadDir, sanitizedNumeroOrden, "documentos", sanitizedNombreArchivo)
                    .normalize();

            // Verificar que el archivo esté dentro del directorio permitido
            Path baseDir = Paths.get(baseUploadDir).normalize().toAbsolutePath();
            if (!filePath.toAbsolutePath().startsWith(baseDir)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Acceso denegado".getBytes());
            }

            // Verificar que el archivo existe
            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Documento no encontrado".getBytes());
            }

            // Leer y devolver el archivo
            byte[] contenido = Files.readAllBytes(filePath);
            MediaType mediaType = determinarMediaType(sanitizedNombreArchivo);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + sanitizedNombreArchivo + "\"")
                    .body(contenido);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error al leer documento: " + e.getMessage()).getBytes());
        }
    }

    /**
     * Obtener imagen de una orden de trabajo (nueva estructura con categoría)
     * Ruta: /api/documentos/{numeroOrden}/imagenes/{categoria}/{nombreArchivo}
     * Ejemplo: /api/documentos/OT-00015/imagenes/INGRESO/uuid-foto.jpg
     */
    @GetMapping("/{numeroOrden}/imagenes/{categoria}/{nombreArchivo:.+}")
    public ResponseEntity<byte[]> obtenerImagenConCategoria(
            @PathVariable String numeroOrden,
            @PathVariable String categoria,
            @PathVariable String nombreArchivo,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("No autorizado".getBytes());
        }

        try {
            String sanitizedNumeroOrden = sanitizePath(numeroOrden);
            String sanitizedCategoria = sanitizePath(categoria);
            String sanitizedNombreArchivo = sanitizePath(nombreArchivo);

            // Ruta: baseUploadDir/OT-00015/imagenes/INGRESO/archivo.jpg
            Path filePath = Paths
                    .get(baseUploadDir, sanitizedNumeroOrden, "imagenes", sanitizedCategoria, sanitizedNombreArchivo)
                    .normalize();

            Path baseDir = Paths.get(baseUploadDir).normalize().toAbsolutePath();
            if (!filePath.toAbsolutePath().startsWith(baseDir)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Acceso denegado".getBytes());
            }

            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Imagen no encontrada".getBytes());
            }

            byte[] contenido = Files.readAllBytes(filePath);
            MediaType mediaType = determinarMediaType(sanitizedNombreArchivo);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(contenido);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error al leer imagen: " + e.getMessage()).getBytes());
        }
    }

    /**
     * Obtener imagen de una orden de trabajo (compatibilidad con estructura
     * antigua)
     * Ruta: /api/documentos/{numeroOrden}/imagenes/{nombreArchivo}
     */
    @GetMapping("/{numeroOrden}/imagenes/{nombreArchivo:.+}")
    public ResponseEntity<byte[]> obtenerImagen(
            @PathVariable String numeroOrden,
            @PathVariable String nombreArchivo,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("No autorizado".getBytes());
        }

        try {
            String sanitizedNumeroOrden = sanitizePath(numeroOrden);
            String sanitizedNombreArchivo = sanitizePath(nombreArchivo);

            // Intentar primero con estructura antigua (retrocompatibilidad)
            Path filePath = Paths.get(baseUploadDir, sanitizedNumeroOrden, sanitizedNombreArchivo)
                    .normalize();

            Path baseDir = Paths.get(baseUploadDir).normalize().toAbsolutePath();
            if (!filePath.toAbsolutePath().startsWith(baseDir)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Acceso denegado".getBytes());
            }

            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Imagen no encontrada".getBytes());
            }

            byte[] contenido = Files.readAllBytes(filePath);
            MediaType mediaType = determinarMediaType(sanitizedNombreArchivo);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(contenido);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error al leer imagen: " + e.getMessage()).getBytes());
        }
    }

    /**
     * Listar documentos de una orden de trabajo con sus fechas de modificación
     * Ruta: /api/documentos/{numeroOrden}/listar
     */
    @GetMapping("/{numeroOrden}/listar")
    public ResponseEntity<List<Map<String, Object>>> listarDocumentos(
            @PathVariable String numeroOrden,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String sanitizedNumeroOrden = sanitizePath(numeroOrden);
            Path documentosDir = Paths.get(baseUploadDir, sanitizedNumeroOrden, "documentos").normalize();

            List<Map<String, Object>> documentos = new ArrayList<>();

            if (Files.exists(documentosDir) && Files.isDirectory(documentosDir)) {
                try (var stream = Files.list(documentosDir)) {
                    stream.filter(Files::isRegularFile)
                            .forEach(file -> {
                                try {
                                    BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
                                    Map<String, Object> docInfo = new HashMap<>();
                                    docInfo.put("nombre", file.getFileName().toString());
                                    docInfo.put("tamaño", attrs.size());
                                    docInfo.put("fechaModificacion", attrs.lastModifiedTime().toMillis());
                                    docInfo.put("fechaModificacionStr",
                                            new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss")
                                                    .format(new java.util.Date(attrs.lastModifiedTime().toMillis())));
                                    documentos.add(docInfo);
                                } catch (IOException e) {
                                    // Ignorar archivos con error de lectura
                                }
                            });
                }
            }

            // Ordenar por fecha de modificación descendente (más recientes primero)
            documentos.sort((a, b) -> ((Long) b.get("fechaModificacion")).compareTo((Long) a.get("fechaModificacion")));

            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Sanitizar path para evitar ataques de path traversal
     */
    private String sanitizePath(String input) {
        if (input == null)
            return "";
        // Remover caracteres peligrosos
        return input.replaceAll("[.]{2,}", "") // Remover ..
                .replaceAll("[/\\\\]+", "") // Remover / y \
                .replaceAll("[<>:\"|?*]", ""); // Remover caracteres inválidos
    }

    /**
     * Determinar el MediaType basado en la extensión del archivo
     */
    private MediaType determinarMediaType(String nombreArchivo) {
        String extension = nombreArchivo.toLowerCase();
        if (extension.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        } else if (extension.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        } else if (extension.endsWith(".jpg") || extension.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (extension.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        } else {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
