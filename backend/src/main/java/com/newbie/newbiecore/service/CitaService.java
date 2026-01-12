package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.Cita.CitaRequest;
import com.newbie.newbiecore.entity.Cita;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.CitaRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;

    public Cita agendarCita(CitaRequest request) {

        if (request.getClienteId() == null || request.getClienteId().trim().isEmpty())
            throw new RuntimeException("clienteId es obligatorio");

        if (request.getFechaHoraInicio() == null)
            throw new RuntimeException("fechaHoraInicio es obligatorio");

        if (request.getMotivo() == null || request.getMotivo().trim().isEmpty())
            throw new RuntimeException("motivo es obligatorio");

        Usuario cliente = usuarioRepository.findById(request.getClienteId().trim())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + request.getClienteId()));

        Usuario tecnico = null;
        if (request.getTecnicoAsignadoId() != null && !request.getTecnicoAsignadoId().trim().isEmpty()) {
            tecnico = usuarioRepository.findById(request.getTecnicoAsignadoId().trim())
                    .orElseThrow(() -> new RuntimeException("Técnico no encontrado: " + request.getTecnicoAsignadoId()));
        }

        Cita nueva = Cita.builder()
                .usuario(cliente) // cliente
                .tecnico(tecnico) // opcional
                .fechaProgramada(request.getFechaHoraInicio())
                .motivo(request.getMotivo().trim())
                // fechaCreacion y estado se setean en @PrePersist si no los mandas
                .build();

        return citaRepository.save(nueva);
    }

    public List<Cita> obtenerCitasPorCliente(String clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return citaRepository.findByUsuario(cliente);
    }

    public List<Cita> obtenerCitasPorTecnico(String tecnicoId) {
        Usuario tecnico = usuarioRepository.findById(tecnicoId)
                .orElseThrow(() -> new RuntimeException("Técnico no encontrado"));
        return citaRepository.findByTecnico(tecnico);
    }

    public List<Cita> obtenerTodasLasCitas() {
        return citaRepository.findAll();
    }
    public boolean marcarComoCompletada(Long citaId) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));

        String estadoActual = cita.getEstado(); // "PENDIENTE", "COMPLETADA", etc.

        // ✅ Si ya está completada, no hay cambio -> false
        if (estadoActual != null && estadoActual.equalsIgnoreCase("COMPLETADA")) {
            return false;
        }

        // (Opcional) Solo permitir pasar desde PENDIENTE
        if (estadoActual != null && !estadoActual.equalsIgnoreCase("PENDIENTE")) {
            return false;
        }

        cita.setEstado("COMPLETADA");
        citaRepository.save(cita);
        return true;
    }
}
