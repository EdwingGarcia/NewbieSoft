package com.newbie.newbiecore.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;

@RefreshScope
@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
public class SecureFileController {

    @Value("${app.upload-dir}")
    private String uploadDir;

    // Ya no necesitamos JwtUtils ni Services aquí, Spring Security filtra antes.

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) {
        // 1. Obtener la ruta del archivo solicitado
        String path = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String relativePath = new AntPathMatcher().extractPathWithinPattern(bestMatchPattern, path);

        // 🔧 FIX: Decodificar URL (convertir %20 a espacios, etc.)
        relativePath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8);

        try {
            Path file = Paths.get(uploadDir).resolve(relativePath).normalize();

            // Seguridad Anti-Path Traversal
            if (!file.startsWith(Paths.get(uploadDir).toAbsolutePath().normalize())) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
                if (contentType == null)
                    contentType = "application/octet-stream";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}