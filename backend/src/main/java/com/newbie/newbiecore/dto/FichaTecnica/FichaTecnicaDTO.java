package com.newbie.newbiecore.dto.FichaTecnica;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaTecnicaDTO {

    private Long id;
    private Instant fechaCreacion;
    private String observaciones;

    private Long equipoId;
    private Long ordenTrabajoId;
    private String tecnicoId;

    private String adaptadorRed;
    private Boolean arranqueUefiPresente;
    private Boolean biosEsUefiCapaz;
    private String biosFabricante;
    private String biosFechaStr;
    private String biosVersion;
    private String chipset;

    private Integer cpuLogicos;
    private String cpuNombre;
    private Integer cpuNucleos;

    private Integer discoCapacidadMb;
    private String discoCapacidadStr;
    private String discoModelo;
    private String discoNumeroSerie;
    private Integer discoRpm;
    private String discoTipo;

    private String gpuNombre;
    private String macAddress;
    private String mainboardModelo;

    private Integer ramCapacidadGb;
    private Integer ramFrecuenciaMhz;
    private String ramTecnologiaModulo;
    private String ramTipo;

    private Boolean secureBootActivo;
    private String soDescripcion;

    private String wifiLinkSpeedActual;
    private String wifiLinkSpeedMax;
}
