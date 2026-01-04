package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.Cita.CitaRequest;
import com.newbie.newbiecore.entity.Cita;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.CitaRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CitaService {

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Cita agendarCita(CitaRequest request) {
        // Busca usuario por su ID (Cédula)
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado con ID: " + request.getUsuarioId()));

        Cita nuevaCita = new Cita();
        nuevaCita.setUsuario(usuario);
        nuevaCita.setFechaProgramada(request.getFechaHoraInicio());
        nuevaCita.setFechaCreacion(LocalDateTime.now());
        nuevaCita.setMotivo(request.getMotivo());
        nuevaCita.setEstado("PENDIENTE");

        return citaRepository.save(nuevaCita);
    }

    public List<Cita> obtenerCitasPorUsuario(String usuarioId) {
        // PASO 1: Buscamos la entidad Usuario completa usando el repositorio de usuarios
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // PASO 2: Usamos el usuario encontrado para filtrar en CitaRepository
        return citaRepository.findByUsuario(usuario);
    }

    public List<Cita> obtenerTodasLasCitas() {
        return citaRepository.findAll();
    }
}