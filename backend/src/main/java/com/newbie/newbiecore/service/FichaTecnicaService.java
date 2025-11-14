package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;
import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaMapper;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.FichaTecnica;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import com.newbie.newbiecore.util.FichaTecnicaAutoFillHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FichaTecnicaService {

    private final FichaTecnicaRepository fichaTecnicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;



    public FichaTecnicaService(FichaTecnicaRepository fichaTecnicaRepository,
                               UsuarioRepository usuarioRepository,
                               EquipoRepository equipoRepository,
                               OrdenTrabajoRepository ordenTrabajoRepository
                              ) {
        this.fichaTecnicaRepository = fichaTecnicaRepository;
        this.usuarioRepository = usuarioRepository;
        this.equipoRepository = equipoRepository;
        this.ordenTrabajoRepository = ordenTrabajoRepository;

    }

    /**
     * 🆕 Crear una nueva ficha técnica AUTORRELLENADA
     *
     * @param cedulaTecnico   cédula del técnico que crea la ficha
     * @param equipoId        id del equipo
     * @param ordenTrabajoId  id de la orden de trabajo asociada
     * @param observaciones   observaciones escritas por el técnico
     */
    @Transactional
    public FichaTecnica crearONegociar(String cedulaTecnico,
                                       Long equipoId,
                                       Long ordenTrabajoId,
                                       String observaciones) {

        Usuario tecnico = usuarioRepository.findById(cedulaTecnico)
                .orElseThrow(() -> new IllegalArgumentException("Técnico no encontrado"));

        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado"));

        OrdenTrabajo ordenTrabajo = null;
        if (ordenTrabajoId != null) {
            ordenTrabajo = ordenTrabajoRepository.findById(ordenTrabajoId)
                    .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));

            // 👇 Si ya hay ficha para esa OT, la devuelvo y no creo otra
            var existente = fichaTecnicaRepository.findByOrdenTrabajoId(ordenTrabajoId);
            if (existente.isPresent()) {
                return existente.get();
            }
        }

        FichaTecnica ficha = FichaTecnica.builder()
                .tecnico(tecnico)
                .equipo(equipo)
                .ordenTrabajo(ordenTrabajo)
                .observaciones(observaciones)
                .fechaCreacion(Instant.now())
                .build();

        FichaTecnicaAutoFillHelper.rellenarDesdeHardwareJson(ficha, equipo);

        return fichaTecnicaRepository.save(ficha);
    }



    /** 📝 Actualizar observaciones */
    @Transactional
    public Optional<FichaTecnica> actualizarObservaciones(Long fichaId, String observaciones) {
        return fichaTecnicaRepository.findById(fichaId).map(ficha -> {
            ficha.setObservaciones(observaciones);
            return fichaTecnicaRepository.save(ficha);
        });
    }

    /** 🔍 Listar fichas por equipo */
    @Transactional(readOnly = true)
    public List<FichaTecnica> listarPorEquipo(Long equipoId) {
        return fichaTecnicaRepository.findByEquipo_IdEquipo(equipoId);
    }

    /** 🔍 Listar fichas por técnico */
    @Transactional(readOnly = true)
    public List<FichaTecnica> listarPorTecnico(String cedulaTecnico) {
        return fichaTecnicaRepository.findByTecnico_Cedula(cedulaTecnico);
    }



    /** 📋 Listar todas las fichas en formato DTO */
    @Transactional(readOnly = true)
    public List<FichaTecnicaDTO> listarDTO() {
        return fichaTecnicaRepository.findAll()
                .stream()
                .map(FichaTecnicaMapper::toDTO)
                .toList();
    }

    /** 🔍 Obtener ficha técnica en formato DTO */
    @Transactional(readOnly = true)
    public Optional<FichaTecnicaDTO> obtenerDTO(Long id) {
        return fichaTecnicaRepository.findById(id)
                .map(FichaTecnicaMapper::toDTO);
    }
}
