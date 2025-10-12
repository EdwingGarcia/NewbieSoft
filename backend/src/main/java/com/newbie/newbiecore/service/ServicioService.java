package com.newbie.newbiecore.service;
import com.newbie.newbiecore.entity.Servicio;
import com.newbie.newbiecore.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServicioService {
    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    public Servicio crearServicio(Servicio servicio) {
        return servicioRepository.save(servicio);
    }

    public List<Servicio> listarServicios() {
        return servicioRepository.findAll();
    }
}
