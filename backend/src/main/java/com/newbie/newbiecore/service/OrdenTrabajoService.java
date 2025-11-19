package com.newbie.newbiecore.service;

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
    public OrdenTrabajoIngresoDto crearOrden(CrearOrdenTrabajoRequest request) {

        System.out.println("clienteCedula = " + request.getClienteCedula());
        System.out.println("tecnicoCedula = " + request.getTecnicoCedula());
        System.out.println("equipoId      = " + request.getEquipoId());

        var cliente = usuarioRepository.findById(request.getClienteCedula())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        var tecnico = usuarioRepository.findById(request.getTecnicoCedula())
                .orElseThrow(() -> new RuntimeException("Técnico no encontrado"));

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

    @Transactional
    public void actualizarEntrega(Long ordenId, ActualizarEntregaRequest request) {
        var orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        // Detalle de trabajo
        orden.setDiagnosticoTrabajo(request.diagnosticoTrabajo());
        orden.setObservacionesRecomendaciones(request.observacionesRecomendaciones());
        orden.setModalidad(request.modalidad());

        // Entrega (si no viene fecha, se usa ahora)
        Instant fechaEntrega = request.fechaHoraEntrega() != null
                ? request.fechaHoraEntrega()
                : Instant.now();
        orden.setFechaHoraEntrega(fechaEntrega);

        orden.setNumeroFactura(request.numeroFactura());
        orden.setFormaPago(request.formaPago());
        orden.setFirmaTecnicoEntrega(request.firmaTecnicoEntrega());
        orden.setFirmaClienteEntrega(request.firmaClienteEntrega());
        orden.setRecibeASatisfaccion(request.recibeASatisfaccion());

        // Estado final
        orden.setEstado("CERRADO");

        ordenTrabajoRepository.save(orden);
    }

    /* =============================
       DETALLE COMPLETO
       ============================= */

    @Transactional(readOnly = true)
    public OrdenTrabajoDetalleDto obtenerDetalle(Long ordenId) {
        var orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

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

            // Ahora la ficha solo tiene tecnicoId (cedula)
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

                // Técnico asignado
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
                equipo.getHostname(),
                equipo.getSistemaOperativo(),
                equipo.getHardwareJson(),

                // Ingreso
                orden.getContrasenaEquipo(),
                orden.getAccesorios(),
                orden.getProblemaReportado(),
                orden.getObservacionesIngreso(),

                // Recepción
                orden.getFechaHoraRecepcion(),
                orden.isFirmaTecnicoRecepcion(),
                orden.isFirmaClienteRecepcion(),

                // Entrega
                orden.getDiagnosticoTrabajo(),
                orden.getObservacionesRecomendaciones(),
                orden.getModalidad(),
                orden.getFechaHoraEntrega(),
                orden.getNumeroFactura(),
                orden.getFormaPago(),
                orden.isFirmaTecnicoEntrega(),
                orden.isFirmaClienteEntrega(),
                orden.isRecibeASatisfaccion(),

                // Ficha técnica (meta)
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
}
