package com.newbie.newbiecore.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.newbie.newbiecore.entity.FichaTecnica;

import java.util.List;

public class FichaTecnicaMapper {

    public static FichaTecnicaDTO toDTO(FichaTecnica ficha) {

        JsonNode hardwareJsonNode = null;

        try {
            // ⚙️ Si ya está en formato JSON, simplemente lo tomamos
            hardwareJsonNode = ficha.getEquipo().getHardwareJson();
        } catch (Exception ignored) {}

        // 🖼️ Convertir imágenes a rutas
        List<String> imagenes = ficha.getImagenes()
                .stream()
                .map(img -> img.getRuta())
                .toList();

        return FichaTecnicaDTO.builder()
                .id(ficha.getId())

                // 👨‍🔧 Técnico
                .tecnicoCedula(ficha.getTecnico().getCedula())
                .tecnicoNombre(ficha.getTecnico().getNombre())

                // 👤 Cliente
                .clienteCedula(ficha.getEquipo().getUsuario().getCedula())
                .clienteNombre(ficha.getEquipo().getUsuario().getNombre())

                // 💻 Equipo
                .equipoId(ficha.getEquipo().getIdEquipo())
                .marca(ficha.getEquipo().getMarca())
                .modelo(ficha.getEquipo().getModelo())
                .numeroSerie(ficha.getEquipo().getNumeroSerie())
                .hostname(ficha.getEquipo().getHostname())
                .sistemaOperativo(ficha.getEquipo().getSistemaOperativo())
                .hardwareJson(hardwareJsonNode)

                // 🖼️ Imágenes
                .imagenes(imagenes)

                // 🗒️ Observaciones
                .observaciones(ficha.getObservaciones())
                .fechaCreacion(ficha.getFechaCreacion() != null
                        ? ficha.getFechaCreacion().toString()
                        : null)
                .build();
    }
}
