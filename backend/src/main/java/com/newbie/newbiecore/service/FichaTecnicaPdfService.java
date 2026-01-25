package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

/**
 * Servicio para generar y guardar PDF de Ficha Técnica.
 * Extraído de PdfController para poder ser llamado desde FichaTecnicaService.
 */
@Service
public class FichaTecnicaPdfService {

    @Value("${app.upload-dir}")
    private String baseUploadDir;

    /**
     * Genera el PDF de la ficha técnica y lo guarda en el servidor.
     * 
     * @param ficha       DTO de la ficha técnica
     * @param numeroOrden Número de orden de trabajo (para la ruta)
     * @return true si se generó correctamente, false en caso de error
     */
    public boolean generarYGuardarPdf(FichaTecnicaDTO ficha, String numeroOrden) {
        try {
            ficha.setNumeroOrden(numeroOrden);
            String html = generarHtmlFicha(ficha);
            byte[] pdfBytes = htmlToPdf(html);

            Path carpetaDocumentos = Path.of(baseUploadDir, numeroOrden, "documentos");
            Files.createDirectories(carpetaDocumentos);
            Path pdfPath = carpetaDocumentos.resolve("Ficha_Tecnica_" + ficha.getId() + ".pdf");
            Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            System.out.println("✅ PDF de Ficha Técnica generado: " + pdfPath);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Error al generar PDF de ficha técnica: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String generarHtmlFicha(FichaTecnicaDTO f) {
        String logoTag = cargarLogoBase64();
        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String numeroOrdenStr = (f.getNumeroOrden() != null) ? f.getNumeroOrden() : "-";

        StringBuilder sb = new StringBuilder();

        sb.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\" />");
        sb.append("<style>");
        sb.append("@page { size: A4; margin: 0.6cm; }");
        sb.append(
                "body { font-family: Arial, sans-serif; color: #000000 !important; font-size: 8px; line-height: 1.3; }");
        sb.append(
                ".header { width: 94%; margin: 0 auto 10px; border-bottom: 3px solid #7c3aed; padding-bottom: 8px; }");
        sb.append(".header h1 { color: #000000 !important; font-size: 13px; margin: 0; }");
        sb.append(
                ".section-title { width: 94%; margin: 8px auto 4px; background-color: #7c3aed; color: #ffffff !important; padding: 4px 6px; font-size: 8px; font-weight: bold; text-transform: uppercase; }");
        sb.append("table { width: 94% !important; margin: 0 auto 6px !important; border-collapse: collapse; }");
        sb.append("td { padding: 3px 5px; border: 1px solid #ddd; color: #000000 !important; font-size: 7px; }");
        sb.append("td:first-child { background-color: #e5e5e5; font-weight: bold; width: 32%; }");
        sb.append("td:last-child { background-color: #ffffff; width: 68%; }");
        sb.append(
                ".obs-box { background-color: #f5f5f5; padding: 5px; margin: 0 auto 6px; width: 94%; border-left: 3px solid #7c3aed; color: #000000; font-size: 7px; }");
        sb.append(
                ".footer { text-align: center; font-size: 7px; color: #666; margin-top: 10px; padding-top: 5px; border-top: 1px solid #ddd; }");
        sb.append("</style></head><body>");

        // HEADER
        sb.append("<div class='header'>");
        sb.append("<h1>FICHA TÉCNICA COMPLETA DEL EQUIPO</h1>");
        sb.append("<p style='margin: 3px 0; color: #000000; font-size: 8px;'>Generada: ").append(fechaEmision)
                .append(" | Orden: ").append(numeroOrdenStr).append(" | ID Ficha: ").append(f.getId()).append("</p>");
        sb.append("</div>");

        // IDENTIFICACIÓN DEL EQUIPO
        sb.append("<div class='section-title'>IDENTIFICACIÓN DEL EQUIPO</div>");
        sb.append("<table>");
        agregarFila(sb, "Marca", f.getEquipoMarca());
        agregarFila(sb, "Modelo", f.getEquipoModelo());
        agregarFila(sb, "Número de Serie", f.getEquipoSerie());
        agregarFila(sb, "Nombre del Equipo", f.getEquipoNombre());
        agregarFila(sb, "Otros Datos", f.getEquipoOtros());
        agregarFila(sb, "Roturas", f.getEquipoRoturas());
        agregarFila(sb, "Marcas de Desgaste", f.getEquipoMarcasDesgaste());
        sb.append("</table>");

        // CARCASA
        sb.append("<div class='section-title'>CARCASA</div>");
        sb.append("<table>");
        agregarFila(sb, "Estado", f.getCarcasaEstado());
        agregarFilaBool(sb, "Tornillos Faltantes", f.getTornillosFaltantes());
        agregarFila(sb, "Observaciones", f.getCarcasaObservaciones());
        sb.append("</table>");

        // PROCESADOR (CPU)
        sb.append("<div class='section-title'>PROCESADOR (CPU)</div>");
        sb.append("<table>");
        agregarFila(sb, "Nombre CPU", f.getCpuNombre());
        agregarFila(sb, "Marca (Ficha)", f.getProcesadorMarca());
        agregarFila(sb, "Modelo (Ficha)", f.getProcesadorModelo());
        agregarFila(sb, "Núcleos Físicos", f.getCpuNucleos());
        agregarFila(sb, "Procesadores Lógicos", f.getCpuLogicos());
        agregarFila(sb, "Paquetes Físicos", f.getCpuPaquetesFisicos());
        agregarFila(sb, "Frecuencia (MHz)", f.getCpuFrecuenciaOriginalMhz());
        sb.append("</table>");

        // MEMORIA RAM
        sb.append("<div class='section-title'>MEMORIA RAM</div>");
        sb.append("<table>");
        agregarFila(sb, "Capacidad (GB)", f.getRamCapacidadGb());
        agregarFila(sb, "Frecuencia (MHz)", f.getRamFrecuenciaMhz());
        agregarFila(sb, "Tipo", f.getRamTipo());
        agregarFila(sb, "Tecnología Módulo", f.getRamTecnologiaModulo());
        agregarFila(sb, "Número Módulo", f.getRamNumeroModulo());
        agregarFila(sb, "Serie Módulo", f.getRamSerieModulo());
        agregarFila(sb, "Fecha Fabricación", f.getRamFechaFabricacion());
        agregarFila(sb, "Lugar Fabricación", f.getRamLugarFabricacion());
        agregarFila(sb, "Tipo Equipo (Ficha)", f.getRamTipoEquipo());
        agregarFila(sb, "Cantidad Módulos (Ficha)", f.getRamCantidadModulos());
        agregarFila(sb, "Marca (Ficha)", f.getRamMarcaFicha());
        agregarFila(sb, "Tecnología (Ficha)", f.getRamTecnologiaFicha());
        agregarFila(sb, "Capacidad (Ficha)", f.getRamCapacidadFicha());
        agregarFila(sb, "Frecuencia (Ficha)", f.getRamFrecuenciaFicha());
        agregarFila(sb, "Observaciones RAM", f.getRamObservacionesFicha());
        sb.append("</table>");

        // ALMACENAMIENTO (DISCO)
        sb.append("<div class='section-title'>ALMACENAMIENTO (DISCO)</div>");
        sb.append("<table>");
        agregarFila(sb, "Modelo", f.getDiscoModelo());
        agregarFila(sb, "Tipo", f.getDiscoTipo());
        agregarFila(sb, "Capacidad", f.getDiscoCapacidadStr());
        agregarFila(sb, "Capacidad (MB)", f.getDiscoCapacidadMb());
        agregarFila(sb, "Número de Serie", f.getDiscoNumeroSerie());
        agregarFila(sb, "RPM", f.getDiscoRpm());
        agregarFila(sb, "Letras de Unidad", f.getDiscoLetras());
        agregarFila(sb, "WWN", f.getDiscoWwn());
        agregarFila(sb, "Temperatura", f.getDiscoTemperatura());
        agregarFila(sb, "Horas Encendido", f.getDiscoHorasEncendido());
        agregarFila(sb, "Sectores Reasignados", f.getDiscoSectoresReasignados());
        agregarFila(sb, "Sectores Pendientes", f.getDiscoSectoresPendientes());
        agregarFila(sb, "Errores de Lectura", f.getDiscoErroresLectura());
        agregarFila(sb, "Errores CRC", f.getDiscoErrorCrc());
        agregarFila(sb, "Estado (Ficha)", f.getDiscoEstado());
        agregarFila(sb, "Tipo (Ficha)", f.getDiscoTipoFicha());
        agregarFila(sb, "Marca (Ficha)", f.getDiscoMarcaFicha());
        agregarFila(sb, "Capacidad (Ficha)", f.getDiscoCapacidadFicha());
        agregarFila(sb, "Serie (Ficha)", f.getDiscoSerieFicha());
        agregarFila(sb, "Observaciones Disco", f.getDiscoObservacionesFicha());
        sb.append("</table>");

        // PLACA BASE (MAINBOARD)
        sb.append("<div class='section-title'>PLACA BASE (MAINBOARD)</div>");
        sb.append("<table>");
        agregarFila(sb, "Modelo Mainboard", f.getMainboardModelo());
        agregarFila(sb, "Modelo (Ficha)", f.getMainboardModeloFicha());
        agregarFila(sb, "Chipset", f.getChipset());
        agregarFila(sb, "Observaciones", f.getMainboardObservaciones());
        sb.append("</table>");

        // GPU
        sb.append("<div class='section-title'>TARJETA GRÁFICA (GPU)</div>");
        sb.append("<table>");
        agregarFila(sb, "GPU", f.getGpuNombre());
        agregarFila(sb, "Tipo Gráfica", f.getGraficaTipo());
        sb.append("</table>");

        // BIOS / UEFI
        sb.append("<div class='section-title'>BIOS / UEFI</div>");
        sb.append("<table>");
        agregarFila(sb, "Fabricante BIOS", f.getBiosFabricante());
        agregarFila(sb, "Versión BIOS", f.getBiosVersion());
        agregarFila(sb, "Fecha BIOS", f.getBiosFechaStr());
        agregarFilaBool(sb, "Es UEFI Capaz", f.getBiosEsUefiCapaz());
        agregarFilaBool(sb, "Arranque UEFI Presente", f.getArranqueUefiPresente());
        agregarFilaBool(sb, "Secure Boot Activo", f.getSecureBootActivo());
        agregarFila(sb, "Tipo Arranque", f.getBiosTipoArranque());
        agregarFilaBool(sb, "Contraseña BIOS", f.getBiosContrasena());
        agregarFilaBool(sb, "Secure Boot (Ficha)", f.getBiosSecureBoot());
        agregarFila(sb, "Observaciones BIOS", f.getBiosObservacionesFicha());
        sb.append("</table>");

        // SISTEMA OPERATIVO
        sb.append("<div class='section-title'>SISTEMA OPERATIVO</div>");
        sb.append("<table>");
        agregarFila(sb, "Descripción", f.getSoDescripcion());
        agregarFila(sb, "Proveedor", f.getSoProveedor());
        agregarFila(sb, "Tipo", f.getSoTipo());
        agregarFila(sb, "Versión", f.getSoVersion());
        agregarFilaBool(sb, "Licencia Activa", f.getSoLicenciaActiva());
        sb.append("</table>");

        // SEGURIDAD
        sb.append("<div class='section-title'>SEGURIDAD</div>");
        sb.append("<table>");
        agregarFilaBool(sb, "TPM Presente", f.getTpmPresente());
        agregarFila(sb, "Versión TPM", f.getTpmVersion());
        agregarFila(sb, "Estado HVCI", f.getHvciEstado());
        agregarFila(sb, "Marca Antivirus", f.getAntivirusMarca());
        agregarFilaBool(sb, "Licencia Antivirus Activa", f.getAntivirusLicenciaActiva());
        agregarFila(sb, "Observaciones Antivirus", f.getAntivirusObservaciones());
        sb.append("</table>");

        // RED Y CONECTIVIDAD
        sb.append("<div class='section-title'>RED Y CONECTIVIDAD</div>");
        sb.append("<table>");
        agregarFila(sb, "Adaptador Red", f.getAdaptadorRed());
        agregarFila(sb, "Dirección MAC", f.getMacAddress());
        agregarFila(sb, "Velocidad WiFi Actual", f.getWifiLinkSpeedActual());
        agregarFila(sb, "Velocidad WiFi Máxima", f.getWifiLinkSpeedMax());
        agregarFilaBool(sb, "WiFi Funciona", f.getWifiFunciona());
        agregarFila(sb, "Observaciones WiFi", f.getWifiObservaciones());
        sb.append("</table>");

        // PANTALLA / MONITOR
        sb.append("<div class='section-title'>PANTALLA / MONITOR</div>");
        sb.append("<table>");
        agregarFila(sb, "Monitor Nombre", f.getMonitorNombre());
        agregarFila(sb, "Modelo Monitor", f.getMonitorModelo());
        agregarFilaBool(sb, "Rayones", f.getPantallaRayones());
        agregarFilaBool(sb, "Trizaduras", f.getPantallaTrizaduras());
        agregarFilaBool(sb, "Píxeles Muertos", f.getPantallaPixelesMuertos());
        agregarFilaBool(sb, "Manchas", f.getPantallaManchas());
        agregarFilaBool(sb, "Táctil", f.getPantallaTactil());
        agregarFila(sb, "Observaciones Pantalla", f.getPantallaObservaciones());
        sb.append("</table>");

        // AUDIO
        sb.append("<div class='section-title'>AUDIO</div>");
        sb.append("<table>");
        agregarFila(sb, "Adaptador", f.getAudioAdaptador());
        agregarFila(sb, "Codec", f.getAudioCodec());
        agregarFila(sb, "Hardware ID", f.getAudioHardwareId());
        sb.append("</table>");

        // TECLADO
        sb.append("<div class='section-title'>TECLADO</div>");
        sb.append("<table>");
        agregarFila(sb, "Estado", f.getTecladoEstado());
        agregarFilaBool(sb, "Teclas Dañadas", f.getTecladoTeclasDanadas());
        agregarFilaBool(sb, "Teclas Faltantes", f.getTecladoTeclasFaltantes());
        agregarFilaBool(sb, "Retroiluminación", f.getTecladoRetroiluminacion());
        agregarFila(sb, "Observaciones Teclado", f.getTecladoObservaciones());
        sb.append("</table>");

        // TOUCHPAD
        sb.append("<div class='section-title'>TOUCHPAD</div>");
        sb.append("<table>");
        agregarFila(sb, "Estado", f.getTouchpadEstado());
        agregarFilaBool(sb, "Funciona", f.getTouchpadFunciona());
        agregarFilaBool(sb, "Botón Izquierdo", f.getTouchpadBotonIzq());
        agregarFilaBool(sb, "Botón Derecho", f.getTouchpadBotonDer());
        agregarFilaBool(sb, "Táctil", f.getTouchpadTactil());
        agregarFila(sb, "Observaciones Touchpad", f.getTouchpadObservaciones());
        sb.append("</table>");

        // PUERTOS E INTERFACES
        sb.append("<div class='section-title'>PUERTOS E INTERFACES</div>");
        sb.append("<table>");
        agregarFilaBool(sb, "Puerto USB", f.getPuertoUsb());
        agregarFilaBool(sb, "Puerto VGA", f.getPuertoVga());
        agregarFilaBool(sb, "Puerto Ethernet", f.getPuertoEthernet());
        agregarFilaBool(sb, "Puerto HDMI", f.getPuertoHdmi());
        agregarFilaBool(sb, "Entrada Audio", f.getPuertoEntradaAudio());
        agregarFilaBool(sb, "Salida Audio", f.getPuertoSalidaAudio());
        agregarFilaBool(sb, "MicroSD", f.getPuertoMicroSd());
        agregarFilaBool(sb, "DVD", f.getPuertoDvd());
        agregarFila(sb, "Versión PCI Express", f.getPciExpressVersion());
        agregarFila(sb, "Versión USB", f.getUsbVersion());
        agregarFila(sb, "Observaciones Puertos", f.getPuertosObservaciones());
        sb.append("</table>");

        // BATERÍA
        sb.append("<div class='section-title'>BATERÍA</div>");
        sb.append("<table>");
        agregarFila(sb, "Código Batería", f.getBateriaCodigo());
        agregarFila(sb, "Observaciones Batería", f.getBateriaObservaciones());
        sb.append("</table>");

        // CARGADOR
        sb.append("<div class='section-title'>CARGADOR</div>");
        sb.append("<table>");
        agregarFila(sb, "Código Cargador", f.getCargadorCodigo());
        agregarFila(sb, "Estado Cable", f.getCargadorEstadoCable());
        agregarFila(sb, "Voltajes", f.getCargadorVoltajes());
        sb.append("</table>");

        // FUENTE Y VENTILACIÓN
        sb.append("<div class='section-title'>FUENTE Y VENTILACIÓN</div>");
        sb.append("<table>");
        agregarFila(sb, "Estado Ventilador Fuente", f.getFuenteVentiladorEstado());
        agregarFila(sb, "Ruido", f.getFuenteRuido());
        agregarFila(sb, "Medición Voltaje", f.getFuenteMedicionVoltaje());
        agregarFila(sb, "Observaciones Fuente", f.getFuenteObservaciones());
        agregarFila(sb, "Observaciones Ventilador CPU", f.getVentiladorCpuObservaciones());
        sb.append("</table>");

        // CÁMARA
        sb.append("<div class='section-title'>CÁMARA</div>");
        sb.append("<table>");
        agregarFilaBool(sb, "Funciona", f.getCamaraFunciona());
        agregarFila(sb, "Observaciones Cámara", f.getCamaraObservaciones());
        sb.append("</table>");

        // SOFTWARE
        sb.append("<div class='section-title'>SOFTWARE</div>");
        sb.append("<table>");
        agregarFilaBool(sb, "Office Licencia Activa", f.getOfficeLicenciaActiva());
        agregarFila(sb, "Versión Office", f.getOfficeVersion());
        agregarFila(sb, "Otros Programas", f.getInformacionOtrosProgramas());
        sb.append("</table>");

        // INFORMACIÓN Y RESPALDO
        sb.append("<div class='section-title'>INFORMACIÓN Y RESPALDO</div>");
        sb.append("<table>");
        agregarFila(sb, "Cantidad de Información", f.getInformacionCantidad());
        agregarFilaBool(sb, "Requiere Respaldo", f.getInformacionRequiereRespaldo());
        sb.append("</table>");

        // TRABAJO REALIZADO
        if (f.getTrabajoRealizado() != null && !f.getTrabajoRealizado().isEmpty()) {
            sb.append("<div class='section-title'>TRABAJO REALIZADO</div>");
            sb.append("<div class='obs-box'>").append(escaparHtml(f.getTrabajoRealizado())).append("</div>");
        }

        // OBSERVACIONES GENERALES
        if (f.getObservaciones() != null && !f.getObservaciones().isEmpty()) {
            sb.append("<div class='section-title'>OBSERVACIONES GENERALES</div>");
            sb.append("<div class='obs-box'>").append(escaparHtml(f.getObservaciones())).append("</div>");
        }

        // FOOTER
        sb.append("<div class='footer'>");
        sb.append("<p>Documento generado automáticamente por NewbieSoft | Ficha Técnica ID: ").append(f.getId())
                .append(" | Estado: ").append(f.getEstado() != null ? f.getEstado() : "-").append("</p>");
        sb.append("</div>");

        sb.append("</body></html>");

        return sb.toString();
    }

    private void agregarFila(StringBuilder sb, String label, Object valor) {
        String val = valor != null ? valor.toString() : "";
        if (val.isEmpty() || "0".equals(val) || "0.0".equals(val))
            val = "-";
        sb.append("<tr><td>").append(escaparHtml(label)).append("</td><td>").append(escaparHtml(val))
                .append("</td></tr>");
    }

    private void agregarFilaBool(StringBuilder sb, String label, Boolean valor) {
        String val = valor == null ? "-" : (valor ? "Sí" : "No");
        sb.append("<tr><td>").append(escaparHtml(label)).append("</td><td><b>").append(val).append("</b></td></tr>");
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

    private String cargarLogoBase64() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo.png");
            if (resource.exists()) {
                byte[] imageBytes = resource.getInputStream().readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                return "<img src='data:image/png;base64," + base64 + "' style='height: 50px;' />";
            }
        } catch (Exception e) {
            System.err.println("No se pudo cargar el logo: " + e.getMessage());
        }
        return "";
    }

    private String escaparHtml(String s) {
        if (s == null)
            return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
