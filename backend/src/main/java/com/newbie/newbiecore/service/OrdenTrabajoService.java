package com.newbie.newbiecore.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.newbie.newbiecore.dto.OrdenTrabajo.*;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
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

    /* =============================
       CREAR ORDEN (INGRESO)
       ============================= */
    @Transactional
    public OrdenTrabajoIngresoDto crearOrden(CrearOrdenTrabajoRequest request, Authentication auth) {

        System.out.println("clienteCedula = " + request.getClienteCedula());
        System.out.println("tecnicoCedula = " + request.getTecnicoCedula());
        System.out.println("equipoId      = " + request.getEquipoId());

        var usuarioAuth = usuarioRepository.findByCorreo(auth.getName())
        .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));

        boolean esTecnico = usuarioAuth.getRol() != null
                && "ROLE_TECNICO".equals(usuarioAuth.getRol().getNombre());

        Usuario tecnico;

        if (esTecnico) {
            tecnico = usuarioAuth; // 👈 auto-asignado
        } else {
            tecnico = usuarioRepository.findById(request.getTecnicoCedula())
                    .orElseThrow(() -> new RuntimeException("Técnico no encontrado"));
        }

        Usuario cliente = usuarioRepository.findById(request.getClienteCedula())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        var equipo = equipoRepository.findById(request.getEquipoId())
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));

        // Generar número de orden
        String numeroOrden = generarNumeroOrden();

        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden(numeroOrden)
                .medioContacto(request.getMedioContacto())
                .tecnicoAsignado(tecnico)
                .cliente(cliente)
                .equipo(equipo)

                // Información de ingreso
                .contrasenaEquipo(request.getContrasenaEquipo())
                .accesorios(request.getAccesorios())
                .problemaReportado(request.getProblemaReportado())
                .observacionesIngreso(request.getObservacionesIngreso())

                // Clasificación de la orden
                .tipoServicio(request.getTipoServicio())   // DIAGNOSTICO, REPARACION, etc.
                .prioridad(request.getPrioridad())         // BAJA, MEDIA, ALTA, URGENTE

                // Estado inicial
                .estado("PENDIENTE")
                .condicionesAceptadas(true)
                .build();

        OrdenTrabajo guardada = ordenTrabajoRepository.save(orden);

        return mapToIngresoDto(guardada);
    }

    // Puedes ajustar el formato como quieras
    private String generarNumeroOrden() {
        long secuencia = ordenTrabajoRepository.count() + 1;
        // Ej: OT-00001, OT-00002, ...
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

                // Técnico
                tecnico.getCedula(),
                tecnico.getNombre(),
                tecnico.getTelefono(),
                tecnico.getCorreo(),

                // Cliente
                cliente.getCedula(),
                cliente.getNombre(),
                cliente.getTelefono(),
                cliente.getDireccion(),
                cliente.getCorreo(),

                // Equipo
                equipo.getIdEquipo(),
                equipo.getTipo(),
                equipo.getMarca(),
                equipo.getModelo(),
                equipo.getNumeroSerie(),

                // Ingreso
                orden.getContrasenaEquipo(),
                orden.getAccesorios(),

                // Problema + observaciones
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


        // =========================
        // 1) Campos editables (no pisar con null)
        // =========================
        if (request.diagnosticoTrabajo() != null)
            orden.setDiagnosticoTrabajo(request.diagnosticoTrabajo());

        if (request.observacionesRecomendaciones() != null)
            orden.setObservacionesRecomendaciones(request.observacionesRecomendaciones());

        if (request.tipoServicio() != null && !request.tipoServicio().isBlank())
            orden.setTipoServicio(request.tipoServicio().toUpperCase());

        if (request.prioridad() != null && !request.prioridad().isBlank())
            orden.setPrioridad(request.prioridad().toUpperCase());

        // =========================
        // 2) Costos (Double -> BigDecimal)
        // =========================
        if (request.costoManoObra() != null)   orden.setCostoManoObra(bd(request.costoManoObra()));
        if (request.costoRepuestos() != null)  orden.setCostoRepuestos(bd(request.costoRepuestos()));
        if (request.costoOtros() != null)      orden.setCostoOtros(bd(request.costoOtros()));
        if (request.descuento() != null)       orden.setDescuento(bd(request.descuento()));
        if (request.subtotal() != null)        orden.setSubtotal(bd(request.subtotal()));
        if (request.iva() != null)             orden.setIva(bd(request.iva()));
        if (request.total() != null)           orden.setTotal(bd(request.total()));

        // =========================
        // 3) Garantía
        // =========================
        if (request.esEnGarantia() != null) {
            orden.setEsEnGarantia(request.esEnGarantia());

            if (Boolean.TRUE.equals(request.esEnGarantia())) {
                // solo si es garantía, permite referencia
                orden.setReferenciaOrdenGarantia(request.referenciaOrdenGarantia());
            } else {
                orden.setReferenciaOrdenGarantia(null);
            }
        } else if (request.referenciaOrdenGarantia() != null) {
            // si mandan referencia pero no mandan esEnGarantia, solo asigna si ya está en garantía
            if (Boolean.TRUE.equals(orden.getEsEnGarantia())) {
                orden.setReferenciaOrdenGarantia(request.referenciaOrdenGarantia());
            }
        }

        // =========================
        // 4) Cierre info
        // =========================
        if (request.motivoCierre() != null)
            orden.setMotivoCierre(request.motivoCierre());

        if (request.cerradaPor() != null)
            orden.setCerradaPor(request.cerradaPor());

        // =========================
        // 5) OTP
        // =========================
        if (request.otpCodigo() != null)
            orden.setOtpCodigo(request.otpCodigo());

        if (request.otpValidado() != null)
            orden.setOtpValidado(request.otpValidado());

        // =========================
        // 6) Estado (tu lógica)
        // =========================
        if (Boolean.TRUE.equals(request.cerrarOrden())) {

            orden.setEstado("CERRADA");

            if (orden.getFechaHoraEntrega() == null) {
                orden.setFechaHoraEntrega(Instant.now());
            }

        } else if (request.estado() != null && !request.estado().isBlank()) {

            String nuevoEstado = request.estado().toUpperCase();

            // Si esto te bloquea, comenta temporalmente
            validarTransicionEstado(orden.getEstado(), nuevoEstado);

            orden.setEstado(nuevoEstado);

            // si pasa a LISTA_ENTREGA y no hay fecha, setearla
            if ("LISTA_ENTREGA".equals(nuevoEstado) && orden.getFechaHoraEntrega() == null) {
                orden.setFechaHoraEntrega(Instant.now());
            }
        }

        ordenTrabajoRepository.save(orden);
    }


    private void validarTransicionEstado(String actual, String nuevo) {
        if (actual == null || nuevo == null) return;

        String a = actual.toUpperCase();
        String n = nuevo.toUpperCase();

        // 🔒 ÚNICA REGLA: no permitir reabrir una orden cerrada
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

        // Meta de ficha técnica (si existe) — sin imágenes
        var fichaOpt = fichaTecnicaRepository.findByOrdenTrabajoId(ordenId);

        Long fichaId = null;
        Instant fechaFicha = null;
        String observacionesFicha = null;
        String tecnicoFichaCedula = null;
        String tecnicoFichaNombre = null;

        if (fichaOpt.isPresent()) {
            var ficha = fichaOpt.get();
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
                // ===== ORDEN =====
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getFechaHoraIngreso(),
                orden.getMedioContacto(),
                orden.getEstado(),
                orden.getTipoServicio(),
                orden.getPrioridad(),

                // ===== Técnico asignado =====
                tecnico != null ? tecnico.getCedula() : null,
                tecnico != null ? tecnico.getNombre() : null,
                tecnico != null ? tecnico.getTelefono() : null,
                tecnico != null ? tecnico.getCorreo() : null,

                // ===== Cliente =====
                cliente != null ? cliente.getCedula() : null,
                cliente != null ? cliente.getNombre() : null,
                cliente != null ? cliente.getTelefono() : null,
                cliente != null ? cliente.getDireccion() : null,
                cliente != null ? cliente.getCorreo() : null,

                // ===== Equipo =====
                equipo != null ? equipo.getIdEquipo() : null,
                equipo != null ? equipo.getTipo() : null,
                equipo != null ? equipo.getMarca() : null,
                equipo != null ? equipo.getModelo() : null,
                equipo != null ? equipo.getNumeroSerie() : null,
                equipo != null ? equipo.getHostname() : null,
                equipo != null ? equipo.getSistemaOperativo() : null,
                equipo != null ? equipo.getHardwareJson() : null,

                // ===== Ingreso =====
                orden.getContrasenaEquipo(),
                orden.getAccesorios(),
                orden.getProblemaReportado(),
                orden.getObservacionesIngreso(),

                // ===== Recepción =====
                orden.getFechaHoraRecepcion(),
                orden.isFirmaTecnicoRecepcion(),
                orden.isFirmaClienteRecepcion(),

                // ===== Entrega =====
                orden.getDiagnosticoTrabajo(),
                orden.getObservacionesRecomendaciones(),
                orden.getModalidad(),
                orden.getFechaHoraEntrega(),
                orden.getNumeroFactura(),
                orden.getFormaPago(),
                orden.isFirmaTecnicoEntrega(),
                orden.isFirmaClienteEntrega(),
                orden.isRecibeASatisfaccion(),

                // ✅ ECONÓMICOS (ESTO ES LO QUE TE FALTABA)
                orden.getCostoManoObra(),
                orden.getCostoRepuestos(),
                orden.getCostoOtros(),
                orden.getDescuento(),
                orden.getSubtotal(),
                orden.getIva(),
                orden.getTotal(),

                // ✅ GARANTÍA / CIERRE
                orden.getEsEnGarantia(),
                orden.getReferenciaOrdenGarantia(),
                orden.getMotivoCierre(),
                orden.getCerradaPor(),

                // ✅ OTP
                orden.getOtpCodigo(),
                orden.getOtpValidado(),
                orden.getOtpFechaValidacion(),

                // ===== Ficha técnica (meta) =====
                fichaId,
                fechaFicha,
                observacionesFicha,
                tecnicoFichaCedula,
                tecnicoFichaNombre
        );
    }

    /* =============================
       LISTAR ÓRDENES (dashboard)
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

        String cedulaTecnico = usuarioAuth.getCedula();

        return listarOrdenesPorTecnico(cedulaTecnico);
    }

}
