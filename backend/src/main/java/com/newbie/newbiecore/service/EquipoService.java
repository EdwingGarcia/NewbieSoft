package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EquipoService {
    private final EquipoRepository equipoRepository;
    private final UsuarioRepository usuarioRepository;
    public EquipoService(EquipoRepository equipoRepository,UsuarioRepository usuarioRepository) {
        this.equipoRepository = equipoRepository;
        this.usuarioRepository =  usuarioRepository;
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
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<EquipoDto> listarTodosLosEquipos() {
        return equipoRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
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

}
