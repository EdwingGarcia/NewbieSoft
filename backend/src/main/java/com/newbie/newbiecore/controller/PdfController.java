package com.newbie.newbiecore.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    @PostMapping("/ficha")
    public ResponseEntity<byte[]> generarPdfFicha(@RequestBody FichaTecnicaDTO ficha) {
        try {
            String html = generarHtmlFicha(ficha);
            byte[] pdfBytes = htmlToPdf(html);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Ficha_Tecnica.pdf")
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    private String generarHtmlFicha(FichaTecnicaDTO f) {
        String logoTag = cargarLogoBase64();
        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        StringBuilder sb = new StringBuilder();

        // NOTA IMPORTANTE: En el bloque CSS abajo, usamos '%%' en lugar de '%'
        // para evitar el error "UnknownFormatConversionException".
        sb.append("""
            <html>
            <head>
                <meta charset="UTF-8" />
                <style>
                    @page { size: A4; margin: 2.5cm; }
                    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 12px; line-height: 1.4; }
                    
                    /* Header */
                    .header-table { width: 100%%; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 25px; }
                    .header-logo { width: 40%%; vertical-align: middle; }
                    .header-info { width: 60%%; text-align: right; vertical-align: middle; }
                    .header-info h1 { margin: 0; font-size: 22px; color: #0056b3; text-transform: uppercase; }
                    .header-info p { margin: 2px 0; color: #666; font-size: 11px; }
                    
                    /* Títulos de Sección */
                    .section-title { background-color: #f0f4f8; padding: 8px; font-weight: bold; border-left: 4px solid #0056b3; margin-top: 20px; margin-bottom: 15px; font-size: 13px; text-transform: uppercase; }
                    
                    /* Tabla de Datos Dinámicos */
                    .info-table { width: 100%%; border-collapse: collapse; margin-bottom: 20px; }
                    .info-table th { background-color: #0056b3; color: white; padding: 8px; text-align: left; font-size: 11px; width: 35%%; }
                    .info-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; color: #000; }
                    .info-table tr:nth-child(even) td { background-color: #fafafa; }
                    
                    /* Footer */
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
                            <h1>Ficha Técnica</h1>
                            <p>Especificaciones del Equipo</p>
                            <p>Generado el: %s</p>
                        </td>
                    </tr>
                </table>

                <div class="section-title">Detalles del Hardware y Sistema</div>

                <table class="info-table">
                    <thead>
                        <tr>
                            <th>Especificación</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
            """.formatted(logoTag, fechaEmision));

        // 2. Generación Dinámica de Filas (Reflexión)
        Field[] fields = FichaTecnicaDTO.class.getDeclaredFields();

        boolean hayDatos = false;

        for (Field field : fields) {
            try {
                field.setAccessible(true);
                Object val = field.get(f);

                // Filtrar nulos, ceros o cadenas vacías
                if (val == null) continue;
                if (val instanceof Number && ((Number) val).doubleValue() == 0) continue;
                if (val instanceof String && ((String) val).trim().isEmpty()) continue;
                if (field.getName().equalsIgnoreCase("id")) continue;

                String label = formatearLabel(field.getName());
                String value = escaparHtml(String.valueOf(val));

                sb.append("<tr>")
                        .append("<td>").append(escaparHtml(label)).append("</td>")
                        .append("<td>").append(value).append("</td>")
                        .append("</tr>");

                hayDatos = true;

            } catch (Exception ignored) {}
        }

        if (!hayDatos) {
            sb.append("<tr><td colspan='2' style='text-align:center; color:#999;'>No hay datos técnicos registrados para este equipo.</td></tr>");
        }

        // 3. Cierre y Footer
        sb.append("""
                    </tbody>
                </table>

                <div class="footer">
                    Documento generado automáticamente por NewbieCore System.
                </div>
            </body>
            </html>
            """);

        return sb.toString();
    }

    // --- Métodos Auxiliares ---

    private byte[] htmlToPdf(String html) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFastMode();
        builder.withHtmlContent(html, null);
        builder.toStream(baos);
        builder.run();
        return baos.toByteArray();
    }

    private String cargarLogoBase64() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo.png");
            if (resource.exists()) {
                byte[] imageBytes = resource.getInputStream().readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                return "<img src='data:image/png;base64," + base64 + "' alt='Logo' style='max-height: 60px; max-width: 200px;' />";
            }
        } catch (Exception e) {
            System.err.println("No se pudo cargar el logo: " + e.getMessage());
        }
        return "<b>NEWBIE SOFT</b>";
    }

    private String formatearLabel(String key) {
        StringBuilder sb = new StringBuilder();
        for (char c : key.toCharArray()) {
            if (Character.isUpperCase(c)) sb.append(' ');
            sb.append(c);
        }
        String resultado = sb.toString().trim();
        if (resultado.isEmpty()) return "";
        return resultado.substring(0, 1).toUpperCase() + resultado.substring(1);
    }

    private String escaparHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}