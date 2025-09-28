package com.newbie.newbiecore.service;


import com.newbie.newbiecore.entity.Cita;
import com.newbie.newbiecore.repository.CitaRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;

@Service
public class CitaService {
    private final CitaRepository citaRepository;

    public CitaService(CitaRepository citaRepository) {
        this.citaRepository = citaRepository;
    }

    public Cita agendarCita(Cita cita) {
        return citaRepository.save(cita);
    }

    public List<Cita> listarPorCliente(Long clienteId) {
        return citaRepository.findByCliente_IdCliente(clienteId);
    }

    public List<Cita> listarPorTecnico(Long tecnicoId) {
        return citaRepository.findByTecnico_IdUsuario(tecnicoId);
    }

    public List<Cita> listarPorRango(Instant inicio, Instant fin) {
        return citaRepository.findByFechaBetween(inicio, fin);
    }
}
