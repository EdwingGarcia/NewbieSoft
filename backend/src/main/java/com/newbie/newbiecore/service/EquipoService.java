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
                .build();
    }

    @Transactional
    public Equipo procesarXmlYActualizar(Long equipoId, MultipartFile xml) {
        return equipoRepository.findById(equipoId).map(eq -> {
            try (InputStream in = xml.getInputStream()) {
                var hw = parser.parse(in);

                // Campos principales del equipo
                eq.setHostname(hw.general.hostname);
                eq.setMarca(firstNonNull(hw.mobo.fabricante, hw.general.marca));
                eq.setModelo(firstNonNull(hw.mobo.modelo, hw.cpu.nombre));
                if (hw.mobo.serie != null && !hw.mobo.serie.isBlank()) {
                    eq.setNumeroSerie(hw.mobo.serie);
                }
                eq.setSistemaOperativo(hw.general.so);
                eq.setFechaRegistro(Instant.now());

                // Snapshot completo en JSON (usa JsonNode en la entidad con
                // @JdbcTypeCode(JSON))
                JsonNode json = mapper.valueToTree(hw);
                eq.setHardwareJson(json);

                return equipoRepository.save(eq);
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
