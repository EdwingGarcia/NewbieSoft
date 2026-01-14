package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.service.ConsultaClienteService;
import com.newbie.newbiecore.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
public class SecureFileController {

    // Lee la ruta de uploads desde application.properties (por defecto 'uploads')
    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final ConsultaClienteService consultaClienteService;

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request,
                                              @RequestParam(value = "token", required = false) String token) {

        // 1. 🔒 Validar Seguridad primero
        // Si no envía token o el token no es válido para nadie, devolvemos 401 Unauthorized
        if (!isAuthorized(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 2. 📂 Obtener la ruta relativa del archivo solicitado
        // Ejemplo: si pide /uploads/ot-001/foto.jpg, extrae "ot-001/foto.jpg"
        String path = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String relativePath = new AntPathMatcher().extractPathWithinPattern(bestMatchPattern, path);

        try {
            // Construir la ruta absoluta al archivo
            Path file = Paths.get(uploadDir).resolve(relativePath).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Determinar tipo de contenido (imagen/png, imagen/jpeg, pdf, etc.)
                String contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        // "inline" permite que el navegador muestre la imagen en lugar de descargarla
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                // Archivo no existe físico
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Valida si el token proporcionado pertenece a un Técnico (JWT) o a un Cliente (Token de Consulta).
     */
    private boolean isAuthorized(String token) {
        if (token == null || token.isBlank()) return false;

        // OPCIÓN A: Intentar validar como JWT (Técnico / Admin)
        try {
            String username = jwtUtils.extractUsername(token);
            if (username != null && jwtUtils.validateToken(token, userDetailsService.loadUserByUsername(username))) {
                return true; // Es un técnico logueado
            }
        } catch (Exception ignored) {
            // No es formato JWT válido, seguimos...
        }

        // OPCIÓN B: Intentar validar como Token de Consulta (Cliente Externo)
        try {
            // Este método lanza excepción si el token no existe o expiró
            consultaClienteService.validarTokenYObtenerCedula(token);
            return true; // Es un cliente legítimo consultando su orden
        } catch (Exception ignored) {
            // No es token válido de cliente
        }

        return false; // Token desconocido o expirado
    }
}