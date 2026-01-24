package com.newbie.newbiecore.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping("/estado/{numeroOrden}")
    public ResponseEntity<Map<String, Object>> obtenerEstadoFirmas(@PathVariable String numeroOrden) {
        Map<String, Object> resultado = new HashMap<>();
        
        try {
            String carpetaOT = baseUploadDir + "/" + numeroOrden;
            Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
            
            // Verificar firma de conformidad
            boolean tieneConformidad = false;
            if (Files.exists(carpetaDocumentos)) {
                try (var files = Files.list(carpetaDocumentos)) {
                    tieneConformidad = files.anyMatch(p -> 
                        p.getFileName().toString().startsWith("FirmaConformidad_") ||
                        p.getFileName().toString().startsWith("Conformidad_OT_"));
                }
            }
            
            // Verificar firma de recibo
            boolean tieneRecibo = false;
            if (Files.exists(carpetaDocumentos)) {
                try (var files = Files.list(carpetaDocumentos)) {
                    tieneRecibo = files.anyMatch(p -> 
                        p.getFileName().toString().startsWith("FirmaRecibo_") ||
                        p.getFileName().toString().startsWith("Recibo_OT_"));
                }
            }
            
            resultado.put("conformidadFirmada", tieneConformidad);
            resultado.put("reciboFirmado", tieneRecibo);
            resultado.put("numeroOrden", numeroOrden);
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            resultado.put("conformidadFirmada", false);
            resultado.put("reciboFirmado", false);
            resultado.put("error", e.getMessage());
            return ResponseEntity.ok(resultado);
        }
    }

    @PostMapping("/confirmacion")
    public ResponseEntity<byte[]> confirmarFirma(@RequestBody FirmaRequest request) {
        try {
            String firmaBase64Clean = null;
            if (request.firma != null && request.firma.contains(",")) {
                firmaBase64Clean = request.firma.split(",")[1];
            } else {
                firmaBase64Clean = request.firma;
            }

            if (firmaBase64Clean != null && request.numeroOrden != null) {
                try {
                    byte[] firmaBytes = Base64.getDecoder().decode(firmaBase64Clean);
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar la imagen de la firma: " + e.getMessage());
                }
            }

            String html = generarHtmlConfirmacion(request);
            byte[] pdfBytes = htmlToPdf(html);

            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path pdfPath = carpetaDocumentos.resolve("FirmaConfirmación" + request.ordenId + ".pdf");
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar el PDF en disco: " + e.getMessage());
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Confirmacion_Firma_" + request.ordenId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping("/conformidad")
    public ResponseEntity<byte[]> firmaConformidad(@RequestBody FirmaRequest request) {
        try {
            String firmaBase64Clean = null;
            if (request.firma != null && request.firma.contains(",")) {
                firmaBase64Clean = request.firma.split(",")[1];
            } else {
                firmaBase64Clean = request.firma;
            }

            if (firmaBase64Clean != null && request.numeroOrden != null) {
                try {
                    byte[] firmaBytes = Base64.getDecoder().decode(firmaBase64Clean);
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path firmaPath = carpetaDocumentos.resolve("FirmaConformidad_" + request.ordenId + ".png");
                    Files.write(firmaPath, firmaBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar la imagen de la firma: " + e.getMessage());
                }
            }

            String html = generarHtmlConformidad(request);
            byte[] pdfBytes = htmlToPdf(html);

            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path pdfPath = carpetaDocumentos.resolve("Conformidad_OT_" + request.ordenId + ".pdf");
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar el PDF en disco: " + e.getMessage());
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Conformidad_OT_" + request.ordenId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping("/recibo")
    public ResponseEntity<byte[]> firmaRecibo(@RequestBody FirmaRequest request) {
        try {
            String firmaBase64Clean = null;
            if (request.firma != null && request.firma.contains(",")) {
                firmaBase64Clean = request.firma.split(",")[1];
            } else {
                firmaBase64Clean = request.firma;
            }

            if (firmaBase64Clean != null && request.numeroOrden != null) {
                try {
                    byte[] firmaBytes = Base64.getDecoder().decode(firmaBase64Clean);
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path firmaPath = carpetaDocumentos.resolve("FirmaRecibo_" + request.ordenId + ".png");
                    Files.write(firmaPath, firmaBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar la imagen de la firma: " + e.getMessage());
                }
            }

            String html = generarHtmlRecibo(request);
            byte[] pdfBytes = htmlToPdf(html);

            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path pdfPath = carpetaDocumentos.resolve("Recibo_OT_" + request.ordenId + ".pdf");
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar el PDF en disco: " + e.getMessage());
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Recibo_OT_" + request.ordenId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    private String generarHtmlConfirmacion(FirmaRequest request) {
        String logoImgTag = cargarLogoBase64();
        String firmaImgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            firmaImgTag = "<img src='" + src + "' alt='Firma' style='max-height: 80px;' />";
        } else {
            firmaImgTag = "<p style='color: #999;'><i>Sin firma digital registrada</i></p>";
        }

        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8' />" +
                "<style>" +
                "@page { size: A4; margin: 2.5cm; }" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }" +
                ".header-table { width: 100%; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 30px; }" +
                ".header-logo { width: 30%; vertical-align: middle; }" +
                ".header-info { width: 70%; text-align: right; vertical-align: middle; }" +
                ".header-info h1 { margin: 0; font-size: 20px; color: #0056b3; text-transform: uppercase; }" +
                ".header-info p { margin: 2px 0; color: #666; font-size: 11px; }" +
                ".section-title { background-color: #f0f4f8; padding: 8px; font-weight: bold; border-left: 4px solid #0056b3; margin-top: 20px; margin-bottom: 10px; font-size: 13px; }" +
                ".info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }" +
                ".info-table td { padding: 6px; border-bottom: 1px solid #eee; }" +
                ".label { font-weight: bold; color: #555; width: 30%; }" +
                ".value { color: #000; }" +
                ".legal-box { border: 1px solid #ddd; background-color: #fafafa; padding: 15px; font-size: 10px; text-align: justify; color: #555; margin-top: 20px; border-radius: 4px; }" +
                ".signature-section { margin-top: 50px; page-break-inside: avoid; }" +
                ".signature-box { width: 250px; margin: 0 auto; text-align: center; }" +
                ".signature-line { border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 11px; }" +
                ".footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<table class='header-table'>" +
                "<tr>" +
                "<td class='header-logo'>" + logoImgTag + "</td>" +
                "<td class='header-info'>" +
                "<h1>Acta de Conformidad</h1>" +
                "<p><b>Orden de Trabajo N°:</b> " + escaparHtml(request.numeroOrden) + "</p>" +
                "<p><b>Fecha de Emisión:</b> " + fechaEmision + "</p>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "<div class='section-title'>Información del Cliente y Equipo</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Cliente:</td><td class='value'>" + escaparHtml(request.cliente) + "</td></tr>" +
                "<tr><td class='label'>Equipo:</td><td class='value'>" + escaparHtml(request.equipo) + "</td></tr>" +
                "<tr><td class='label'>Procedimiento:</td><td class='value'>" + escaparHtml(request.procedimiento) + "</td></tr>" +
                "</table>" +
                "<div class='legal-box'>" +
                "<p><b>CONFORMIDAD CON EL PROCESO</b></p>" +
                "<p>El cliente declara estar conforme con el procedimiento técnico propuesto para la resolución del inconveniente reportado en el equipo y se compromete a permitir que sea realizado. El presente documento sirve como constancia de aceptación y autorización para proceder con el servicio técnico.</p>" +
                "</div>" +
                "<div class='signature-section'>" +
                "<div class='signature-box'>" +
                firmaImgTag +
                "<div class='signature-line'>Firma del Cliente</div>" +
                "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>Documento generado automáticamente por el sistema NewbieSoft - Confidencial</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String generarHtmlConformidad(FirmaRequest request) {
        String logoImgTag = cargarLogoBase64();
        String firmaImgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            firmaImgTag = "<img src='" + src + "' alt='Firma' style='max-height: 80px;' />";
        } else {
            firmaImgTag = "<p style='color: #999;'><i>Sin firma digital registrada</i></p>";
        }

        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8' />" +
                "<style>" +
                "@page { size: A4; margin: 2.5cm; }" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }" +
                ".header-table { width: 100%; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 30px; }" +
                ".header-logo { width: 30%; vertical-align: middle; }" +
                ".header-info { width: 70%; text-align: right; vertical-align: middle; }" +
                ".header-info h1 { margin: 0; font-size: 20px; color: #0056b3; text-transform: uppercase; }" +
                ".header-info p { margin: 2px 0; color: #666; font-size: 11px; }" +
                ".section-title { background-color: #f0f4f8; padding: 8px; font-weight: bold; border-left: 4px solid #0056b3; margin-top: 20px; margin-bottom: 10px; font-size: 13px; }" +
                ".info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }" +
                ".info-table td { padding: 6px; border-bottom: 1px solid #eee; }" +
                ".label { font-weight: bold; color: #555; width: 30%; }" +
                ".value { color: #000; }" +
                ".legal-box { border: 1px solid #ddd; background-color: #f0f8f4; padding: 15px; font-size: 10px; text-align: justify; color: #555; margin-top: 20px; border-radius: 4px; }" +
                ".signature-section { margin-top: 50px; page-break-inside: avoid; }" +
                ".signature-box { width: 250px; margin: 0 auto; text-align: center; }" +
                ".signature-line { border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 11px; }" +
                ".footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<table class='header-table'>" +
                "<tr>" +
                "<td class='header-logo'>" + logoImgTag + "</td>" +
                "<td class='header-info'>" +
                "<h1>Firma de Conformidad</h1>" +
                "<p><b>Orden de Trabajo N°:</b> " + escaparHtml(request.numeroOrden) + "</p>" +
                "<p><b>Fecha de Emisión:</b> " + fechaEmision + "</p>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "<div class='section-title'>Información del Cliente y Equipo</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Cliente:</td><td class='value'>" + escaparHtml(request.cliente) + "</td></tr>" +
                "<tr><td class='label'>Equipo:</td><td class='value'>" + escaparHtml(request.equipo) + "</td></tr>" +
                "<tr><td class='label'>Procedimiento:</td><td class='value'>" + escaparHtml(request.procedimiento) + "</td></tr>" +
                "</table>" +
                "<div class='legal-box'>" +
                "<p><b>CONFORMIDAD CON EL PROCESO</b></p>" +
                "<p>El cliente declara estar conforme con el procedimiento técnico propuesto para la resolución del inconveniente reportado en el equipo y se compromete a permitir que sea realizado. El presente documento sirve como constancia de aceptación y autorización para proceder con el servicio técnico.</p>" +
                "</div>" +
                "<div class='signature-section'>" +
                "<div class='signature-box'>" +
                firmaImgTag +
                "<div class='signature-line'>Firma de Conformidad</div>" +
                "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>Documento generado automáticamente por el sistema NewbieSoft - Confidencial</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String generarHtmlRecibo(FirmaRequest request) {
        String logoImgTag = cargarLogoBase64();
        String firmaImgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            firmaImgTag = "<img src='" + src + "' alt='Firma' style='max-height: 80px;' />";
        } else {
            firmaImgTag = "<p style='color: #999;'><i>Sin firma digital registrada</i></p>";
        }

        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8' />" +
                "<style>" +
                "@page { size: A4; margin: 2.5cm; }" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }" +
                ".header-table { width: 100%; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-bottom: 30px; }" +
                ".header-logo { width: 30%; vertical-align: middle; }" +
                ".header-info { width: 70%; text-align: right; vertical-align: middle; }" +
                ".header-info h1 { margin: 0; font-size: 20px; color: #28a745; text-transform: uppercase; }" +
                ".header-info p { margin: 2px 0; color: #666; font-size: 11px; }" +
                ".section-title { background-color: #f0f8f4; padding: 8px; font-weight: bold; border-left: 4px solid #28a745; margin-top: 20px; margin-bottom: 10px; font-size: 13px; }" +
                ".info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }" +
                ".info-table td { padding: 6px; border-bottom: 1px solid #eee; }" +
                ".label { font-weight: bold; color: #555; width: 30%; }" +
                ".value { color: #000; }" +
                ".legal-box { border: 1px solid #28a745; background-color: #f0f8f4; padding: 15px; font-size: 10px; text-align: justify; color: #555; margin-top: 20px; border-radius: 4px; }" +
                ".signature-section { margin-top: 50px; page-break-inside: avoid; }" +
                ".signature-box { width: 250px; margin: 0 auto; text-align: center; }" +
                ".signature-line { border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 11px; }" +
                ".footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<table class='header-table'>" +
                "<tr>" +
                "<td class='header-logo'>" + logoImgTag + "</td>" +
                "<td class='header-info'>" +
                "<h1>Recibo de Conformidad</h1>" +
                "<p><b>Orden de Trabajo N°:</b> " + escaparHtml(request.numeroOrden) + "</p>" +
                "<p><b>Fecha de Emisión:</b> " + fechaEmision + "</p>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "<div class='section-title'>Información del Servicio Completado</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Cliente:</td><td class='value'>" + escaparHtml(request.cliente) + "</td></tr>" +
                "<tr><td class='label'>Equipo:</td><td class='value'>" + escaparHtml(request.equipo) + "</td></tr>" +
                "<tr><td class='label'>Procedimiento Realizado:</td><td class='value'>" + escaparHtml(request.procedimiento) + "</td></tr>" +
                "</table>" +
                "<div class='legal-box'>" +
                "<p><b>RECIBO DE CONFORMIDAD</b></p>" +
                "<p>El cliente declara haber recibido el equipo en perfecto estado y estar conforme con el servicio técnico realizado. El equipo ha sido reparado/revisado de acuerdo con el procedimiento acordado y se entrega en condiciones de funcionamiento. El presente documento sirve como constancia de conformidad y aceptación del servicio prestado.</p>" +
                "</div>" +
                "<div class='signature-section'>" +
                "<div class='signature-box'>" +
                firmaImgTag +
                "<div class='signature-line'>Firma del Cliente - Recibo Conforme</div>" +
                "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>Documento generado automáticamente por el sistema NewbieSoft - Confidencial</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String cargarLogoBase64() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo.png");
            if (resource.exists()) {
                byte[] imageBytes = resource.getInputStream().readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                return "<img src='data:image/png;base64," + base64 + "' alt='Logo' style='max-height: 60px; max-width: 180px;' />";
            }
        } catch (Exception e) {
            System.err.println("Error cargando logo para PDF: " + e.getMessage());
        }
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
