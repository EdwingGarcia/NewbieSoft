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

import org.springframework.beans.factory.annotation.Autowired;
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

import com.newbie.newbiecore.audit.AuditService;
import com.newbie.newbiecore.audit.TipoAccion;
import com.newbie.newbiecore.entity.FirmaOrdenTrabajo;
import com.newbie.newbiecore.entity.TipoFirmaOT;
import com.newbie.newbiecore.entity.TipoFirmante;
import com.newbie.newbiecore.repository.FirmaOrdenTrabajoRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/firmas")
public class FirmaController {

    @Value("${app.upload-dir}")
    private String baseUploadDir;

    @Autowired
    private FirmaOrdenTrabajoRepository firmaOrdenTrabajoRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping("/estado/{numeroOrden}")
    public ResponseEntity<Map<String, Object>> obtenerEstadoFirmas(@PathVariable String numeroOrden) {
        Map<String, Object> resultado = new HashMap<>();

        try {
            // Primero verificar en base de datos
            boolean tieneConformidadBD = firmaOrdenTrabajoRepository.existsByNumeroOrdenAndTipoFirma(
                numeroOrden, TipoFirmaOT.CONFORMIDAD);
            boolean tieneReciboBD = firmaOrdenTrabajoRepository.existsByNumeroOrdenAndTipoFirma(
                numeroOrden, TipoFirmaOT.RECIBO);

            // También verificar archivos (por compatibilidad con firmas antiguas)
            String carpetaOT = baseUploadDir + "/" + numeroOrden;
            Path carpetaDocumentos = Path.of(carpetaOT, "documentos");

            boolean tieneConformidadArchivo = false;
            if (Files.exists(carpetaDocumentos)) {
                try (var files = Files.list(carpetaDocumentos)) {
                    tieneConformidadArchivo = files.anyMatch(p -> p.getFileName().toString().startsWith("FirmaConformidad_") ||
                            p.getFileName().toString().startsWith("Conformidad_OT_"));
                }
            }

            boolean tieneReciboArchivo = false;
            if (Files.exists(carpetaDocumentos)) {
                try (var files = Files.list(carpetaDocumentos)) {
                    tieneReciboArchivo = files.anyMatch(p -> p.getFileName().toString().startsWith("FirmaRecibo_") ||
                            p.getFileName().toString().startsWith("Recibo_OT_"));
                }
            }

            // Combinar resultados (BD tiene prioridad, pero archivos también cuentan)
            boolean tieneConformidad = tieneConformidadBD || tieneConformidadArchivo;
            boolean tieneRecibo = tieneReciboBD || tieneReciboArchivo;

            resultado.put("conformidadFirmada", tieneConformidad);
            resultado.put("reciboFirmado", tieneRecibo);
            resultado.put("numeroOrden", numeroOrden);

            // Información adicional del registro de conformidad (usando consultas optimizadas sin LOB)
            if (tieneConformidadBD) {
                firmaOrdenTrabajoRepository.findFechaFirmaByNumeroOrdenAndTipoFirma(numeroOrden, TipoFirmaOT.CONFORMIDAD)
                    .ifPresent(fecha -> resultado.put("conformidadFecha", fecha.toString()));
                firmaOrdenTrabajoRepository.findFirmanteNombreByNumeroOrdenAndTipoFirma(numeroOrden, TipoFirmaOT.CONFORMIDAD)
                    .ifPresent(nombre -> resultado.put("conformidadFirmante", nombre));
                firmaOrdenTrabajoRepository.findTipoFirmanteByNumeroOrdenAndTipoFirma(numeroOrden, TipoFirmaOT.CONFORMIDAD)
                    .ifPresent(tipo -> resultado.put("conformidadTipoFirmante", tipo));
            }

            // Información adicional del registro de recibo (usando consultas optimizadas sin LOB)
            if (tieneReciboBD) {
                firmaOrdenTrabajoRepository.findFechaFirmaByNumeroOrdenAndTipoFirma(numeroOrden, TipoFirmaOT.RECIBO)
                    .ifPresent(fecha -> resultado.put("reciboFecha", fecha.toString()));
                firmaOrdenTrabajoRepository.findFirmanteNombreByNumeroOrdenAndTipoFirma(numeroOrden, TipoFirmaOT.RECIBO)
                    .ifPresent(nombre -> resultado.put("reciboFirmante", nombre));
                firmaOrdenTrabajoRepository.findTipoFirmanteByNumeroOrdenAndTipoFirma(numeroOrden, TipoFirmaOT.RECIBO)
                    .ifPresent(tipo -> resultado.put("reciboTipoFirmante", tipo));
            }

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
            // Generar HTML y PDF con la firma integrada
            String html = generarHtmlConfirmacion(request);
            byte[] pdfBytes = htmlToPdf(html);

            // Guardar solo el PDF (la firma está integrada en el documento)
            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    Path pdfPath = carpetaDocumentos.resolve("Autorizacion_Servicio_" + request.numeroOrden + ".pdf");
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    
                    // Registrar auditoría
                    auditService.registrarPdfGenerado(
                        request.numeroOrden,
                        "Autorizacion_Servicio",
                        request.cliente,
                        "Autorización de servicio firmada por cliente"
                    );
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar el PDF en disco: " + e.getMessage());
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=Autorizacion_Servicio_" + request.numeroOrden + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping("/conformidad")
    public ResponseEntity<byte[]> firmaConformidad(@RequestBody FirmaRequest request, HttpServletRequest httpRequest) {
        try {
            // Determinar si es firma de conformidad o de recibo
            boolean esRecibo = "recibo".equalsIgnoreCase(request.modo);
            TipoFirmaOT tipoFirma = esRecibo ? TipoFirmaOT.RECIBO : TipoFirmaOT.CONFORMIDAD;

            String firmaBase64Clean = null;
            if (request.firma != null && request.firma.contains(",")) {
                firmaBase64Clean = request.firma.split(",")[1];
            } else {
                firmaBase64Clean = request.firma;
            }

            String pdfPathStr = null;

            // NOTA: No se guarda la firma suelta por razones legales
            // La firma solo se almacena integrada dentro del PDF

            // Generar HTML y PDF según el tipo
            String html = esRecibo ? generarHtmlRecibo(request) : generarHtmlConformidad(request);
            byte[] pdfBytes = htmlToPdf(html);

            if (request.numeroOrden != null) {
                try {
                    String carpetaOT = baseUploadDir + "/" + request.numeroOrden;
                    Path carpetaDocumentos = Path.of(carpetaOT, "documentos");
                    Files.createDirectories(carpetaDocumentos);
                    
                    String pdfFileName = esRecibo 
                        ? "Acta_Entrega_" + request.numeroOrden + ".pdf"
                        : "Acta_Conformidad_" + request.numeroOrden + ".pdf";
                    Path pdfPath = carpetaDocumentos.resolve(pdfFileName);
                    Files.write(pdfPath, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    pdfPathStr = pdfPath.toString();
                } catch (Exception e) {
                    System.err.println("Advertencia: No se pudo guardar el PDF en disco: " + e.getMessage());
                }
            }

            // ✅ Guardar registro en base de datos
            try {
                // Determinar tipo de firmante
                TipoFirmante tipoFirmante = TipoFirmante.CLIENTE;
                String firmanteNombre = request.cliente;
                String firmanteCedula = null;
                String firmanteRelacion = "Cliente";

                if (request.tipoFirmante != null && "tercero".equalsIgnoreCase(request.tipoFirmante)) {
                    tipoFirmante = TipoFirmante.TERCERO;
                    if (request.firmante != null) {
                        firmanteNombre = request.firmante.nombre;
                        firmanteCedula = request.firmante.cedula;
                        firmanteRelacion = request.firmante.relacion != null ? request.firmante.relacion : "Tercero";
                    }
                } else if (request.firmante != null) {
                    // Es cliente, usar datos del firmante
                    firmanteNombre = request.firmante.nombre != null ? request.firmante.nombre : request.cliente;
                    firmanteCedula = request.firmante.cedula;
                    firmanteRelacion = request.firmante.relacion != null ? request.firmante.relacion : "Cliente";
                }

                // Solo guardar metadatos y ruta del PDF (sin la firma suelta)
                FirmaOrdenTrabajo firmaEntity = FirmaOrdenTrabajo.builder()
                    .numeroOrden(request.numeroOrden)
                    .tipoFirma(tipoFirma)
                    .tipoFirmante(tipoFirmante)
                    .firmanteNombre(firmanteNombre)
                    .firmanteCedula(firmanteCedula)
                    .firmanteRelacion(firmanteRelacion)
                    .pdfPath(pdfPathStr)
                    .equipoInfo(request.equipo)
                    .procedimiento(request.procedimiento)
                    .ipAddress(getClientIpAddress(httpRequest))
                    .firmaBase64("")  // Campo requerido por constraint de BD
                    .build();

                firmaOrdenTrabajoRepository.save(firmaEntity);
                System.out.println("✅ Firma guardada en BD: " + tipoFirma + " - " + request.numeroOrden);
                
                // Registrar auditoría
                auditService.registrarFirma(
                    request.numeroOrden, 
                    tipoFirma.name(), 
                    tipoFirmante.name(), 
                    firmanteNombre, 
                    firmanteCedula,
                    esRecibo ? "Acta de entrega generada" : "Acta de conformidad generada"
                );
            } catch (Exception e) {
                System.err.println("Advertencia: No se pudo guardar la firma en BD: " + e.getMessage());
                e.printStackTrace();
            }

            String filename = esRecibo 
                ? "Acta_Entrega_" + request.numeroOrden + ".pdf"
                : "Acta_Conformidad_" + request.numeroOrden + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(("Error al generar PDF: " + e.getMessage()).getBytes());
        }
    }

    // Método helper para obtener IP del cliente
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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
                "body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }"
                +
                ".header-table { width: 100%; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 30px; }"
                +
                ".header-logo { width: 30%; vertical-align: middle; }" +
                ".header-info { width: 70%; text-align: right; vertical-align: middle; }" +
                ".header-info h1 { margin: 0; font-size: 20px; color: #0056b3; text-transform: uppercase; }" +
                ".header-info p { margin: 2px 0; color: #666; font-size: 11px; }" +
                ".section-title { background-color: #f0f4f8; padding: 8px; font-weight: bold; border-left: 4px solid #0056b3; margin-top: 20px; margin-bottom: 10px; font-size: 13px; }"
                +
                ".info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }" +
                ".info-table td { padding: 6px; border-bottom: 1px solid #eee; }" +
                ".label { font-weight: bold; color: #555; width: 30%; }" +
                ".value { color: #000; }" +
                ".legal-box { border: 1px solid #ddd; background-color: #fafafa; padding: 15px; font-size: 10px; text-align: justify; color: #555; margin-top: 20px; border-radius: 4px; }"
                +
                ".signature-section { margin-top: 50px; page-break-inside: avoid; }" +
                ".signature-box { width: 250px; margin: 0 auto; text-align: center; }" +
                ".signature-line { border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 11px; }"
                +
                ".footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }"
                +
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
                "<tr><td class='label'>Procedimiento:</td><td class='value'>" + escaparHtml(request.procedimiento)
                + "</td></tr>" +
                "</table>" +
                "<div class='legal-box'>" +
                "<p><b>CONFORMIDAD CON EL PROCESO</b></p>" +
                "<p>El cliente declara estar conforme con el procedimiento técnico propuesto para la resolución del inconveniente reportado en el equipo y se compromete a permitir que sea realizado. El presente documento sirve como constancia de aceptación y autorización para proceder con el servicio técnico.</p>"
                +
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
        String logoImgTag = cargarLogoBase64Grande();
        String firmaImgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            firmaImgTag = "<img src='" + src + "' alt='Firma' style='max-height: 70px;' />";
        } else {
            firmaImgTag = "<p style='color: #999;'><i>Sin firma digital registrada</i></p>";
        }

        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // Número de serie del equipo
        String numeroSerie = request.equipoNumeroSerie != null && !request.equipoNumeroSerie.isBlank() 
            ? request.equipoNumeroSerie : "No disponible";

        // Colores morados del sistema
        String colorPrimario = "#7c3aed"; // Violet-600
        String colorPrimarioClaro = "#ede9fe"; // Violet-100
        String colorPrimarioOscuro = "#6d28d9"; // Violet-700

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8' />" +
                "<style>" +
                "@page { size: A4; margin: 1.5cm; }" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.4; font-size: 10px; margin: 0; padding: 0; }" +
                ".header-table { width: 100%; border-bottom: 3px solid " + colorPrimario + "; padding-bottom: 10px; margin-bottom: 15px; }" +
                ".header-logo { width: 35%; vertical-align: middle; }" +
                ".header-info { width: 65%; text-align: right; vertical-align: middle; }" +
                ".document-title { font-size: 16px; font-weight: bold; color: " + colorPrimario + "; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 5px 0; }" +
                ".document-subtitle { font-size: 10px; color: #666; margin: 0 0 5px 0; }" +
                ".orden-numero { font-size: 11px; color: " + colorPrimarioOscuro + "; font-weight: bold; }" +
                ".section-title { background-color: " + colorPrimarioClaro + "; padding: 6px 10px; font-weight: bold; border-left: 4px solid " + colorPrimario + "; margin-top: 12px; margin-bottom: 8px; font-size: 11px; color: " + colorPrimarioOscuro + "; }" +
                ".info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }" +
                ".info-table td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; font-size: 10px; }" +
                ".label { font-weight: bold; color: #555; background-color: #fafafa; white-space: nowrap; }" +
                ".value { color: #000; }" +
                ".procedimiento-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 8px; border-radius: 4px; margin-bottom: 10px; text-align: justify; white-space: pre-wrap; line-height: 1.4; font-size: 9px; max-height: 80px; overflow: hidden; }" +
                ".legal-box { border: 2px solid " + colorPrimario + "; background-color: " + colorPrimarioClaro + "; padding: 10px; font-size: 8px; text-align: justify; color: #333; margin-top: 12px; border-radius: 4px; }" +
                ".legal-title { font-weight: bold; font-size: 10px; color: " + colorPrimarioOscuro + "; margin-bottom: 8px; text-align: center; text-transform: uppercase; }" +
                ".legal-text { margin-bottom: 6px; line-height: 1.4; }" +
                ".signature-section { margin-top: 15px; }" +
                ".signature-box { width: 280px; margin: 0 auto; text-align: center; padding: 10px; border: 1px dashed " + colorPrimario + "; border-radius: 6px; background-color: #fafafa; }" +
                ".signature-line { border-top: 2px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 9px; }" +
                ".footer { text-align: center; font-size: 8px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 15px; }" +
                ".two-col { display: table; width: 100%; }" +
                ".two-col > div { display: table-cell; width: 50%; vertical-align: top; padding-right: 10px; }" +
                ".two-col > div:last-child { padding-right: 0; padding-left: 10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +

                // Header con logo a la izquierda
                "<table class='header-table'>" +
                "<tr>" +
                "<td class='header-logo'>" + logoImgTag + "</td>" +
                "<td class='header-info'>" +
                "<div class='document-title'>Acta de Conformidad del Servicio</div>" +
                "<div class='document-subtitle'>Documento de Aceptación del Procedimiento</div>" +
                "<div class='orden-numero'>OT N°: " + escaparHtml(request.numeroOrden) + " | Fecha: " + fechaEmision + "</div>" +
                "</td>" +
                "</tr>" +
                "</table>" +

                // Información Cliente y Equipo en dos columnas
                "<div class='two-col'>" +
                "<div>" +
                "<div class='section-title'>Cliente</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Nombre:</td><td class='value'>" + escaparHtml(request.cliente) + "</td></tr>" +
                (request.clienteCedula != null && !request.clienteCedula.isBlank() ? "<tr><td class='label'>Cédula:</td><td class='value'>" + escaparHtml(request.clienteCedula) + "</td></tr>" : "") +
                (request.clienteTelefono != null && !request.clienteTelefono.isBlank() ? "<tr><td class='label'>Teléfono:</td><td class='value'>" + escaparHtml(request.clienteTelefono) + "</td></tr>" : "") +
                (request.clienteCorreo != null && !request.clienteCorreo.isBlank() ? "<tr><td class='label'>Correo:</td><td class='value'>" + escaparHtml(request.clienteCorreo) + "</td></tr>" : "") +
                "</table>" +
                "</div>" +
                "<div>" +
                "<div class='section-title'>Equipo</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Marca/Modelo:</td><td class='value'>" + escaparHtml(request.equipo) + "</td></tr>" +
                "<tr><td class='label'>N° Serie:</td><td class='value'><b>" + escaparHtml(numeroSerie) + "</b></td></tr>" +
                "</table>" +
                "</div>" +
                "</div>" +

                // Técnico Encargado
                "<div class='section-title'>Técnico Encargado</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label' style='width:15%'>Nombre:</td><td class='value' style='width:85%'>" + escaparHtml(request.tecnicoNombre != null ? request.tecnicoNombre : "No especificado") + "</td></tr>" +
                "</table>" +

                // Servicio/Procedimiento
                "<div class='section-title'>Procedimiento a Realizar</div>" +
                "<div class='procedimiento-box'>" + escaparHtml(request.procedimiento) + "</div>" +

                // Declaración Legal
                "<div class='legal-box'>" +
                "<div class='legal-title'>Conformidad con el Procedimiento</div>" +
                "<p class='legal-text'>El cliente declara estar conforme con el procedimiento técnico propuesto para la resolución del inconveniente reportado en el equipo y se compromete a permitir que sea realizado. El presente documento sirve como constancia de aceptación y autorización para proceder con el servicio técnico.</p>" +
                "<p class='legal-text'><b>VALIDEZ DE LA FIRMA DIGITAL:</b> La firma digital plasmada en este documento tiene plena validez jurídica como constancia de la recepción del servicio, de conformidad con la legislación ecuatoriana aplicable a los mensajes de datos y firmas electrónicas. El cliente reconoce que la firma capturada mediante dispositivo electrónico constituye manifestación inequívoca de su voluntad, con los mismos efectos probatorios que una firma manuscrita, y que el presente documento no podrá ser desconocido por el hecho de haberse generado, aceptado y suscrito por medios digitales.</p>" +
                "</div>" +

                // Firma
                "<div class='signature-section'>" +
                "<div class='signature-box'>" +
                firmaImgTag +
                "<div class='signature-line'>Firma de Conformidad del Cliente</div>" +
                "</div>" +
                "</div>" +

                // Footer
                "<div class='footer'>" +
                "<p>Documento generado automáticamente por el sistema NewbieSoft - Confidencial</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String generarHtmlRecibo(FirmaRequest request) {
        String logoImgTag = cargarLogoBase64Grande();
        String firmaImgTag = "";
        if (request.firma != null && !request.firma.isBlank()) {
            String src = request.firma.startsWith("data:") ? request.firma : "data:image/png;base64," + request.firma;
            firmaImgTag = "<img src='" + src + "' alt='Firma' style='max-height: 70px;' />";
        } else {
            firmaImgTag = "<p style='color: #999;'><i>Sin firma digital registrada</i></p>";
        }

        String fechaEmision = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // Determinar información del firmante
        boolean esTercero = "tercero".equalsIgnoreCase(request.tipoFirmante);
        String firmanteNombre = request.cliente;
        String firmanteCedula = "";
        String firmanteRelacion = "Cliente";

        if (request.firmante != null) {
            firmanteNombre = request.firmante.nombre != null ? request.firmante.nombre : request.cliente;
            firmanteCedula = request.firmante.cedula != null ? request.firmante.cedula : "";
            firmanteRelacion = request.firmante.relacion != null ? request.firmante.relacion : (esTercero ? "Representante" : "Cliente");
        }

        // Número de serie del equipo
        String numeroSerie = request.equipoNumeroSerie != null && !request.equipoNumeroSerie.isBlank() 
            ? request.equipoNumeroSerie : "No disponible";

        // Sección adicional para terceros (compacta)
        String seccionFirmante = "";
        if (esTercero) {
            seccionFirmante = 
                "<div class='section-title'>Tercero Autorizado</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Nombre:</td><td class='value'>" + escaparHtml(firmanteNombre) + "</td>" +
                "<td class='label'>Cédula:</td><td class='value'>" + escaparHtml(firmanteCedula) + "</td>" +
                "<td class='label'>Relación:</td><td class='value'>" + escaparHtml(firmanteRelacion) + "</td></tr>" +
                "</table>";
        }

        String firmaLabel = esTercero 
            ? escaparHtml(firmanteNombre) + " (" + escaparHtml(firmanteRelacion) + ")"
            : "Firma del Cliente";

        // Color morado del sistema
        String colorPrimario = "#7c3aed"; // Violet-600
        String colorPrimarioClaro = "#ede9fe"; // Violet-100
        String colorPrimarioOscuro = "#5b21b6"; // Violet-800

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8' />" +
                "<style>" +
                "@page { size: A4; margin: 1.5cm; }" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.4; font-size: 10px; margin: 0; padding: 0; }" +
                ".header-table { width: 100%; border-bottom: 3px solid " + colorPrimario + "; padding-bottom: 10px; margin-bottom: 15px; }" +
                ".header-logo { width: 35%; vertical-align: middle; }" +
                ".header-info { width: 65%; text-align: right; vertical-align: middle; }" +
                ".document-title { font-size: 16px; font-weight: bold; color: " + colorPrimario + "; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 5px 0; }" +
                ".document-subtitle { font-size: 10px; color: #666; margin: 0 0 5px 0; }" +
                ".orden-numero { font-size: 11px; color: " + colorPrimarioOscuro + "; font-weight: bold; }" +
                ".section-title { background-color: " + colorPrimarioClaro + "; padding: 6px 10px; font-weight: bold; border-left: 4px solid " + colorPrimario + "; margin-top: 12px; margin-bottom: 8px; font-size: 11px; color: " + colorPrimarioOscuro + "; }" +
                ".info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }" +
                ".info-table td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; font-size: 10px; }" +
                ".label { font-weight: bold; color: #555; background-color: #fafafa; white-space: nowrap; }" +
                ".value { color: #000; }" +
                ".procedimiento-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 8px; border-radius: 4px; margin-bottom: 10px; text-align: justify; white-space: pre-wrap; line-height: 1.4; font-size: 9px; max-height: 80px; overflow: hidden; }" +
                ".legal-box { border: 2px solid " + colorPrimario + "; background-color: " + colorPrimarioClaro + "; padding: 10px; font-size: 8px; text-align: justify; color: #333; margin-top: 12px; border-radius: 4px; }" +
                ".legal-title { font-weight: bold; font-size: 10px; color: " + colorPrimarioOscuro + "; margin-bottom: 8px; text-align: center; text-transform: uppercase; }" +
                ".legal-text { margin-bottom: 6px; line-height: 1.4; }" +
                ".tercero-notice { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 6px; margin-top: 8px; border-radius: 3px; font-size: 8px; }" +
                ".signature-section { margin-top: 15px; }" +
                ".signature-box { width: 280px; margin: 0 auto; text-align: center; padding: 10px; border: 1px dashed " + colorPrimario + "; border-radius: 6px; background-color: #fafafa; }" +
                ".signature-line { border-top: 2px solid #333; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 9px; }" +
                ".footer { text-align: center; font-size: 8px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 15px; }" +
                ".two-col { display: table; width: 100%; }" +
                ".two-col > div { display: table-cell; width: 50%; vertical-align: top; padding-right: 10px; }" +
                ".two-col > div:last-child { padding-right: 0; padding-left: 10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +

                // Header con logo a la izquierda
                "<table class='header-table'>" +
                "<tr>" +
                "<td class='header-logo'>" + logoImgTag + "</td>" +
                "<td class='header-info'>" +
                "<div class='document-title'>Acta de Conformidad del Servicio Recibido</div>" +
                "<div class='document-subtitle'>Documento de Constancia de Entrega y Aceptación</div>" +
                "<div class='orden-numero'>OT N°: " + escaparHtml(request.numeroOrden) + " | Fecha: " + fechaEmision + "</div>" +
                "</td>" +
                "</tr>" +
                "</table>" +

                // Información Cliente y Equipo en dos columnas
                "<div class='two-col'>" +
                "<div>" +
                "<div class='section-title'>Cliente</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Nombre:</td><td class='value'>" + escaparHtml(request.cliente) + "</td></tr>" +
                "<tr><td class='label'>Cédula:</td><td class='value'>" + escaparHtml(request.clienteCedula) + "</td></tr>" +
                "<tr><td class='label'>Teléfono:</td><td class='value'>" + escaparHtml(request.clienteTelefono) + "</td></tr>" +
                "<tr><td class='label'>Correo:</td><td class='value'>" + escaparHtml(request.clienteCorreo) + "</td></tr>" +
                "</table>" +
                "</div>" +
                "<div>" +
                "<div class='section-title'>Equipo</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label'>Tipo:</td><td class='value'>" + escaparHtml(request.equipoTipo) + "</td></tr>" +
                "<tr><td class='label'>Marca/Modelo:</td><td class='value'>" + escaparHtml(request.equipo) + "</td></tr>" +
                "<tr><td class='label'>N° Serie:</td><td class='value'><b>" + escaparHtml(numeroSerie) + "</b></td></tr>" +
                "</table>" +
                "</div>" +
                "</div>" +

                // Técnico Encargado
                "<div class='section-title'>Técnico Encargado</div>" +
                "<table class='info-table'>" +
                "<tr><td class='label' style='width:15%'>Nombre:</td><td class='value' style='width:35%'>" + escaparHtml(request.tecnicoNombre) + "</td>" +
                "<td class='label' style='width:15%'>Cédula:</td><td class='value' style='width:35%'>" + escaparHtml(request.tecnicoCedula) + "</td></tr>" +
                "</table>" +

                // Servicio Realizado
                "<div class='section-title'>Servicio Realizado</div>" +
                "<div class='procedimiento-box'>" + escaparHtml(request.procedimiento) + "</div>" +

                // Sección de tercero si aplica
                seccionFirmante +

                // Declaración Legal compacta
                "<div class='legal-box'>" +
                "<div class='legal-title'>Declaración de Conformidad</div>" +
                "<p class='legal-text'>Por medio del presente documento, el cliente declara haber revisado el funcionamiento del equipo, el estado de sus componentes físicos, y acepta el servicio técnico realizado a su entera satisfacción. Se libera a la empresa de toda responsabilidad sobre fallas futuras no relacionadas con el servicio técnico prestado o derivadas del mal uso del dispositivo.</p>" +
                "<p class='legal-text'>La firma digital plasmada en este documento tiene plena validez jurídica como constancia de la recepción del servicio, de conformidad con la legislación ecuatoriana aplicable a los mensajes de datos y firmas electrónicas. El cliente reconoce que la firma capturada mediante dispositivo electrónico constituye manifestación inequívoca de su voluntad, con los mismos efectos probatorios que una firma manuscrita, y que el presente documento no podrá ser desconocido por el hecho de haberse generado, aceptado y suscrito por medios digitales.</p>" +
                (esTercero 
                    ? "<div class='tercero-notice'><b>Nota:</b> Documento suscrito por <b>" + escaparHtml(firmanteNombre) + "</b> (C.I.: " + escaparHtml(firmanteCedula) + "), como <b>" + escaparHtml(firmanteRelacion) + "</b> del cliente.</div>"
                    : ""
                ) +
                "</div>" +

                // Firma
                "<div class='signature-section'>" +
                "<div class='signature-box'>" +
                firmaImgTag +
                "<div class='signature-line'>" + firmaLabel + "</div>" +
                "</div>" +
                "</div>" +

                // Footer
                "<div class='footer'>" +
                "<p>Documento generado electrónicamente por NewbieSoft - Sistema de Gestión de Servicio Técnico</p>" +
                "</div>" +

                "</body>" +
                "</html>";
    }

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
        if (s == null)
            return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public static class FirmaRequest {
        public Long ordenId;
        public String numeroOrden;
        // Cliente
        public String cliente;
        public String clienteCedula;
        public String clienteTelefono;
        public String clienteCorreo;
        // Equipo
        public String equipo;
        public String equipoNumeroSerie;
        public String equipoMarca;
        public String equipoTipo;
        // Técnico
        public String tecnicoNombre;
        public String tecnicoCedula;
        // Servicio
        public String procedimiento;
        public String modo;
        public String firma;
        // Campos para firma de recibo con cliente/tercero
        public String tipoFirmante; // "cliente" o "tercero"
        public FirmanteInfo firmante;
    }

    public static class FirmanteInfo {
        public String nombre;
        public String cedula;
        public String relacion;
    }
}
