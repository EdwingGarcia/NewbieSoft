package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.FichaTecnica;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class FichaTecnicaService {
    private final FichaTecnicaRepository fichaTecnicaRepository;

    public FichaTecnicaService(FichaTecnicaRepository fichaTecnicaRepository) {
        this.fichaTecnicaRepository = fichaTecnicaRepository;
    }

    public FichaTecnica guardarFicha(FichaTecnica ficha) {
        return fichaTecnicaRepository.save(ficha);
    }

    public Optional<FichaTecnica> buscarPorReparacion(Long reparacionId) {
        return fichaTecnicaRepository.findByReparacion_IdReparacion(reparacionId);
    }
}
