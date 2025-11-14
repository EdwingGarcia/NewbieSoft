package com.newbie.newbiecore.dto.FichaTecnica;

import com.newbie.newbiecore.entity.FichaTecnica;

public class FichaTecnicaMapper {

    public static FichaTecnicaDTO toDTO(FichaTecnica ficha) {
        if (ficha == null) return null;

        return FichaTecnicaDTO.builder()
                .id(ficha.getId())
                .fechaCreacion(ficha.getFechaCreacion())
                .observaciones(ficha.getObservaciones())

                .equipoId(
                        ficha.getEquipo() != null
                                ? ficha.getEquipo().getIdEquipo()
                                : null
                )
                .ordenTrabajoId(
                        ficha.getOrdenTrabajo() != null
                                ? ficha.getOrdenTrabajo().getId()
                                : null
                )
                .tecnicoId(
                        ficha.getTecnico() != null
                                ? ficha.getTecnico().getCedula()
                                : null
                )

                .adaptadorRed(ficha.getAdaptadorRed())
                .arranqueUefiPresente(ficha.getArranqueUefiPresente())
                .biosEsUefiCapaz(ficha.getBiosEsUefiCapaz())
                .biosFabricante(ficha.getBiosFabricante())
                .biosFechaStr(ficha.getBiosFechaStr())
                .biosVersion(ficha.getBiosVersion())
                .chipset(ficha.getChipset())

                .cpuLogicos(ficha.getCpuLogicos())
                .cpuNombre(ficha.getCpuNombre())
                .cpuNucleos(ficha.getCpuNucleos())

                .discoCapacidadMb(ficha.getDiscoCapacidadMb())
                .discoCapacidadStr(ficha.getDiscoCapacidadStr())
                .discoModelo(ficha.getDiscoModelo())
                .discoNumeroSerie(ficha.getDiscoNumeroSerie())
                .discoRpm(ficha.getDiscoRpm())
                .discoTipo(ficha.getDiscoTipo())

                .gpuNombre(ficha.getGpuNombre())
                .macAddress(ficha.getMacAddress())
                .mainboardModelo(ficha.getMainboardModelo())

                .ramCapacidadGb(ficha.getRamCapacidadGb())
                .ramFrecuenciaMhz(ficha.getRamFrecuenciaMhz())
                .ramTecnologiaModulo(ficha.getRamTecnologiaModulo())
                .ramTipo(ficha.getRamTipo())

                .secureBootActivo(ficha.getSecureBootActivo())
                .soDescripcion(ficha.getSoDescripcion())

                .wifiLinkSpeedActual(ficha.getWifiLinkSpeedActual())
                .wifiLinkSpeedMax(ficha.getWifiLinkSpeedMax())

                .build();
    }
}
