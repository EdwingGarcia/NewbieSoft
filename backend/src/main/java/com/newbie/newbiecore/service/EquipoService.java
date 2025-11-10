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

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    public Equipo registrarEquipo(EquipoDto equipoDto) {
        Usuario usuario = usuarioRepository.findById(equipoDto.getCedulaCliente())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Equipo e = Equipo.builder()
                .usuario(usuario)
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
}
