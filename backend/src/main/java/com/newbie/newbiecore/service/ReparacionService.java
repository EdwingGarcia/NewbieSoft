package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Reparacion;
import com.newbie.newbiecore.repository.ReparacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ReparacionService {

    private final ReparacionRepository reparacionRepository;

    public ReparacionService(ReparacionRepository reparacionRepository) {
        this.reparacionRepository = reparacionRepository;
    }

    // Listar reparaciones asignadas al técnico logueado
    public List<Reparacion> listarPorTecnico(String cedulaTecnico) {
        return reparacionRepository.findByTecnico_Cedula(cedulaTecnico);
    }

    // Ver detalle de reparación
    public Optional<Reparacion> obtenerPorId(Long id) {
        return reparacionRepository.findById(id);
    }

    // Registrar diagnóstico inicial
    public Optional<Reparacion> registrarDiagnostico(Long id, String diagnostico) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setDiagnostico(diagnostico);
            rep.setEstado("EN_DIAGNOSTICO");
            return reparacionRepository.save(rep);
        });
    }

    // Subir archivo XML (ejemplo: guardar como observación o en otro campo)
    public Optional<Reparacion> subirXml(Long id, MultipartFile file) throws IOException {
        return reparacionRepository.findById(id).map(rep -> {
            try {
                String contenido = new String(file.getBytes());
                rep.setObservaciones((rep.getObservaciones() != null ? rep.getObservaciones() + "\n" : "")
                        + "XML:\n" + contenido);
                return reparacionRepository.save(rep);
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar XML", e);
            }
        });
    }

    // Subir evidencia (ejemplo: guardar referencia en observaciones)
    public Optional<Reparacion> subirEvidencia(Long id, MultipartFile file) throws IOException {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setObservaciones((rep.getObservaciones() != null ? rep.getObservaciones() + "\n" : "")
                    + "Evidencia subida: " + file.getOriginalFilename());
            return reparacionRepository.save(rep);
        });
    }

    // Actualizar datos técnicos
    public Optional<Reparacion> actualizar(Long id, Reparacion datos) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setObservaciones(datos.getObservaciones());
            rep.setCostoTotal(datos.getCostoTotal());
            rep.setEstado(datos.getEstado());
            return reparacionRepository.save(rep);
        });
    }

    // Cerrar reparación con informe final
    public Optional<Reparacion> cerrar(Long id, String informeFinal) {
        return reparacionRepository.findById(id).map(rep -> {
            rep.setObservaciones((rep.getObservaciones() != null ? rep.getObservaciones() + "\n" : "")
                    + "Informe Final: " + informeFinal);
            rep.setEstado("FINALIZADO");
            rep.setFechaFin(Instant.now());
            return reparacionRepository.save(rep);
        });
    }

    // Historial por número de serie (usando Equipo)
    public List<Reparacion> historialPorEquipo(Long equipoId) {
        return reparacionRepository.findByEquipo_IdEquipo(equipoId);
    }
}