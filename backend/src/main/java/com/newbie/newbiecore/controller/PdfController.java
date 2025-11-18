package com.newbie.newbiecore.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

	@PostMapping("/ficha")
	public ResponseEntity<byte[]> generarPdfFicha(@RequestBody FichaTecnicaDTO ficha) {

	    try {
	        String html = generarHtmlFicha(ficha); // Tu método actual

	        byte[] pdfBytes = htmlToPdf(html);

	        return ResponseEntity.ok()
	                .contentType(MediaType.APPLICATION_PDF)
	                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ficha.pdf")
	                .body(pdfBytes);

	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.internalServerError()
	                .body(("Error al generar PDF: " + e.getMessage()).getBytes());
	    }
	}

	private String generarHtmlFicha(FichaTecnicaDTO f) {
	    StringBuilder sb = new StringBuilder();

	    sb.append("""
	        <html>
	        <head>
	            <meta charset="UTF-8" />
	            <style>
	                body {
	                    font-family: Arial, sans-serif;
	                    margin: 30px;
	                    color: #1a1a1a;
	                }

	                .header {
	                    text-align: center;
	                    border-bottom: 3px solid #0A6EBD;
	                    padding-bottom: 15px;
	                    margin-bottom: 20px;
	                }

	                .header h1 {
	                    margin: 0;
	                    font-size: 28px;
	                    color: #0A6EBD;
	                    font-weight: bold;
	                }

	                .header h3 {
	                    margin: 5px 0 0 0;
	                    font-size: 16px;
	                    color: #555;
	                    font-weight: normal;
	                }

	                table {
	                    width: 100%;
	                    border-collapse: collapse;
	                    margin-top: 10px;
	                }

	                th {
	                    background: #0A6EBD;
	                    color: white;
	                    padding: 10px;
	                    font-size: 14px;
	                    text-align: left;
	                }

	                td {
	                    padding: 8px;
	                    border-bottom: 1px solid #ccc;
	                    font-size: 13px;
	                }

	                tr:nth-child(even) td {
	                    background: #f6f9fc;
	                }

	                .label {
	                    font-weight: bold;
	                    color: #0A6EBD;
	                }
	            </style>
	        </head>

	        <body>

	            <div class="header">
	                <h1>Ficha Técnica del Equipo</h1>
	                <h3>Servicio Técnico • Newbie SAS</h3>
	            </div>

	            <table>
	                <tr>
	                    <th>Campo</th>
	                    <th>Valor</th>
	                </tr>
	        """);

	    // ==== GENERACIÓN DINÁMICA DE FILAS ====
	    Field[] fields = FichaTecnicaDTO.class.getDeclaredFields();

	    for (Field field : fields) {
	        try {
	            field.setAccessible(true);
	            Object val = field.get(f);

	            if (val == null) continue;
	            if (val instanceof Number && ((Number) val).doubleValue() == 0) continue;

	            String label = escaparHtml(formatearLabel(field.getName()));
	            String value = escaparHtml(String.valueOf(val));

	            sb.append("<tr>")
	              .append("<td class='label'>").append(label).append("</td>")
	              .append("<td>").append(value).append("</td>")
	              .append("</tr>");

	        } catch (Exception ignored) {}
	    }

	    sb.append("""
	            </table>
	        </body>
	        </html>
	        """);

	    return sb.toString();
	}


    private byte[] htmlToPdf(String html) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        com.openhtmltopdf.pdfboxout.PdfRendererBuilder builder = 
            new com.openhtmltopdf.pdfboxout.PdfRendererBuilder();

        builder.withHtmlContent(html, null);
        builder.toStream(baos);
        builder.run();

        return baos.toByteArray();
    }
    private String formatearLabel(String key) {
        StringBuilder sb = new StringBuilder();
        for (char c : key.toCharArray()) {
            if (Character.isUpperCase(c)) sb.append(' ');
            sb.append(c);
        }
        String resultado = sb.toString().trim();
        return resultado.substring(0,1).toUpperCase() + resultado.substring(1);
    }

    private String escaparHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

}
