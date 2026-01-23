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

    /* =========================
       FORMATEADORES
    ========================= */
    private static final DateTimeFormatter FECHA_FMT = DateTimeFormatter
            .ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.systemDefault());

    /* =========================
       MÉTODO PRINCIPAL
    ========================= */
    public byte[] generarPdfOrden(OrdenTrabajoDetalleDto dto) {
        try {
            String html = generarHtmlOrdenTrabajo(dto);
            return htmlToPdf(html);
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF de Orden de Trabajo", e);
        }
    }

    /* =========================
       HTML PROFESIONAL OT
    ========================= */
    private String generarHtmlOrdenTrabajo(OrdenTrabajoDetalleDto dto) {

        String logoImgTag = cargarLogoBase64();
        String fechaIngreso = formatearFecha(dto.fechaHoraIngreso());

        String ordenNumero = safe(dto.numeroOrden());
        String cliente = safe(dto.clienteNombre());
        String tecnico = safe(dto.tecnicoNombre());

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

        // Fichas técnicas anexas: por ahora tu DTO trae un solo identificador (fichaId).
        // Si luego manejas múltiples fichas, aquí lo cambiamos a lista.
        String fichasAnexas = (dto.fichaId() != null)
                ? ("Ficha #" + dto.fichaId())
                : "No registra";

        String diagnostico = safe(dto.diagnosticoTrabajo());
        String recomendaciones = safe(dto.observacionesRecomendaciones());
;
        String subtotal = money(dto.subtotal());
        String iva = money(dto.iva());
        String total = money(dto.total());

        String motivoCierre = safe(dto.motivoCierre());

        return """
            <html>
            <head>
                <meta charset="utf-8"/>
                <style>
                    @page { size: A4; margin: 2.2cm; }
                    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.45; font-size: 12px; }

                    .header-table { width: 100%%; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 22px; }
                    .header-logo { width: 30%%; vertical-align: middle; }
                    .header-info { width: 70%%; text-align: right; vertical-align: middle; }
                    .header-info h1 { margin: 0; font-size: 20px; color: #0056b3; text-transform: uppercase; }
                    .header-info p { margin: 2px 0; color: #666; font-size: 11px; }

                    .order-number { font-size: 12px; color: #111; }

                    .section-title {
                        background-color: #f0f4f8;
                        padding: 8px;
                        font-weight: bold;
                        border-left: 4px solid #0056b3;
                        margin-top: 18px;
                        margin-bottom: 10px;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: .3px;
                    }

                    .info-table { width: 100%%; border-collapse: collapse; margin-bottom: 12px; }
                    .info-table td { padding: 6px; border-bottom: 1px solid #eee; vertical-align: top; }
                    .label { font-weight: bold; color: #555; width: 30%%; }
                    .value { color: #000; }

                    .text-block {
                        border: 1px solid #eee;
                        background: #fafafa;
                        padding: 10px 12px;
                        border-radius: 4px;
                        margin-bottom: 10px;
                        white-space: pre-wrap;
                    }

                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 9px;
                        color: #999;
                        border-top: 1px solid #eee;
                        padding-top: 8px;
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
                            <p class="order-number"><b># ORDEN DE TRABAJO:</b> %s</p>
                            <p><b>Fecha de Ingreso:</b> %s</p>
                        </td>
                    </tr>
                </table>

                <!-- DATOS GENERALES -->
                <div class="section-title">Datos generales</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Cliente:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Técnico:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>

                <!-- DATOS DE INGRESO -->
                <div class="section-title">Datos de ingreso</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Medio de contacto:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Tipo de servicio:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Prioridad:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>

                <!-- PROBLEMA -->
                <div class="section-title">Problema reportado</div>
                <div class="text-block">%s</div>

                <!-- OBSERVACIONES INGRESO -->
                <div class="section-title">Observaciones (Ingreso)</div>
                <div class="text-block">%s</div>

                <!-- EQUIPO -->
                <div class="section-title">Equipo</div>
                <table class="info-table">
                    <tr><td class="label">Tipo:</td><td class="value">%s</td></tr>
                    <tr><td class="label">Marca:</td><td class="value">%s</td></tr>
                    <tr><td class="label">Modelo:</td><td class="value">%s</td></tr>
                    <tr><td class="label">Número de serie:</td><td class="value">%s</td></tr>
                    <tr><td class="label">Hostname:</td><td class="value">%s</td></tr>
                    <tr><td class="label">Sistema operativo:</td><td class="value">%s</td></tr>
                </table>

                <!-- FICHAS -->
                <div class="section-title">Fichas técnicas anexas</div>
                <div class="text-block">%s</div>

                <!-- DIAGNOSTICO -->
                <div class="section-title">Diagnóstico / trabajo realizado</div>
                <div class="text-block">%s</div>

                <!-- RECOMENDACIONES -->
                <div class="section-title">Observaciones / recomendaciones</div>
                <div class="text-block">%s</div>

                <!-- COSTOS -->
                <div class="section-title">Costos</div>

                <table class="info-table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        %s
                       <tr><td colspan="4">Subtotal:</td><td>$ %s</td></tr>
                       <tr><td colspan="4">IVA:</td><td>$ %s</td></tr>
                      <tr><td colspan="4"><b>Total:</b></td><td><b>$ %s</b></td></tr>
                    </tbody>
                </table>

                <!-- MOTIVO CIERRE -->
                <div class="section-title">Motivo de cierre</div>
                <div class="text-block">%s</div>

                <div class="footer">
                    Documento generado electrónicamente por NewbieSoft.
                </div>

            </body>
            </html>
            """.formatted(
                logoImgTag,
                escaparHtml(ordenNumero),
                escaparHtml(fechaIngreso),
                escaparHtml(cliente),
                escaparHtml(tecnico),
                escaparHtml(medioContacto),
                escaparHtml(tipoServicio),
                escaparHtml(prioridad),
                escaparHtml(problema),
                escaparHtml(obsIngreso),
                escaparHtml(eqTipo),
                escaparHtml(eqMarca),
                escaparHtml(eqModelo),
                escaparHtml(eqSerie),
                escaparHtml(eqHostname),
                escaparHtml(eqSO),
                escaparHtml(fichasAnexas),
                escaparHtml(diagnostico),
                escaparHtml(recomendaciones),
                generarFilasCostos(dto.costos()),
                escaparHtml(subtotal),
                escaparHtml(iva),
                escaparHtml(total),
                escaparHtml(motivoCierre)
            );
    }

    /* =========================
       LOGO BASE64 (resources)
    ========================= */
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
        return "<b>NEWBIESOFT</b>";
    }

    /* =========================
       HTML -> PDF (OpenHTMLtoPDF)
    ========================= */
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

    /* =========================
       HELPERS
    ========================= */
    private String escaparHtml(String s) {
        if (s == null) return "";
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
        if (instant == null) return "---";
        return FECHA_FMT.format(instant);
    }

    private String money(BigDecimal v) {
        if (v == null) return "---";
        // Si quieres prefijo $, cámbialo aquí:
        return  v
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
                    c.subtotal()
            ))
            .reduce("", String::concat);
}

}
