package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.FichaTecnicaDTO;
import com.newbie.newbiecore.dto.FichaTecnicaMapper;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.FichaTecnica;
import com.newbie.newbiecore.entity.FichaTecnicaImagen;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
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

    // Carpeta donde se guardan los archivos localmente
    private final Path uploadPath;

    public FichaTecnicaService(FichaTecnicaRepository fichaTecnicaRepository,
                               UsuarioRepository usuarioRepository,
                               EquipoRepository equipoRepository,
                               @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.fichaTecnicaRepository = fichaTecnicaRepository;
        this.usuarioRepository = usuarioRepository;
        this.equipoRepository = equipoRepository;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear la carpeta de uploads", e);
        }
    }

    /** 🆕 Crear una nueva ficha técnica */
    @Transactional
    public FichaTecnica crearNueva(String cedulaTecnico, Long equipoId, String observaciones) {
        Usuario tecnico = usuarioRepository.findById(cedulaTecnico)
                .orElseThrow(() -> new IllegalArgumentException("Técnico no encontrado"));

        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado"));

        FichaTecnica ficha = FichaTecnica.builder()
                .tecnico(tecnico)
                .equipo(equipo)
                .observaciones(observaciones)
                .fechaCreacion(Instant.now())
                .build();

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

    /** 📸 Subir una o más imágenes locales */
    @Transactional
    public FichaTecnica subirImagenesLocal(Long fichaId, List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Debes enviar al menos un archivo");
        }

        FichaTecnica ficha = fichaTecnicaRepository.findById(fichaId)
                .orElseThrow(() -> new IllegalArgumentException("Ficha técnica no encontrada"));

        // Crear carpeta: fichaId-modeloEquipo(idEquipo)
        String folderName = ficha.getId() + "-" + ficha.getEquipo().getModelo()
                + "(" + ficha.getEquipo().getIdEquipo() + ")";
        Path folderPath = uploadPath.resolve(folderName);
        Files.createDirectories(folderPath);

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path filePath = folderPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String relativeUrl = "/uploads/" + folderName + "/" + fileName;

            FichaTecnicaImagen img = FichaTecnicaImagen.builder()
                    .fichaTecnica(ficha)
                    .ruta(relativeUrl)
                    .build();

            ficha.getImagenes().add(img);
        }

        return fichaTecnicaRepository.save(ficha);
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
