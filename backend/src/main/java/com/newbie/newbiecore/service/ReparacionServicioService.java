package com.newbie.newbiecore.service;


import com.newbie.newbiecore.entity.ReparacionServicio;
import com.newbie.newbiecore.repository.ReparacionServicioRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReparacionServicioService {
    private final ReparacionServicioRepository reparacionServicioRepository;

    public ReparacionServicioService(ReparacionServicioRepository reparacionServicioRepository) {
        this.reparacionServicioRepository = reparacionServicioRepository;
    }

    public ReparacionServicio guardar(ReparacionServicio reparacionServicio) {
        return reparacionServicioRepository.save(reparacionServicio);
    }

    public List<ReparacionServicio> listarPorReparacion(Long reparacionId) {
        return reparacionServicioRepository.findByReparacion_IdReparacion(reparacionId);
    }
}
