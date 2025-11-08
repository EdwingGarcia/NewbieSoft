package com.newbie.newbiecore.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

@RestController
@RequestMapping("/api/firmas")
public class FirmaController {

    @PostMapping("/confirmacion")
    public ResponseEntity<byte[]> confirmarFirma(@RequestBody FirmaRequest request) throws IOException, InterruptedException {
        // Si la firma viene vacía o nula, mostramos texto alternativo
        String firmaHtml = (request.firma != null && !request.firma.isBlank())
                ? "<img src='" + request.firma + "' alt='Firma' width='250'/>"
                : "<p><i>Sin firma registrada</i></p>";

        // Construimos el HTML que se convertirá a PDF
        String html = """
            <html>
              <head>
                <meta charset='UTF-8'>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  h1 { color: #2E86C1; }
                  p { font-size: 14px; }
                  img { border: 1px solid #ccc; margin-top: 10px; }
                </style>
              </head>
              <body>
                <h1>Confirmación de Firma</h1>
                <p><strong>Equipo:</strong> %s</p>
                <p><strong>Procedimiento:</strong> %s</p>
                <p><strong>Cliente:</strong> %s</p>
                <h3>Firma:</h3>
                %s
              </body>
            </html>
        """.formatted(request.equipo, request.procedimiento, request.cliente, firmaHtml);

        // Crear archivos temporales
        Path tempHtml = Files.createTempFile("confirmacion", ".html");
        Files.writeString(tempHtml, html, StandardOpenOption.TRUNCATE_EXISTING);
        Path tempPdf = Files.createTempFile("confirmacion", ".pdf");

        // Ejecutar wkhtmltopdf con acceso a archivos locales habilitado
        ProcessBuilder pb = new ProcessBuilder(
                "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe",
                "--enable-local-file-access",
                tempHtml.toAbsolutePath().toString(),
                tempPdf.toAbsolutePath().toString()
        );
        pb.redirectErrorStream(true);

        Process process = pb.start();

        // Capturar salida del proceso
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();

        System.out.println("Salida wkhtmltopdf:\n" + output);
        System.out.println("Exit code: " + exitCode);

        if (exitCode != 0) {
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + output).getBytes());
        }

        byte[] pdfBytes = Files.readAllBytes(tempPdf);

        // Limpieza de archivos temporales
        Files.deleteIfExists(tempHtml);
        Files.deleteIfExists(tempPdf);

        // Retornar PDF al frontend
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Confirmacion.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    // Clase interna para recibir el cuerpo JSON del request
    public static class FirmaRequest {
        public String cliente;
        public String equipo;
        public String procedimiento;
        public String firma; // Base64 de la firma o null
    }
}
