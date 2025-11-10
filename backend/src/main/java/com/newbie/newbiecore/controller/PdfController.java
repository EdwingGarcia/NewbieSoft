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
@RequestMapping("/api/pdf")
public class PdfController {

    @PostMapping("/generar")
    public ResponseEntity<byte[]> generarPdf(@RequestBody String html) throws IOException, InterruptedException {
        // Guardamos el HTML temporalmente
        Path tempHtml = Files.createTempFile("documento", ".html");
        Files.writeString(tempHtml, html, StandardOpenOption.TRUNCATE_EXISTING);

        // Archivo PDF temporal
        Path tempPdf = Files.createTempFile("documento", ".pdf");

        // Ejecutamos wkhtmltopdf
        ProcessBuilder pb = new ProcessBuilder(
                "C:\\\\Program Files\\\\wkhtmltopdf\\\\bin\\\\wkhtmltopdf.exe",
                tempHtml.toAbsolutePath().toString(),
                tempPdf.toAbsolutePath().toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Capturar errores si los hay
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + output).getBytes());
        }

        byte[] pdfBytes = Files.readAllBytes(tempPdf);

        // Limpieza temporal
        Files.deleteIfExists(tempHtml);
        Files.deleteIfExists(tempPdf);

        // Retornar el PDF como archivo
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=documento.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
