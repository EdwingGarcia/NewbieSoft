package com.newbie.newbiecore.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaTecnicaDTO {

    private Long id;

    // 👨‍🔧 Técnico encargado
    private String tecnicoCedula;
    private String tecnicoNombre;

    // 👤 Cliente (usuario dueño del equipo)
    private String clienteCedula;
    private String clienteNombre;

    // 💻 Información técnica del equipo
    private Long equipoId;
    private String marca;
    private String modelo;
    private String numeroSerie;
    private String hostname;
    private String sistemaOperativo;

    // 🧩 JSON con datos detallados del hardware
    private JsonNode hardwareJson;

    // 🖼️ Lista de rutas de imágenes asociadas
    private List<String> imagenes;

    // 🗒️ Observaciones y metadatos
    private String observaciones;
    private String fechaCreacion;
}
