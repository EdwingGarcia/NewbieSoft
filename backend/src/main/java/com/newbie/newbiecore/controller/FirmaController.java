package com.newbie.newbiecore.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

@RestController
@RequestMapping("/api/firmas")
public class FirmaController {

    @Value("${app.upload-dir}")
    private String baseUploadDir;

    @PostMapping("/confirmacion")
    public ResponseEntity<byte[]> confirmarFirma(@RequestBody FirmaRequest request) {
        try {
            // 1. Guardar la imagen de la firma en disco (opcional, pero útil como respaldo)
            String firmaBase64Clean = null;
            if (request.firma != null && request.firma.contains(",")) {
                firmaBase64Clean = request.firma.split(",")[1];
            } else {
                firmaBase64Clean = request.firma;
            }

            if (firmaBase64Clean != null && request.numeroOrden != null) {
                try {
                    byte[] firmaBytes = java.util.Base64.getDecoder().decode(firmaBase64Clean);
                    String carpetaOT = baseUploadDir + "/ot-" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);

                    Path firmaPath = carpetaDocumentos.resolve("firma_cliente_" + request.ordenId + ".png");
                    Files.write(firmaPath, firmaBytes, StandardOpenOption.CREATE);
                } catch (Exception e) {
                    System.err.println("No se pudo guardar la imagen de la firma en disco: " + e.getMessage());
                    // No detenemos el flujo, seguimos generando el PDF
                }
            }

            // 2. Generar el HTML
            String html = generarHtmlConfirmacion(request);

            // 3. Convertir HTML a PDF usando OpenHtmlToPdf
            byte[] pdfBytes = htmlToPdf(html);

            // 4. Guardar copia del PDF en el servidor (opcional)
            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/ot-" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path pdfPath = carpetaDocumentos.resolve("FirmaConfirmación" + request.ordenId + ".pdf");
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE);
                } catch (Exception e) {
                    System.err.println("No se pudo guardar copia del PDF en el servidor: " + e.getMessage());
                }
            }

            // 5. Retornar el PDF al cliente
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Confirmacion_Firma.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF de firma: " + e.getMessage()).getBytes());
        }
    }

    private String generarHtmlConfirmacion(FirmaRequest request) {
        // Preparamos la imagen para incrustarla en el HTML.
        // OpenHtmlToPdf soporta imágenes base64 si están en formato <img src="data:image/png;base64,..." />
        String imgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            // Aseguramos que tenga el prefijo correcto si viene solo el raw base64
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            imgTag = "<div class='firma-box'><img src='" + src + "' alt='Firma del Cliente' /></div>";
        } else {
            imgTag = "<div class='firma-box'><p><i>Sin firma registrada</i></p></div>";
        }

        return """
            <html>
            <head>
                <style>
                    body { font-family: sans-serif; margin: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #0A6EBD; margin-bottom: 30px; padding-bottom: 10px; }
                    .header h1 { margin: 0; color: #0A6EBD; }
                    .content { margin-bottom: 30px; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #555; display: block; margin-bottom: 5px;}
                    .value { font-size: 16px; }
                    .firma-container { margin-top: 50px; text-align: center; page-break-inside: avoid; }
                    .firma-box { border: 1px dashed #ccc; display: inline-block; padding: 10px; }
                    img { max-width: 300px; max-height: 150px; }
                    .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Documento de Aceptación</h1>
                    <p>Orden de Trabajo #%s</p>
                </div>

                <div class="content">
                    <div class="field">
                        <span class="label">Cliente:</span>
                        <span class="value">%s</span>
                    </div>
                    <div class="field">
                        <span class="label">Equipo:</span>
                        <span class="value">%s</span>
                    </div>
                    <div class="field">
                        <span class="label">Procedimiento / Servicio:</span>
                        <span class="value">%s</span>
                    </div>
                     <div class="field">
                        <span class="label">Detalle de Aceptación:</span>
                        <span class="value">El cliente declara haber recibido el equipo en las condiciones acordadas y/o autoriza el procedimiento descrito.</span>
                    </div>
                </div>

                <div class="firma-container">
                    <span class="label">Firma del Cliente:</span>
                    %s
                </div>

                <div class="footer">
                    Generado automáticamente por NewbieCore System
                </div>
            </body>
            </html>
            """.formatted(
                escaparHtml(request.numeroOrden != null ? request.numeroOrden : "---"),
                escaparHtml(request.cliente),
                escaparHtml(request.equipo),
                escaparHtml(request.procedimiento),
                imgTag
        );
    }

    private byte[] htmlToPdf(String html) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();

        // Importante: Usar fast mode o configurar base URI si hay recursos externos,
        // pero para base64 embebido esto suele funcionar bien.
        builder.useFastMode();
        builder.withHtmlContent(html, null);
        builder.toStream(baos);
        builder.run();

        return baos.toByteArray();
    }

    private String escaparHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    // DTO Interno para recibir la petición
    public static class FirmaRequest {
        public Long ordenId;
        public String numeroOrden;
        public String cliente;
        public String equipo;
        public String procedimiento;
        public String modo;
        public String firma; // Base64 de la imagen
    }
}