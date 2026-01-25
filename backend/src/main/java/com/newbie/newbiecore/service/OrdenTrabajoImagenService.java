package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.OrdenTrabajo.ImagenDto;
import com.newbie.newbiecore.entity.CategoriaImagen;
import com.newbie.newbiecore.entity.Imagen;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.repository.OrdenTrabajoImagenRepository;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RefreshScope
public class OrdenTrabajoImagenService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final OrdenTrabajoImagenRepository ordenTrabajoImagenRepository;
    private final Path uploadPath;

    public OrdenTrabajoImagenService(OrdenTrabajoRepository ordenTrabajoRepository,
            OrdenTrabajoImagenRepository ordenTrabajoImagenRepository,
            @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.ordenTrabajoRepository = ordenTrabajoRepository;
        this.ordenTrabajoImagenRepository = ordenTrabajoImagenRepository;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        System.out.println("📂 Carpeta de uploads = " + this.uploadPath);

        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear la carpeta de uploads", e);
        }
    }

    @Transactional
    public OrdenTrabajo subirImagenes(Long ordenId,
            List<MultipartFile> files,
            String categoriaStr,
            String descripcionGlobal) throws IOException {

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Debes enviar al menos un archivo");
        }

        OrdenTrabajo orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));

        // Estructura: OT-00015/imagenes/INGRESO/, OT-00015/imagenes/DIAGNOSTICO/, etc.
        String folderName = orden.getNumeroOrden();

        CategoriaImagen categoria = CategoriaImagen.valueOf(
                categoriaStr == null ? "OTRO" : categoriaStr.toUpperCase());

        // Crear estructura: numeroOrden/imagenes/CATEGORIA/
        Path imagenesPath = uploadPath.resolve(folderName).resolve("imagenes").resolve(categoria.name());
        Files.createDirectories(imagenesPath);

        for (MultipartFile file : files) {
            if (file.isEmpty())
                continue;

            String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path filePath = imagenesPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Ruta relativa: /uploads/OT-00015/imagenes/INGRESO/archivo.jpg
            String relativeUrl = "/uploads/" + folderName + "/imagenes/" + categoria.name() + "/" + fileName;

            Imagen img = Imagen.builder()
                    .ordenTrabajo(orden)
                    .ruta(relativeUrl)
                    .categoria(categoria)
                    .descripcion(descripcionGlobal)
                    .build();

            orden.getImagenes().add(img);
        }

        return ordenTrabajoRepository.save(orden);
    }

    // 🔹 NUEVO: listar imágenes por id de orden
    @Transactional(readOnly = true)
    public List<ImagenDto> listarImagenes(Long ordenId) {
        OrdenTrabajo orden = ordenTrabajoRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));

        return orden.getImagenes()
                .stream()
                .map(img -> new ImagenDto(
                        img.getId(),
                        img.getRuta(),
                        img.getCategoria(),
                        img.getDescripcion(),
                        img.getFechaSubida()))
                .toList();
    }
}
