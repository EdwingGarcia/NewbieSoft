package com.newbie.newbiecore.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource; // Importante para leer el logo
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
            // 1. Guardar la imagen de la firma en disco (Lógica existente...)
            String firmaBase64Clean = null;
            if (request.firma != null && request.firma.contains(",")) {
                firmaBase64Clean = request.firma.split(",")[1];
            } else {
                firmaBase64Clean = request.firma;
            }

            if (firmaBase64Clean != null && request.numeroOrden != null) {
                try {
                    byte[] firmaBytes = Base64.getDecoder().decode(firmaBase64Clean);
                    String carpetaOT = baseUploadDir + "/ot-" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);

                    Path firmaPath = carpetaDocumentos.resolve("firma_cliente_" + request.ordenId + ".png");
                    Files.write(firmaPath, firmaBytes, StandardOpenOption.CREATE);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar respaldo de firma: " + e.getMessage());
                }
            }

            // 2. Generar el HTML (Ahora profesional)
            String html = generarHtmlConfirmacion(request);

            // 3. Convertir HTML a PDF
            byte[] pdfBytes = htmlToPdf(html);

            // 4. Guardar copia del PDF (Lógica existente...)
            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/ot-" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path pdfPath = carpetaDocumentos.resolve("FirmaConfirmación" + request.ordenId + ".pdf");
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar copia del PDF: " + e.getMessage());
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Confirmacion_Firma.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    private String generarHtmlConfirmacion(FirmaRequest request) {
        // 1. Cargar Logo del sistema
        String logoImgTag = cargarLogoBase64();

        // 2. Procesar Firma del cliente
        String firmaImgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            firmaImgTag = "<img src='" + src + "' alt='Firma' style='max-height: 80px;' />";
        } else {
            firmaImgTag = "<p style='color: #999;'><i>Sin firma digital registrada</i></p>";
        }

        // 3. Fecha actual formateada
        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // 4. HTML Profesional
        return """
            <html>
            <head>
                <style>
                    @page { size: A4; margin: 2.5cm; }
                    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }
                    
                    /* Header con Tabla para alinear Logo y Títulos */
                    .header-table { width: 100%%; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 30px; }
                    .header-logo { width: 30%%; vertical-align: middle; }
                    .header-info { width: 70%%; text-align: right; vertical-align: middle; }
                    .header-info h1 { margin: 0; font-size: 20px; color: #0056b3; text-transform: uppercase; }
                    .header-info p { margin: 2px 0; color: #666; font-size: 11px; }

                    /* Contenedores de Información */
                    .section-title { background-color: #f0f4f8; padding: 8px; font-weight: bold; border-left: 4px solid #0056b3; margin-top: 20px; margin-bottom: 10px; font-size: 13px; }
                    
                    .info-table { width: 100%%; border-collapse: collapse; margin-bottom: 15px; }
                    .info-table td { padding: 6px; border-bottom: 1px solid #eee; }
                    .label { font-weight: bold; color: #555; width: 30%%; }
                    .value { color: #000; }

                    /* Texto Legal */
                    .legal-box { border: 1px solid #ddd; background-color: #fafafa; padding: 15px; font-size: 10px; text-align: justify; color: #555; margin-top: 20px; border-radius: 4px; }

                    /* Área de Firma */
                    .signature-section { margin-top: 50px; page-break-inside: avoid; }
                    .signature-box { width: 250px; margin: 0 auto; text-align: center; }
                    .signature-line { border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 11px; }

                    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td class="header-logo">
                            %s
                        </td>
                        <td class="header-info">
                            <h1>Acta de Conformidad</h1>
                            <p><b>Orden de Trabajo N°:</b> %s</p>
                            <p>Fecha de Emisión: %s</p>
                        </td>
                    </tr>
                </table>

                <div class="section-title">DETALLES DEL SERVICIO</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Cliente:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Equipo / Dispositivo:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Servicio Realizado:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>

                <div class="legal-box">
                    <p><b>DECLARACIÓN DE CONFORMIDAD:</b></p>
                    <p>
                        Por medio del presente documento, el cliente declara haber revisado el funcionamiento del equipo
                        y acepta que el servicio descrito ha sido realizado a su entera satisfacción. Se libera a la empresa
                        de responsabilidad sobre fallas futuras no relacionadas con el servicio técnico prestado o derivadas
                        del mal uso del dispositivo.
                    </p>
                    <p>
                        La firma digital plasmada en este documento tiene plena validez como constancia de la recepción
                        del equipo y aceptación de los términos de garantía estipulados previamente.
                    </p>
                </div>

                <div class="signature-section">
                    <div class="signature-box">
                        %s
                        <div class="signature-line">Firma del Cliente / Aceptación</div>
                    </div>
                </div>

                <div class="footer">
                    Documento generado electrónicamente por NewbieCore System.
                </div>
            </body>
            </html>
            """.formatted(
                logoImgTag, // 1. Logo
                escaparHtml(request.numeroOrden != null ? request.numeroOrden : "---"), // 2. Nro Orden
                fechaEmision, // 3. Fecha
                escaparHtml(request.cliente), // 4. Cliente
                escaparHtml(request.equipo), // 5. Equipo
                escaparHtml(request.procedimiento), // 6. Procedimiento
                firmaImgTag // 7. Firma
        );
    }

    /**
     * Lee el archivo logo.png desde src/main/resources/static/logo.png
     * y retorna un tag HTML <img> con la data en Base64.
     */
    private String cargarLogoBase64() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo.png");
            if (resource.exists()) {
                byte[] imageBytes = resource.getInputStream().readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                // Ajusta el max-height según tus necesidades
                return "<img src='data:image/png;base64," + base64 + "' alt='Logo' style='max-height: 60px; max-width: 180px;' />";
            }
        } catch (Exception e) {
            System.err.println("Error cargando logo para PDF: " + e.getMessage());
        }
        // Retorno fallback si falla
        return "<b>NEWBIE SOFT</b>";
    }

    private byte[] htmlToPdf(String html) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
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

    public static class FirmaRequest {
        public Long ordenId;
        public String numeroOrden;
        public String cliente;
        public String equipo;
        public String procedimiento;
        public String modo;
        public String firma;
    }
}