package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.ReparacionCreateDTO;
import com.newbie.newbiecore.dto.ReparacionResponseDTO;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.Reparacion;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.ReparacionRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ReparacionService {

    private final ReparacionRepository reparacionRepository;
    private final EquipoRepository equipoRepository;
    private final UsuarioRepository usuarioRepository;

    public ReparacionService(ReparacionRepository reparacionRepository,
                             EquipoRepository equipoRepository,
                             UsuarioRepository usuarioRepository) {
        this.reparacionRepository = reparacionRepository;
        this.equipoRepository = equipoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Optional<Reparacion> crearReparacion(ReparacionCreateDTO dto) {
        Optional<Equipo> equipoOpt = equipoRepository.findById(dto.getEquipoId());
        if (equipoOpt.isEmpty()) return Optional.empty();

        Usuario tecnico = null;
        if (dto.getTecnicoId() != null) {
            tecnico = usuarioRepository.findById(dto.getTecnicoId()).orElse(null);
        }

        Reparacion nueva = Reparacion.builder()
                .equipo(equipoOpt.get())
                .tecnico(tecnico)
                .fechaInicio(dto.getFechaInicio() != null ? dto.getFechaInicio() : Instant.now())
                .estado(dto.getEstado() != null ? dto.getEstado() : "PENDIENTE")
                .diagnostico(dto.getDiagnostico())
                .observaciones(dto.getObservaciones())
                .costoTotal(dto.getCostoTotal())
                .build();

        return Optional.of(reparacionRepository.save(nueva));
    }

    public List<ReparacionResponseDTO> listarPorTecnico(String cedulaTecnico) {
        return reparacionRepository.findByTecnico_Cedula(cedulaTecnico)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public Optional<ReparacionResponseDTO> obtenerPorId(Long id) {
        return reparacionRepository.findById(id)
                .map(this::toDto);
    }

    public List<ReparacionResponseDTO> historialPorEquipo(Long equipoId) {
        return reparacionRepository.findByEquipo_IdEquipo(equipoId)
                .stream()
                .map(this::toDto)
                .toList();
    }


    // Registrar diagnóstico inicial
    public Optional<Reparacion> registrarDiagnostico(Long id, String diagnostico) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setDiagnostico(diagnostico);
            rep.setEstado("EN_DIAGNOSTICO");
            return reparacionRepository.save(rep);
        });
    }









    // Subir archivo XML (ejemplo: guardar como observación o en otro campo)
    public Optional<Reparacion> subirXml(Long id, MultipartFile file) throws IOException {
        return reparacionRepository.findById(id).map(rep -> {
            try {
                String contenido = new String(file.getBytes());
                rep.setObservaciones((rep.getObservaciones() != null ? rep.getObservaciones() + "\n" : "")
                        + "XML:\n" + contenido);
                return reparacionRepository.save(rep);
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar XML", e);
            }
        });
    }

    // Subir evidencia (ejemplo: guardar referencia en observaciones)
    public Optional<Reparacion> subirEvidencia(Long id, MultipartFile file) throws IOException {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setObservaciones((rep.getObservaciones() != null ? rep.getObservaciones() + "\n" : "")
                    + "Evidencia subida: " + file.getOriginalFilename());
            return reparacionRepository.save(rep);
        });
    }

    // Actualizar datos técnicos
    public Optional<Reparacion> actualizar(Long id, Reparacion datos) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setObservaciones(datos.getObservaciones());
            rep.setCostoTotal(datos.getCostoTotal());
            rep.setEstado(datos.getEstado());
            return reparacionRepository.save(rep);
        });
    }

    // Cerrar reparación con informe final
    public Optional<Reparacion> cerrar(Long id, String informeFinal) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setObservaciones((rep.getObservaciones() != null ? rep.getObservaciones() + "\n" : "")
                    + "Informe Final: " + informeFinal);
            rep.setEstado("FINALIZADO");
            rep.setFechaFin(Instant.now());
            return reparacionRepository.save(rep);
        });
    }


    // Registrar firma de aceptación (base64 o URL)
    public Optional<Reparacion> registrarFirmaAceptacion(Long id, String firma) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setFirmaAceptacion(firma);
            rep.setFechaFicha(Instant.now());
            return reparacionRepository.save(rep);
        });
    }

    // Registrar firma de conformidad
    public Optional<Reparacion> registrarFirmaConformidad(Long id, String firma) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setFirmaConformidad(firma);
            rep.setFechaFicha(Instant.now());
            return reparacionRepository.save(rep);
        });
    }

    // Subir XML técnico (reemplaza observaciones si lo deseas)
    public Optional<Reparacion> subirXmlDatos(Long id, MultipartFile file) throws IOException {
        return reparacionRepository.findById(id).map(rep -> {
            try {
                String contenido = new String(file.getBytes());
                rep.setXmlDatos(contenido);
                rep.setFechaFicha(Instant.now());
                return reparacionRepository.save(rep);
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar XML técnico", e);
            }
        });
    }

    // Subir fotos (como JSON o CSV de rutas)
    public Optional<Reparacion> subirFotos(Long id, String fotosJson) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setFotos(fotosJson);
            rep.setFechaFicha(Instant.now());
            return reparacionRepository.save(rep);
        });
    }

    private ReparacionResponseDTO toDto(Reparacion entity) {
        ReparacionResponseDTO dto = new ReparacionResponseDTO();
        dto.setIdReparacion(entity.getIdReparacion());

        if (entity.getEquipo() != null) {
            dto.setEquipoId(entity.getEquipo().getIdEquipo());
            dto.setNumeroSerie(entity.getEquipo().getNumeroSerie());
            dto.setModelo(entity.getEquipo().getModelo());
            dto.setMarca(entity.getEquipo().getMarca());
        }

        if (entity.getTecnico() != null) {
            dto.setTecnicoCedula(entity.getTecnico().getCedula());
            dto.setTecnicoNombre(entity.getTecnico().getNombre());
            dto.setTecnicoCorreo(entity.getTecnico().getCorreo());
        }

        dto.setFechaInicio(entity.getFechaInicio());
        dto.setFechaFin(entity.getFechaFin());
        dto.setEstado(entity.getEstado());
        dto.setDiagnostico(entity.getDiagnostico());

        return dto;
    }
}