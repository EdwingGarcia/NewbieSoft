package com.newbie.newbiecore.controller;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.upload-dir}")
    private String baseUploadDir;

    @PostMapping("/confirmacion")
    public ResponseEntity<byte[]> confirmarFirma(@RequestBody FirmaRequest request) throws IOException, InterruptedException {

        // Convertir base64 a bytes
        String firmaBase64 = null;
        if (request.firma != null && request.firma.contains(",")) {
            firmaBase64 = request.firma.split(",")[1];
        }

        byte[] firmaBytes = firmaBase64 != null
                ? java.util.Base64.getDecoder().decode(firmaBase64)
                : null;

        // 🟦 Carpeta OT ya existente
        String carpetaOT = baseUploadDir + "/ot-" + request.numeroOrden;

        // 🟦 SOLO crear la subcarpeta documentos
        Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
        Files.createDirectories(carpetaDocumentos);

        // Guardar firma
        if (firmaBytes != null) {
            Path firmaPath = carpetaDocumentos.resolve("firma_cliente_" + request.ordenId + ".png");
            Files.write(firmaPath, firmaBytes, StandardOpenOption.CREATE);
        }

        // Generar HTML para el PDF
        String firmaHtml = (request.firma != null && !request.firma.isBlank())
                ? "<img src='" + request.firma + "' width='250'/>"
                : "<p><i>Sin firma registrada</i></p>";

        String html = """
                <html><body>
                <h1>Confirmación de Firma</h1>
                <p><b>Equipo:</b> %s</p>
                <p><b>Procedimiento:</b> %s</p>
                <p><b>Cliente:</b> %s</p>
                %s
                </body></html>
                """.formatted(request.equipo, request.procedimiento, request.cliente, firmaHtml);

        // PDF temporal
        Path tempHtml = Files.createTempFile("confirm", ".html");
        Files.writeString(tempHtml, html);

        Path tempPdf = Files.createTempFile("confirm", ".pdf");

        // Procesar PDF
        ProcessBuilder pb = new ProcessBuilder(
                "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe",
                "--enable-local-file-access",
                tempHtml.toString(),
                tempPdf.toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        process.waitFor();

        byte[] pdfBytes = Files.readAllBytes(tempPdf);

        // Guardar PDF en documentos/
        Path pdfDestino = carpetaDocumentos.resolve("confirmacion_" + request.ordenId + ".pdf");
        Files.write(pdfDestino, pdfBytes, StandardOpenOption.CREATE);

        // Retornar PDF
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Confirmacion.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    public static class FirmaRequest {
        public Long ordenId;
        public String numeroOrden;  // ← AGREGADO para armar carpeta OT
        public String cliente;
        public String equipo;
        public String procedimiento;
        public String modo;
        public String firma;
    }
}
