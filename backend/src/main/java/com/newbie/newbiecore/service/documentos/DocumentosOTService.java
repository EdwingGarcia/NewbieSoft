package com.newbie.newbiecore.service.documentos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class DocumentosOTService {

    @Value("${app.upload-dir}")
    private String baseDir;

    /**
     * 💾 Guarda el PDF de la OT en:
     * {baseDir}/{numeroOrden}/documentos/
     */
    public void guardarPdfOrden(
            String numeroOrden,
            String nombreArchivo,
            byte[] contenido
    ) {
        try {
            Path documentosDir = Paths.get(
                    baseDir,
                    numeroOrden,
                    "documentos"
            );

            Files.createDirectories(documentosDir);

            Path archivo = documentosDir.resolve(nombreArchivo);
            Files.write(archivo, contenido);

        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el PDF de la OT", e);
        }
    }
}
