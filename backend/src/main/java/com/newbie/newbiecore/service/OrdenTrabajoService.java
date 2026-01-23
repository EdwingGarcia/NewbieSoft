package com.newbie.newbiecore.service;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import com.newbie.newbiecore.dto.OrdenTrabajo.*;
import com.newbie.newbiecore.dto.costos.CostosTotalesDto;
import com.newbie.newbiecore.dto.costos.OrdenTrabajoCostoDto;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;
    private final FichaTecnicaRepository fichaTecnicaRepository;
    private final OrdenTrabajoPdfService ordenTrabajoPdfService;
    private final OrdenTrabajoCostoService ordenTrabajoCostoService;



    private final MailService mailService;

    @Value("${app.upload-dir}")
    private String uploadDir;

    /* =============================
       CREAR ORDEN (INGRESO)
       ============================= */
    @Transactional
    public OrdenTrabajoIngresoDto crearOrden(CrearOrdenTrabajoRequest request, Authentication auth) {

        var usuarioAuth = usuarioRepository.findByCorreo(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));

        boolean esTecnico = usuarioAuth.getRol() != null
                && "ROLE_TECNICO".equals(usuarioAuth.getRol().getNombre());

        Usuario tecnico;

        if (esTecnico) {
            tecnico = usuarioAuth;
        } else {
            tecnico = usuarioRepository.findById(request.getTecnicoCedula())
                    .orElseThrow(() -> new RuntimeException("Técnico no encontrado"));
        }

        Usuario cliente = usuarioRepository.findById(request.getClienteCedula())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        var equipo = equipoRepository.findById(request.getEquipoId())
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));

        String numeroOrden = generarNumeroOrden();

        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden(numeroOrden)
                .medioContacto(request.getMedioContacto())
                .tecnicoAsignado(tecnico)
                .cliente(cliente)
                .equipo(equipo)
                .contrasenaEquipo(request.getContrasenaEquipo())
                .accesorios(request.getAccesorios())
                .problemaReportado(request.getProblemaReportado())
                .observacionesIngreso(request.getObservacionesIngreso())
                .tipoServicio(request.getTipoServicio())
                .prioridad(request.getPrioridad())
                .estado("PENDIENTE")
                .condicionesAceptadas(true)
                .build();

        OrdenTrabajo guardada = ordenTrabajoRepository.save(orden);

        return mapToIngresoDto(guardada);
    }

    private String generarNumeroOrden() {
        long secuencia = ordenTrabajoRepository.count() + 1;
        return "OT-" + String.format("%05d", secuencia);
    }

    /* =============================
       MAPEO A DTO DE INGRESO
       ============================= */
    private OrdenTrabajoIngresoDto mapToIngresoDto(OrdenTrabajo orden) {
        var cliente = orden.getCliente();
        var tecnico = orden.getTecnicoAsignado();
        var equipo  = orden.getEquipo();

        return new OrdenTrabajoIngresoDto(
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getMedioContacto(),
                orden.getFechaHoraIngreso(),
                orden.getTipoServicio(),
                orden.getPrioridad(),
                tecnico.getCedula(),
                tecnico.getNombre(),
                tecnico.getTelefono(),
                tecnico.getCorreo(),
                cliente.getCedula(),
                cliente.getNombre(),
                cliente.getTelefono(),
                cliente.getDireccion(),
                cliente.getCorreo(),
                equipo.getIdEquipo(),
                equipo.getTipo(),
                equipo.getMarca(),
                equipo.getModelo(),
                equipo.getNumeroSerie(),
                orden.getContrasenaEquipo(),
                orden.getAccesorios(),
                orden.getProblemaReportado(),
                orden.getObservacionesIngreso()
        );
    }

    /* =============================
       OBTENER INGRESO
       ============================= */
    @Transactional(readOnly = true)
    public OrdenTrabajoIngresoDto obtenerIngreso(Long ordenId) {
        var orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        return mapToIngresoDto(orden);
    }

    /* =============================
       ACTUALIZAR ENTREGA / CIERRE
       ============================= */
    private BigDecimal bd(Double v) {
        return v == null ? null : BigDecimal.valueOf(v);
    }

    @Transactional
    public void actualizarEntrega(Long ordenId, ActualizarEntregaRequest request) {

        var orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        // Campos editables
        if (request.diagnosticoTrabajo() != null) orden.setDiagnosticoTrabajo(request.diagnosticoTrabajo());
        if (request.observacionesRecomendaciones() != null) orden.setObservacionesRecomendaciones(request.observacionesRecomendaciones());
        if (request.tipoServicio() != null && !request.tipoServicio().isBlank()) orden.setTipoServicio(request.tipoServicio().toUpperCase());
        if (request.prioridad() != null && !request.prioridad().isBlank()) orden.setPrioridad(request.prioridad().toUpperCase());

        // Garantía
        if (request.esEnGarantia() != null) {
            orden.setEsEnGarantia(request.esEnGarantia());
            if (Boolean.TRUE.equals(request.esEnGarantia())) {
                orden.setReferenciaOrdenGarantia(request.referenciaOrdenGarantia());
            } else {
                orden.setReferenciaOrdenGarantia(null);
            }
        } else if (request.referenciaOrdenGarantia() != null) {
            if (Boolean.TRUE.equals(orden.getEsEnGarantia())) {
                orden.setReferenciaOrdenGarantia(request.referenciaOrdenGarantia());
            }
        }

        // Cierre info
        if (request.motivoCierre() != null) orden.setMotivoCierre(request.motivoCierre());
        if (request.cerradaPor() != null) orden.setCerradaPor(request.cerradaPor());

        // OTP
        if (request.otpCodigo() != null) orden.setOtpCodigo(request.otpCodigo());
        if (request.otpValidado() != null) orden.setOtpValidado(request.otpValidado());

        // Estado y Cierre
        boolean seCierra = false;

        if (Boolean.TRUE.equals(request.cerrarOrden())) {

            if ("CERRADA".equals(orden.getEstado())) {
                throw new IllegalStateException("La orden ya está cerrada");
            }

            orden.setEstado("CERRADA");
            seCierra = true;
            if (orden.getFechaHoraEntrega() == null) {
                orden.setFechaHoraEntrega(Instant.now());
            }
        } else if (request.estado() != null && !request.estado().isBlank()) {
            String nuevoEstado = request.estado().toUpperCase();
            validarTransicionEstado(orden.getEstado(), nuevoEstado);
            orden.setEstado(nuevoEstado);
            if ("LISTA_ENTREGA".equals(nuevoEstado) && orden.getFechaHoraEntrega() == null) {
                orden.setFechaHoraEntrega(Instant.now());
            }
        }

        OrdenTrabajo ordenGuardada = ordenTrabajoRepository.save(orden);
        if (seCierra) {

        // 1️⃣ Calcular totales desde costos dinámicos
        CostosTotalesDto totales = ordenTrabajoCostoService.totales(ordenGuardada.getId());

        ordenGuardada.setSubtotal(totales.subtotal());
        ordenGuardada.setIva(totales.iva());
        ordenGuardada.setTotal(totales.total());

        ordenTrabajoRepository.save(ordenGuardada);

        // 2️⃣ Generar DTO completo para PDF
        OrdenTrabajoDetalleDto dto = obtenerDetalleInterno(ordenGuardada.getId());

        byte[] pdfBytes = ordenTrabajoPdfService.generarPdfOrden(dto);

        // 3️⃣ Guardar PDF en /documentos
        try {
            Path documentosDir = Paths.get(
                    uploadDir,
                    ordenGuardada.getNumeroOrden(),
                    "documentos"
            );

            Files.createDirectories(documentosDir);

            Path pdfPath = documentosDir.resolve(
                    "OT-" + ordenGuardada.getNumeroOrden() + ".pdf"
            );

            Files.write(pdfPath, pdfBytes);

        } catch (IOException e) {
            throw new RuntimeException("Error al generar/guardar el PDF de la OT", e);
        }

        // 4️⃣ Enviar ZIP
        enviarArchivosCierreZip(ordenGuardada);
    }

            }

    /**
     * Comprime la carpeta de la orden y envía el ZIP.
     */
        private void enviarArchivosCierreZip(OrdenTrabajo orden) {
        try {
            Usuario cliente = orden.getCliente();
            if (cliente != null && cliente.getCorreo() != null && !cliente.getCorreo().isEmpty()) {

                String numeroOrden = orden.getNumeroOrden();
                String emailDestino = cliente.getCorreo();

                // Usamos Paths y toAbsolutePath para asegurar la ruta correcta en el disco
                Path rutaCarpetaOrigen = Paths.get(uploadDir).resolve(numeroOrden).toAbsolutePath();

                // El ZIP se guardará fuera de la carpeta para no comprimirse a sí mismo
                String nombreZip = numeroOrden + "_Documentos.zip";
                Path rutaZipDestino = Paths.get(uploadDir).resolve(nombreZip).toAbsolutePath();

                String asunto = "Entrega de Orden de Trabajo #" + numeroOrden;
                String cuerpo = "Estimado/a " + cliente.getNombre() + ",\n\n" +
                        "Su orden de trabajo #" + numeroOrden + " ha sido cerrada exitosamente.\n" +
                        "Adjunto encontrará un archivo comprimido (ZIP) con todas las imágenes y documentos de su servicio.\n\n" +
                        "Gracias por confiar en nosotros.\n\n" +
                        "Atentamente,\n" +
                        "El equipo de NewbieSoft.";

                new Thread(() -> {
                    try {
                        System.out.println("--- INICIANDO COMPRESIÓN ---");
                        System.out.println("Carpeta origen: " + rutaCarpetaOrigen);
                        System.out.println("Destino ZIP: " + rutaZipDestino);

                        // Verificar si existe la carpeta origen
                        if (!Files.exists(rutaCarpetaOrigen)) {
                            System.out.println("ADVERTENCIA: La carpeta de la orden NO EXISTE. No se enviará ZIP.");
                            mailService.sendEmail(emailDestino, asunto, cuerpo + "\n\n(Nota: No se encontraron archivos para adjuntar).");
                            return;
                        }

                        // Crear el ZIP con Java NIO (más robusto para recorrer todo)
                        boolean zipCreado = zipFolderRecursivo(rutaCarpetaOrigen, rutaZipDestino);

                        if (zipCreado) {
                            System.out.println("ZIP creado correctamente. Tamaño: " + Files.size(rutaZipDestino) + " bytes.");
                            mailService.sendEmailWithAttachment(emailDestino, asunto, cuerpo, rutaZipDestino.toString());
                            System.out.println("Correo enviado con ZIP.");

                            // Opcional: Eliminar ZIP después de enviar
                            // Files.deleteIfExists(rutaZipDestino);
                        } else {
                            System.out.println("El ZIP no se creó (carpeta vacía). Enviando correo sin adjunto.");
                            mailService.sendEmail(emailDestino, asunto, cuerpo + "\n\n(Nota: La carpeta de documentos estaba vacía).");
                        }

                    } catch (Exception e) {
                        System.err.println("Error grave en el hilo de envío de correo: " + e.getMessage());
                        e.printStackTrace();
                    }
                }).start();

            }
        } catch (Exception e) {
            System.err.println("Error al preparar envío: " + e.getMessage());
        }
    }

    /**
     * Método robusto para comprimir recursivamente usando Java NIO
     */
    private boolean zipFolderRecursivo(Path sourceFolderPath, Path zipPath) {
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipPath.toFile()))) {

            // Usamos un array de 1 elemento para contar archivos dentro del stream
            final boolean[] archivosEncontrados = {false};

            try (Stream<Path> paths = Files.walk(sourceFolderPath)) {
                paths.filter(path -> !path.equals(sourceFolderPath)) // Ignorar la carpeta raíz en sí
                        .forEach(path -> {
                            // Crear la entrada del ZIP relativa a la carpeta raíz
                            String zipEntryName = sourceFolderPath.relativize(path).toString().replace("\\", "/");

                            try {
                                if (Files.isDirectory(path)) {
                                    // Las carpetas deben terminar en / en un ZIP
                                    zos.putNextEntry(new ZipEntry(zipEntryName + "/"));
                                    zos.closeEntry();
                                } else {
                                    // Es un archivo
                                    zos.putNextEntry(new ZipEntry(zipEntryName));
                                    Files.copy(path, zos);
                                    zos.closeEntry();
                                    System.out.println(" -> Comprimido: " + zipEntryName);
                                    archivosEncontrados[0] = true;
                                }
                            } catch (IOException e) {
                                System.err.println("Error al comprimir archivo individual: " + path + " : " + e.getMessage());
                            }
                        });
            }

            if (!archivosEncontrados[0]) {
                System.out.println("La carpeta existe pero no contenía archivos, solo subcarpetas vacías o nada.");
                // Si quieres enviar el zip vacío, retorna true. Si no, false.
                // Retornamos true para que se envíe el zip vacío al menos, o false para evitarlo.
                // Generalmente mejor false si está 100% vacío.
                return false;
            }
            return true;

        } catch (IOException e) {
            System.err.println("Error creando el archivo ZIP: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private void validarTransicionEstado(String actual, String nuevo) {
        if (actual == null || nuevo == null) return;
        String a = actual.toUpperCase();
        String n = nuevo.toUpperCase();
        if (a.equals("CERRADA") && !n.equals("CERRADA")) {
            throw new IllegalStateException("No se puede reabrir una orden cerrada.");
        }
    }

    /* =============================
       DETALLE COMPLETO
       ============================= */
    @Transactional(readOnly = true)
    public OrdenTrabajoDetalleDto obtenerDetalle(Long ordenId, Authentication auth) {

        var orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        var usuarioAuth = usuarioRepository.findByCorreo(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));

        boolean esTecnico = usuarioAuth.getRol() != null
                && "ROLE_TECNICO".equals(usuarioAuth.getRol().getNombre());

        if (esTecnico) {
            if (orden.getTecnicoAsignado() == null ||
                    !orden.getTecnicoAsignado().getCedula().equals(usuarioAuth.getCedula())) {
                throw new RuntimeException("No tienes acceso a esta orden de trabajo");
            }
        }
        var cliente = orden.getCliente();
        var tecnico = orden.getTecnicoAsignado();
        var equipo  = orden.getEquipo();

        var fichas = fichaTecnicaRepository.findByOrdenTrabajoId(ordenId);

        Long fichaId = null;
        Instant fechaFicha = null;
        String observacionesFicha = null;
        String tecnicoFichaCedula = null;
        String tecnicoFichaNombre = null;

// Tomar la primera ficha (o la más reciente si prefieres)
        if (!fichas.isEmpty()) {
            var ficha = fichas.get(0); // Primera ficha de la lista
            fichaId = ficha.getId();
            fechaFicha = ficha.getFechaCreacion();
            observacionesFicha = ficha.getObservaciones();
            tecnicoFichaCedula = ficha.getTecnicoId();
            if (tecnicoFichaCedula != null) {
                tecnicoFichaNombre = usuarioRepository.findById(tecnicoFichaCedula)
                        .map(Usuario::getNombre)
                        .orElse(null);
            }
        }

        return new OrdenTrabajoDetalleDto(
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getFechaHoraIngreso(),
                orden.getMedioContacto(),
                orden.getEstado(),
                orden.getTipoServicio(),
                orden.getPrioridad(),
                tecnico != null ? tecnico.getCedula() : null,
                tecnico != null ? tecnico.getNombre() : null,
                tecnico != null ? tecnico.getTelefono() : null,
                tecnico != null ? tecnico.getCorreo() : null,
                cliente != null ? cliente.getCedula() : null,
                cliente != null ? cliente.getNombre() : null,
                cliente != null ? cliente.getTelefono() : null,
                cliente != null ? cliente.getDireccion() : null,
                cliente != null ? cliente.getCorreo() : null,
                equipo != null ? equipo.getIdEquipo() : null,
                equipo != null ? equipo.getTipo() : null,
                equipo != null ? equipo.getMarca() : null,
                equipo != null ? equipo.getModelo() : null,
                equipo != null ? equipo.getNumeroSerie() : null,
                equipo != null ? equipo.getHostname() : null,
                equipo != null ? equipo.getSistemaOperativo() : null,
                equipo != null ? equipo.getHardwareJson() : null,
                orden.getContrasenaEquipo(),
                orden.getAccesorios(),
                orden.getProblemaReportado(),
                orden.getObservacionesIngreso(),
                orden.getFechaHoraRecepcion(),
                orden.isFirmaTecnicoRecepcion(),
                orden.isFirmaClienteRecepcion(),
                orden.getDiagnosticoTrabajo(),
                orden.getObservacionesRecomendaciones(),
                orden.getModalidad(),
                orden.getFechaHoraEntrega(),
                orden.getNumeroFactura(),
                orden.getFormaPago(),
                orden.isFirmaTecnicoEntrega(),
                orden.isFirmaClienteEntrega(),
                orden.isRecibeASatisfaccion(),
                orden.getSubtotal(),
                orden.getIva(),
                orden.getTotal(),
                orden.getEsEnGarantia(),
                orden.getReferenciaOrdenGarantia(),
                orden.getMotivoCierre(),
                orden.getCerradaPor(),
                orden.getOtpCodigo(),
                orden.getOtpValidado(),
                orden.getOtpFechaValidacion(),
                fichaId,
                fechaFicha,
                observacionesFicha,
                tecnicoFichaCedula,
                tecnicoFichaNombre,
                null
        );
    }

    private OrdenTrabajoDetalleDto obtenerDetalleInterno(Long ordenId) {

    var orden = ordenTrabajoRepository.findById(ordenId)
            .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

    List<OrdenTrabajoCostoDto> costos =
        ordenTrabajoCostoService.listar(ordenId);

    var cliente = orden.getCliente();
    var tecnico = orden.getTecnicoAsignado();
    var equipo  = orden.getEquipo();

    var fichas = fichaTecnicaRepository.findByOrdenTrabajoId(ordenId);

    Long fichaId = null;
    Instant fechaFicha = null;
    String observacionesFicha = null;
    String tecnicoFichaCedula = null;
    String tecnicoFichaNombre = null;

    if (!fichas.isEmpty()) {
        var ficha = fichas.get(0);
        fichaId = ficha.getId();
        fechaFicha = ficha.getFechaCreacion();
        observacionesFicha = ficha.getObservaciones();
        tecnicoFichaCedula = ficha.getTecnicoId();
        if (tecnicoFichaCedula != null) {
            tecnicoFichaNombre = usuarioRepository.findById(tecnicoFichaCedula)
                    .map(Usuario::getNombre)
                    .orElse(null);
        }
    }

     return new OrdenTrabajoDetalleDto(
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getFechaHoraIngreso(),
                orden.getMedioContacto(),
                orden.getEstado(),
                orden.getTipoServicio(),
                orden.getPrioridad(),
                tecnico != null ? tecnico.getCedula() : null,
                tecnico != null ? tecnico.getNombre() : null,
                tecnico != null ? tecnico.getTelefono() : null,
                tecnico != null ? tecnico.getCorreo() : null,
                cliente != null ? cliente.getCedula() : null,
                cliente != null ? cliente.getNombre() : null,
                cliente != null ? cliente.getTelefono() : null,
                cliente != null ? cliente.getDireccion() : null,
                cliente != null ? cliente.getCorreo() : null,
                equipo != null ? equipo.getIdEquipo() : null,
                equipo != null ? equipo.getTipo() : null,
                equipo != null ? equipo.getMarca() : null,
                equipo != null ? equipo.getModelo() : null,
                equipo != null ? equipo.getNumeroSerie() : null,
                equipo != null ? equipo.getHostname() : null,
                equipo != null ? equipo.getSistemaOperativo() : null,
                equipo != null ? equipo.getHardwareJson() : null,
                orden.getContrasenaEquipo(),
                orden.getAccesorios(),
                orden.getProblemaReportado(),
                orden.getObservacionesIngreso(),
                orden.getFechaHoraRecepcion(),
                orden.isFirmaTecnicoRecepcion(),
                orden.isFirmaClienteRecepcion(),
                orden.getDiagnosticoTrabajo(),
                orden.getObservacionesRecomendaciones(),
                orden.getModalidad(),
                orden.getFechaHoraEntrega(),
                orden.getNumeroFactura(),
                orden.getFormaPago(),
                orden.isFirmaTecnicoEntrega(),
                orden.isFirmaClienteEntrega(),
                orden.isRecibeASatisfaccion(),
                orden.getSubtotal(),
                orden.getIva(),
                orden.getTotal(),
                orden.getEsEnGarantia(),
                orden.getReferenciaOrdenGarantia(),
                orden.getMotivoCierre(),
                orden.getCerradaPor(),
                orden.getOtpCodigo(),
                orden.getOtpValidado(),
                orden.getOtpFechaValidacion(),
                fichaId,
                fechaFicha,
                observacionesFicha,
                tecnicoFichaCedula,
                tecnicoFichaNombre,
                costos
    );
}


    /* =============================
       LISTAR ÓRDENES
       ============================= */
    @Transactional(readOnly = true)
    public List<OrdenTrabajoListaDto> listarOrdenes() {
        return ordenTrabajoRepository.findAll()
                .stream()
                .map(this::mapToListaDto)
                .toList();
    }

    private OrdenTrabajoListaDto mapToListaDto(OrdenTrabajo orden) {
        var cliente = orden.getCliente();
        var tecnico = orden.getTecnicoAsignado();
        var equipo  = orden.getEquipo();

        List<ImagenDto> imagenes = orden.getImagenes()
                .stream()
                .map(img -> new ImagenDto(
                        img.getId(),
                        img.getRuta(),
                        img.getCategoria(),
                        img.getDescripcion(),
                        img.getFechaSubida()
                ))
                .toList();

        return new OrdenTrabajoListaDto(
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getEstado(),
                orden.getTipoServicio(),
                orden.getPrioridad(),
                orden.getFechaHoraIngreso(),
                orden.getFechaHoraEntrega(),
                orden.getMedioContacto(),
                orden.getModalidad(),
                cliente != null ? cliente.getCedula() : null,
                cliente != null ? cliente.getNombre() : null,
                tecnico != null ? tecnico.getCedula() : null,
                tecnico != null ? tecnico.getNombre() : null,
                equipo != null ? equipo.getIdEquipo()  : null,
                equipo != null ? equipo.getModelo()    : null,
                equipo != null ? equipo.getHostname()  : null,
                orden.getProblemaReportado(),
                orden.getObservacionesIngreso(),
                orden.getDiagnosticoTrabajo(),
                orden.getObservacionesRecomendaciones(),
                imagenes
        );
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoListaDto> listarOrdenesPorTecnico(String cedulaTecnico) {
        return ordenTrabajoRepository
                .findByTecnicoAsignado_CedulaOrderByFechaHoraIngresoDesc(cedulaTecnico)
                .stream()
                .map(this::mapToListaDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoListaDto> listarMisOrdenes(Authentication auth) {
        var usuarioAuth = usuarioRepository.findByCorreo(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
        return listarOrdenesPorTecnico(usuarioAuth.getCedula());
    }

    

    
}