package com.newbie.newbiecore.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import com.newbie.newbiecore.util.HwiXmlParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;


import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.newbie.newbiecore.dto.EquipoListDto;

@Service
public class EquipoService {

    private final EquipoRepository equipoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper mapper;
    private final HwiXmlParser parser;

    public EquipoService(EquipoRepository equipoRepository,
            UsuarioRepository usuarioRepository,
            ObjectMapper mapper,
            HwiXmlParser parser) {
        this.equipoRepository = equipoRepository;
        this.usuarioRepository = usuarioRepository;
        this.mapper = mapper;
        this.parser = parser;
    }
    public List<EquipoListDto> listarTodosParaCombobox() {
        return equipoRepository.findAll()
                .stream()
                .map(this::mapToListDto)
                .toList();
    }


    public Equipo registrarEquipo(EquipoDto equipoDto, Authentication auth) {
        Usuario cliente = usuarioRepository.findById(equipoDto.getCedulaCliente())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Usuario actor = getUsuarioAutenticado(auth); 
            boolean esAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            boolean esTecnico = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_TECNICO"));

            Usuario tecnicoAsignado;

            if (esAdmin) {
            // Admin debe mandar tecnicoCedula (combo)
            if (equipoDto.getTecnicoCedula() == null || equipoDto.getTecnicoCedula().isBlank()) {
                throw new RuntimeException("Admin debe seleccionar un técnico (tecnicoCedula).");
            }
            tecnicoAsignado = usuarioRepository.findById(equipoDto.getTecnicoCedula())
                    .orElseThrow(() -> new RuntimeException("Técnico no encontrado"));
            } else if (esTecnico) {
                // Técnico se asigna automáticamente a sí mismo
                tecnicoAsignado = actor;
            } else {
                throw new RuntimeException("Rol no permitido para crear equipos.");
            }

        Equipo e = Equipo.builder()
                .usuario(cliente)
                .tecnico(tecnicoAsignado)
                .numeroSerie(equipoDto.getNumeroSerie())
                .modelo(equipoDto.getModelo())
                .marca(equipoDto.getMarca())
                .fechaRegistro(Instant.now())
                .build();
        return equipoRepository.save(e);
    }
    public EquipoDto obtenerPorId(Long id) {
        return equipoRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado con ID: " + id));
    }

    public List<EquipoDto> listarPorCliente(String clienteCedula) {
        return equipoRepository.findByUsuario_Cedula(clienteCedula)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<EquipoDto> listarTodosLosEquipos() {
        return equipoRepository.findAll()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private EquipoDto mapToDto(Equipo equipo) {
        return EquipoDto.builder()
                .id(equipo.getIdEquipo())
                .numeroSerie(equipo.getNumeroSerie())
                .modelo(equipo.getModelo())
                .marca(equipo.getMarca())
                .cedulaCliente(equipo.getUsuario().getCedula())
                .tecnicoCedula(equipo.getTecnico().getCedula())
                .tecnicoNombre(equipo.getTecnico().getNombre())
                .hardwareJson(equipo.getHardwareJson())
                .build();
    }

    @Transactional
    public Equipo procesarXmlYActualizar(Long equipoId, MultipartFile xml) {
        return equipoRepository.findById(equipoId).map(eq -> {
            try {
                // Leer una sola vez y reutilizar
                byte[] bytes = xml.getBytes();
                try (InputStream in1 = new java.io.ByteArrayInputStream(bytes)) {

                    // 👉 Construir solo el mapa byEntry
                    // (usa el método collectByEntry que ya agregamos en HwiXmlParser)
                    Map<String, String> byEntry = parser.collectByEntry(in1);

                    // (Opcional) Aun puedes actualizar columnas del equipo si quieres
                    // usando valores específicos de byEntry, por ejemplo:
                    eq.setHostname(byEntry.getOrDefault("Nombre del computadora", eq.getHostname()));
                    eq.setSistemaOperativo(byEntry.getOrDefault("Sistema operativo", eq.getSistemaOperativo()));
                    eq.setFechaRegistro(Instant.now());

                    // 👉 Guardar SOLO el byEntry en JSONB
                    com.fasterxml.jackson.databind.JsonNode jsonOnlyByEntry = mapper.valueToTree(byEntry);
                    eq.setHardwareJson(jsonOnlyByEntry);

                    return equipoRepository.save(eq);
                }
            } catch (Exception e) {
                throw new RuntimeException("No se pudo procesar/guardar el XML", e);
            }
        }).orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado: " + equipoId));
    }

    private String firstNonNull(String... xs) {
        for (String s : xs)
            if (s != null && !s.isBlank())
                return s;
        return null;
    }

    private Usuario getUsuarioAutenticado(Authentication auth) {
    String principal = auth.getName(); // puede ser cedula o correo
    return usuarioRepository.findById(principal)
            .or(() -> usuarioRepository.findByCorreo(principal))
            .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado: " + principal));
    }

    public List<EquipoDto> listarMisEquipos(Authentication auth) {
    Usuario tecnico = getUsuarioAutenticado(auth);

    boolean esTecnico = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_TECNICO"));
    if (!esTecnico) throw new RuntimeException("Solo técnicos pueden consultar mis-equipos.");

    return equipoRepository.findByTecnico_Cedula(tecnico.getCedula())
            .stream().map(this::mapToDto)
            .collect(Collectors.toList());  
    }
    private EquipoListDto mapToListDto(Equipo equipo) {
        return EquipoListDto.builder()
                .idEquipo(equipo.getIdEquipo())
                .tipo(equipo.getTipo())                 // ⚠️ si no existe, mira nota abajo
                .marca(equipo.getMarca())
                .modelo(equipo.getModelo())
                .numeroSerie(equipo.getNumeroSerie())
                .hostname(equipo.getHostname())
                .sistemaOperativo(equipo.getSistemaOperativo())
                .propietario(equipo.getUsuario().getNombre() + " (" + equipo.getUsuario().getCedula() + ")")
                .build();
    }
}
