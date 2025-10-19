package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Reparacion;
import com.newbie.newbiecore.repository.ReparacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

@Service
public class FichaTecnicaService {

    private final ReparacionRepository reparacionRepository;

    public FichaTecnicaService(ReparacionRepository reparacionRepository) {
        this.reparacionRepository = reparacionRepository;
    }
    // Registrar firma de aceptación (base64 o URL)
    public Optional<Reparacion> registrarFirmaAceptacion(Long id, String firma) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setFirmaAceptacion(firma);
            rep.setFechaFicha(Instant.now());
            return reparacionRepository.save(rep);
        });
    }

    // Registrar firma de conformidad
    public Optional<Reparacion> registrarFirmaConformidad(Long id, String firma) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setFirmaConformidad(firma);
            rep.setFechaFicha(Instant.now());
            return reparacionRepository.save(rep);
        });
    }

    // Subir XML técnico (reemplaza observaciones si lo deseas)
    public Optional<Reparacion> subirXmlDatos(Long id, MultipartFile file) throws IOException {
        return reparacionRepository.findById(id).map(rep -> {
            try {
                String contenido = new String(file.getBytes());
                rep.setXmlDatos(contenido);
                rep.setFechaFicha(Instant.now());
                return reparacionRepository.save(rep);
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar XML técnico", e);
            }
        });
    }

    // Subir fotos (como JSON o CSV de rutas)
    public Optional<Reparacion> subirFotos(Long id, String fotosJson) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setFotos(fotosJson);
            rep.setFechaFicha(Instant.now());
            return reparacionRepository.save(rep);
        });
    }
}
