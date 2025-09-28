package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Reparacion;
import com.newbie.newbiecore.repository.ReparacionRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ReparacionService {
    private final ReparacionRepository reparacionRepository;

    public ReparacionService(ReparacionRepository reparacionRepository) {
        this.reparacionRepository = reparacionRepository;
    }

    public Reparacion crearReparacion(Reparacion reparacion) {
        return reparacionRepository.save(reparacion);
    }

    public Optional<Reparacion> buscarPorId(Long id) {
        return reparacionRepository.findById(id);
    }

    public List<Reparacion> listarPorTecnico(Long tecnicoId) {
        return reparacionRepository.findByTecnico_IdUsuario(tecnicoId);
    }
}
