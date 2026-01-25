package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.OrdenTrabajo.OrdenTrabajoDetalleDto;
import com.newbie.newbiecore.dto.costos.OrdenTrabajoCostoDto;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Service
public class OrdenTrabajoPdfService {

    /*
     * =========================
     * FORMATEADORES
     * =========================
     */
    private static final DateTimeFormatter FECHA_FMT = DateTimeFormatter
            .ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.systemDefault());

    /*
     * =========================
     * MÉTODO PRINCIPAL
     * =========================
     */
    public byte[] generarPdfOrden(OrdenTrabajoDetalleDto dto) {
        try {
            String html = generarHtmlOrdenTrabajo(dto);
            return htmlToPdf(html);
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF de Orden de Trabajo", e);
        }
    }

    /*
     * =========================
     * HTML PROFESIONAL OT
     * =========================
     */
    private String generarHtmlOrdenTrabajo(OrdenTrabajoDetalleDto dto) {

        String logoImgTag = cargarLogoBase64Grande();
        String fechaIngreso = formatearFecha(dto.fechaHoraIngreso());

        String ordenNumero = safe(dto.numeroOrden());

        // Cliente completo
        String clienteNombre = safe(dto.clienteNombre());
        String clienteCedula = safe(dto.clienteCedula());
        String clienteTelefono = safe(dto.clienteTelefono());
        String clienteCorreo = safe(dto.clienteCorreo());

        // Técnico completo
        String tecnicoNombre = safe(dto.tecnicoNombre());
        String tecnicoCedula = safe(dto.tecnicoCedula());

        String medioContacto = safe(dto.medioContacto());
        String tipoServicio = safe(dto.tipoServicio());
        String prioridad = safe(dto.prioridad());

        String problema = safe(dto.problemaReportado());
        String obsIngreso = safe(dto.observacionesIngreso());

        String eqTipo = safe(dto.tipoEquipo());
        String eqMarca = safe(dto.marca());
        String eqModelo = safe(dto.modelo());
        String eqSerie = safe(dto.numeroSerie());
        String eqHostname = safe(dto.hostname());
        String eqSO = safe(dto.sistemaOperativo());

        // Fichas técnicas anexas
        String fichasAnexas = (dto.fichaId() != null)
                ? ("Ficha #" + dto.fichaId())
                : "No registra";

        String diagnostico = safe(dto.diagnosticoTrabajo());
        String recomendaciones = safe(dto.observacionesRecomendaciones());

        String subtotal = money(dto.subtotal());
        String iva = money(dto.iva());
        String total = money(dto.total());

        String motivoCierre = safe(dto.motivoCierre());

        // Colores morados del sistema
        String colorPrimario = "#7c3aed";
        String colorPrimarioClaro = "#ede9fe";
        String colorPrimarioOscuro = "#5b21b6";

        return """
                <html>
                <head>
                    <meta charset="utf-8"/>
                    <style>
                        @page { size: A4; margin: 1.5cm; }
                        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.4; font-size: 10px; }

                        .header-table { width: 100%%; border-bottom: 3px solid %s; padding-bottom: 10px; margin-bottom: 15px; }
                        .header-logo { width: 35%%; vertical-align: middle; }
                        .header-info { width: 65%%; text-align: right; vertical-align: middle; }
                        .header-info h1 { margin: 0; font-size: 18px; color: %s; text-transform: uppercase; }
                        .header-info p { margin: 2px 0; color: #666; font-size: 10px; }

                        .order-number { font-size: 12px; color: %s; font-weight: bold; }

                        .section-title {
                            background-color: %s;
                            padding: 6px 10px;
                            font-weight: bold;
                            border-left: 4px solid %s;
                            margin-top: 12px;
                            margin-bottom: 8px;
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: .3px;
                            color: %s;
                        }

                        .info-table { width: 100%%; border-collapse: collapse; margin-bottom: 8px; }
                        .info-table td { padding: 4px 6px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 10px; }
                        .label { font-weight: bold; color: #555; width: 22%%; background-color: #fafafa; }
                        .value { color: #000; }

                        .two-col { display: table; width: 100%%; }
                        .two-col > div { display: table-cell; width: 50%%; vertical-align: top; padding-right: 8px; }
                        .two-col > div:last-child { padding-right: 0; padding-left: 8px; }

                        .text-block {
                            border: 1px solid #eee;
                            background: #fafafa;
                            padding: 8px;
                            border-radius: 4px;
                            margin-bottom: 8px;
                            white-space: pre-wrap;
                            font-size: 9px;
                            max-height: 60px;
                            overflow: hidden;
                        }

                        .costs-table { width: 100%%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; }
                        .costs-table th { background-color: %s; color: %s; padding: 5px; text-align: left; }
                        .costs-table td { padding: 4px; border-bottom: 1px solid #eee; }
                        .costs-table .total-row td { font-weight: bold; border-top: 2px solid %s; }

                        .footer {
                            text-align: center;
                            font-size: 8px;
                            color: #888;
                            border-top: 1px solid #ddd;
                            padding-top: 8px;
                            margin-top: 15px;
                        }
                    </style>
                </head>

                <body>

                    <!-- HEADER -->
                    <table class="header-table">
                        <tr>
                            <td class="header-logo">
                                %s
                            </td>
                            <td class="header-info">
                                <h1>Orden de Trabajo</h1>
                                <p class="order-number">OT N°: %s</p>
                                <p><b>Fecha de Ingreso:</b> %s</p>
                            </td>
                        </tr>
                    </table>

                    <!-- CLIENTE Y TÉCNICO EN DOS COLUMNAS -->
                    <div class="two-col">
                        <div>
                            <div class="section-title">Cliente</div>
                            <table class="info-table">
                                <tr><td class="label">Nombre:</td><td class="value">%s</td></tr>
                                <tr><td class="label">Cédula:</td><td class="value">%s</td></tr>
                                <tr><td class="label">Teléfono:</td><td class="value">%s</td></tr>
                                <tr><td class="label">Correo:</td><td class="value">%s</td></tr>
                            </table>
                        </div>
                        <div>
                            <div class="section-title">Técnico Encargado</div>
                            <table class="info-table">
                                <tr><td class="label">Nombre:</td><td class="value">%s</td></tr>
                                <tr><td class="label">Cédula:</td><td class="value">%s</td></tr>
                            </table>
                        </div>
                    </div>

                    <!-- DATOS DE INGRESO -->
                    <div class="section-title">Datos de Ingreso</div>
                    <table class="info-table">
                        <tr>
                            <td class="label" style="width:15%%">Medio contacto:</td>
                            <td class="value" style="width:35%%">%s</td>
                            <td class="label" style="width:15%%">Tipo servicio:</td>
                            <td class="value" style="width:15%%">%s</td>
                            <td class="label" style="width:10%%">Prioridad:</td>
                            <td class="value" style="width:10%%">%s</td>
                        </tr>
                    </table>

                    <!-- EQUIPO -->
                    <div class="section-title">Equipo</div>
                    <table class="info-table">
                        <tr>
                            <td class="label">Tipo:</td><td class="value">%s</td>
                            <td class="label">Marca:</td><td class="value">%s</td>
                            <td class="label">Modelo:</td><td class="value">%s</td>
                        </tr>
                        <tr>
                            <td class="label">N° Serie:</td><td class="value"><b>%s</b></td>
                            <td class="label">Hostname:</td><td class="value">%s</td>
                            <td class="label">S.O.:</td><td class="value">%s</td>
                        </tr>
                    </table>

                    <!-- PROBLEMA Y OBSERVACIONES -->
                    <div class="two-col">
                        <div>
                            <div class="section-title">Problema Reportado</div>
                            <div class="text-block">%s</div>
                        </div>
                        <div>
                            <div class="section-title">Observaciones Ingreso</div>
                            <div class="text-block">%s</div>
                        </div>
                    </div>

                    <!-- FICHAS ANEXAS -->
                    <div class="section-title">Fichas Técnicas Anexas</div>
                    <div class="text-block" style="max-height: 30px;">%s</div>

                    <!-- DIAGNOSTICO Y RECOMENDACIONES -->
                    <div class="two-col">
                        <div>
                            <div class="section-title">Diagnóstico / Trabajo Realizado</div>
                            <div class="text-block">%s</div>
                        </div>
                        <div>
                            <div class="section-title">Observaciones / Recomendaciones</div>
                            <div class="text-block">%s</div>
                        </div>
                    </div>

                    <!-- COSTOS -->
                    <div class="section-title">Costos</div>
                    <table class="costs-table">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th style="text-align:center;">Cant.</th>
                                <th>Unitario</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            %s
                            <tr><td colspan="4" style="text-align:right;">Subtotal:</td><td>$ %s</td></tr>
                            <tr><td colspan="4" style="text-align:right;">IVA:</td><td>$ %s</td></tr>
                            <tr class="total-row"><td colspan="4" style="text-align:right;">TOTAL:</td><td>$ %s</td></tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        Documento generado electrónicamente por NewbieSoft - Sistema de Gestión de Servicio Técnico
                    </div>

                </body>
                </html>
                """
                .formatted(
                        colorPrimario, colorPrimario, colorPrimarioOscuro,
                        colorPrimarioClaro, colorPrimario, colorPrimarioOscuro,
                        colorPrimarioClaro, colorPrimarioOscuro, colorPrimario,
                        logoImgTag,
                        escaparHtml(ordenNumero),
                        escaparHtml(fechaIngreso),
                        escaparHtml(clienteNombre),
                        escaparHtml(clienteCedula),
                        escaparHtml(clienteTelefono),
                        escaparHtml(clienteCorreo),
                        escaparHtml(tecnicoNombre),
                        escaparHtml(tecnicoCedula),
                        escaparHtml(medioContacto),
                        escaparHtml(tipoServicio),
                        escaparHtml(prioridad),
                        escaparHtml(eqTipo),
                        escaparHtml(eqMarca),
                        escaparHtml(eqModelo),
                        escaparHtml(eqSerie),
                        escaparHtml(eqHostname),
                        escaparHtml(eqSO),
                        escaparHtml(problema),
                        escaparHtml(obsIngreso),
                        escaparHtml(fichasAnexas),
                        escaparHtml(diagnostico),
                        escaparHtml(recomendaciones),
                        generarFilasCostos(dto.costos()),
                        escaparHtml(subtotal),
                        escaparHtml(iva),
                        escaparHtml(total));
    }

    /*
     * =========================
     * LOGO BASE64 GRANDE
     * =========================
     */
    private String cargarLogoBase64Grande() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo.png");
            if (resource.exists()) {
                byte[] imageBytes = resource.getInputStream().readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                return "<img src='data:image/png;base64," + base64
                        + "' alt='Logo' style='max-height: 120px; max-width: 280px;' />";
            }
        } catch (Exception e) {
            System.err.println("Error cargando logo para PDF: " + e.getMessage());
        }
        return "<div style='font-size: 28px; font-weight: bold; color: #7c3aed;'>NEWBIE SOFT</div>";
    }

    /*
     * =========================
     * LOGO BASE64 (resources)
     * =========================
     */
    private String cargarLogoBase64() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo.png");
            if (resource.exists()) {
                byte[] imageBytes = resource.getInputStream().readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                return "<img src='data:image/png;base64," + base64
                        + "' alt='Logo' style='max-height: 60px; max-width: 180px;' />";
            }
        } catch (Exception e) {
            System.err.println("Error cargando logo para PDF: " + e.getMessage());
        }
        return "<b>NEWBIESOFT</b>";
    }

    /*
     * =========================
     * HTML -> PDF (OpenHTMLtoPDF)
     * =========================
     */
    private byte[] htmlToPdf(String html) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(baos);
            builder.run();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IOException("Error al renderizar HTML a PDF", e);
        }
    }

    /*
     * =========================
     * HELPERS
     * =========================
     */
    private String escaparHtml(String s) {
        if (s == null)
            return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String safe(String s) {
        return (s == null || s.isBlank()) ? "---" : s;
    }

    private String formatearFecha(Instant instant) {
        if (instant == null)
            return "---";
        return FECHA_FMT.format(instant);
    }

    private String money(BigDecimal v) {
        if (v == null)
            return "---";
        // Si quieres prefijo $, cámbialo aquí:
        return v
                .setScale(2, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private String generarFilasCostos(List<OrdenTrabajoCostoDto> costos) {

        if (costos == null || costos.isEmpty()) {
            return "<tr><td colspan='5'>No se registraron costos</td></tr>";
        }

        return costos.stream()
                .map(c -> """
                            <tr>
                                <td>%s</td>
                                <td>%s</td>
                                <td style="text-align:center;">%d</td>
                                <td>$ %s</td>
                                <td>$ %s</td>
                            </tr>
                        """.formatted(
                        escaparHtml(c.tipo()),
                        escaparHtml(c.descripcion()),
                        c.cantidad(),
                        c.costoUnitario(),
                        c.subtotal()))
                .reduce("", String::concat);
    }

}
