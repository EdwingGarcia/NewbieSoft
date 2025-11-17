package com.newbie.newbiecore.dto.FichaTecnica;

import com.newbie.newbiecore.entity.FichaTecnica;

public class FichaTecnicaMapper {

    public static FichaTecnicaDTO toDTO(FichaTecnica f) {
        if (f == null) return null;

        return FichaTecnicaDTO.builder()

                // ========= METADATOS =========
                .id(f.getId())
                .fechaCreacion(f.getFechaCreacion())
                .observaciones(f.getObservaciones())
                .equipoId(f.getEquipoId())
                .ordenTrabajoId(f.getOrdenTrabajoId())
                .tecnicoId(f.getTecnicoId())

                // ========= HW AUTO =========
                .adaptadorRed(f.getAdaptadorRed())
                .arranqueUefiPresente(f.getArranqueUefiPresente())
                .biosEsUefiCapaz(f.getBiosEsUefiCapaz())
                .biosFabricante(f.getBiosFabricante())
                .biosFechaStr(f.getBiosFechaStr())
                .biosVersion(f.getBiosVersion())
                .chipset(f.getChipset())
                .secureBootActivo(f.getSecureBootActivo())
                .soDescripcion(f.getSoDescripcion())
                .soProveedor(f.getSoProveedor())
                .macAddress(f.getMacAddress())
                .wifiLinkSpeedActual(f.getWifiLinkSpeedActual())
                .wifiLinkSpeedMax(f.getWifiLinkSpeedMax())

                // CPU
                .cpuNombre(f.getCpuNombre())
                .cpuNucleos(f.getCpuNucleos())
                .cpuLogicos(f.getCpuLogicos())
                .cpuPaquetesFisicos(f.getCpuPaquetesFisicos())
                .cpuFrecuenciaOriginalMhz(f.getCpuFrecuenciaOriginalMhz())

                // DISCO
                .discoCapacidadMb(f.getDiscoCapacidadMb())
                .discoCapacidadStr(f.getDiscoCapacidadStr())
                .discoModelo(f.getDiscoModelo())
                .discoNumeroSerie(f.getDiscoNumeroSerie())
                .discoRpm(f.getDiscoRpm())
                .discoTipo(f.getDiscoTipo())
                .discoLetras(f.getDiscoLetras())
                .discoWwn(f.getDiscoWwn())

                // SMART
                .discoTemperatura(f.getDiscoTemperatura())
                .discoHorasEncendido(f.getDiscoHorasEncendido())
                .discoSectoresReasignados(f.getDiscoSectoresReasignados())
                .discoSectoresPendientes(f.getDiscoSectoresPendientes())
                .discoErroresLectura(f.getDiscoErroresLectura())
                .discoErrorCrc(f.getDiscoErrorCrc())

                // GPU
                .gpuNombre(f.getGpuNombre())

                // RAM HW
                .ramCapacidadGb(f.getRamCapacidadGb())
                .ramFrecuenciaMhz(f.getRamFrecuenciaMhz())
                .ramTecnologiaModulo(f.getRamTecnologiaModulo())
                .ramTipo(f.getRamTipo())
                .ramNumeroModulo(f.getRamNumeroModulo())
                .ramSerieModulo(f.getRamSerieModulo())
                .ramFechaFabricacion(f.getRamFechaFabricacion())
                .ramLugarFabricacion(f.getRamLugarFabricacion())

                // MAINBOARD
                .mainboardModelo(f.getMainboardModelo())
                .equipoNombre(f.getEquipoNombre())

                // Monitor
                .monitorNombre(f.getMonitorNombre())
                .monitorModelo(f.getMonitorModelo())

                // Audio
                .audioAdaptador(f.getAudioAdaptador())
                .audioCodec(f.getAudioCodec())
                .audioHardwareId(f.getAudioHardwareId())

                // Buses / interfaces
                .pciExpressVersion(f.getPciExpressVersion())
                .usbVersion(f.getUsbVersion())

                // Seguridad / TPM
                .tpmPresente(f.getTpmPresente())
                .tpmVersion(f.getTpmVersion())
                .hvciEstado(f.getHvciEstado())

                // ========= FÍSICA HOJA TÉCNICA =========

                .equipoMarca(f.getEquipoMarca())
                .equipoModelo(f.getEquipoModelo())
                .equipoSerie(f.getEquipoSerie())
                .equipoOtros(f.getEquipoOtros())
                .equipoRoturas(f.getEquipoRoturas())
                .equipoMarcasDesgaste(f.getEquipoMarcasDesgaste())

                // CARCASA
                .tornillosFaltantes(f.getTornillosFaltantes())
                .carcasaEstado(f.getCarcasaEstado())
                .carcasaObservaciones(f.getCarcasaObservaciones())

                // TECLADO
                .tecladoEstado(f.getTecladoEstado())
                .tecladoTeclasDanadas(f.getTecladoTeclasDanadas())
                .tecladoTeclasFaltantes(f.getTecladoTeclasFaltantes())
                .tecladoRetroiluminacion(f.getTecladoRetroiluminacion())
                .tecladoObservaciones(f.getTecladoObservaciones())

                // PANTALLA
                .pantallaRayones(f.getPantallaRayones())
                .pantallaTrizaduras(f.getPantallaTrizaduras())
                .pantallaPixelesMuertos(f.getPantallaPixelesMuertos())
                .pantallaManchas(f.getPantallaManchas())
                .pantallaTactil(f.getPantallaTactil())
                .pantallaObservaciones(f.getPantallaObservaciones())

                // PUERTOS
                .puertoUsb(f.getPuertoUsb())
                .puertoVga(f.getPuertoVga())
                .puertoEthernet(f.getPuertoEthernet())
                .puertoHdmi(f.getPuertoHdmi())
                .puertoEntradaAudio(f.getPuertoEntradaAudio())
                .puertoSalidaAudio(f.getPuertoSalidaAudio())
                .puertoMicroSd(f.getPuertoMicroSd())
                .puertoDvd(f.getPuertoDvd())
                .puertosObservaciones(f.getPuertosObservaciones())

                // TOUCHPAD
                .touchpadEstado(f.getTouchpadEstado())
                .touchpadFunciona(f.getTouchpadFunciona())
                .touchpadBotonIzq(f.getTouchpadBotonIzq())
                .touchpadBotonDer(f.getTouchpadBotonDer())
                .touchpadTactil(f.getTouchpadTactil())
                .touchpadObservaciones(f.getTouchpadObservaciones())

                // DISCO físico
                .discoEstado(f.getDiscoEstado())
                .discoTipoFicha(f.getDiscoTipoFicha())
                .discoMarcaFicha(f.getDiscoMarcaFicha())
                .discoCapacidadFicha(f.getDiscoCapacidadFicha())
                .discoSerieFicha(f.getDiscoSerieFicha())
                .discoObservacionesFicha(f.getDiscoObservacionesFicha())

                // RAM física
                .ramTipoEquipo(f.getRamTipoEquipo())
                .ramCantidadModulos(f.getRamCantidadModulos())
                .ramMarcaFicha(f.getRamMarcaFicha())
                .ramTecnologiaFicha(f.getRamTecnologiaFicha())
                .ramCapacidadFicha(f.getRamCapacidadFicha())
                .ramFrecuenciaFicha(f.getRamFrecuenciaFicha())
                .ramObservacionesFicha(f.getRamObservacionesFicha())

                // MAINBOARD física
                .mainboardModeloFicha(f.getMainboardModeloFicha())
                .mainboardObservaciones(f.getMainboardObservaciones())

                // CPU Físico
                .procesadorMarca(f.getProcesadorMarca())
                .procesadorModelo(f.getProcesadorModelo())

                // Fuente poder
                .fuenteVentiladorEstado(f.getFuenteVentiladorEstado())
                .fuenteRuido(f.getFuenteRuido())
                .fuenteMedicionVoltaje(f.getFuenteMedicionVoltaje())
                .fuenteObservaciones(f.getFuenteObservaciones())

                // Gráfica física
                .graficaTipo(f.getGraficaTipo())

                // Ventilador CPU
                .ventiladorCpuObservaciones(f.getVentiladorCpuObservaciones())

                // Batería
                .bateriaCodigo(f.getBateriaCodigo())
                .bateriaObservaciones(f.getBateriaObservaciones())

                // Cargador
                .cargadorCodigo(f.getCargadorCodigo())
                .cargadorEstadoCable(f.getCargadorEstadoCable())
                .cargadorVoltajes(f.getCargadorVoltajes())

                // BIOS físico
                .biosContrasena(f.getBiosContrasena())
                .biosTipoArranque(f.getBiosTipoArranque())
                .biosSecureBoot(f.getBiosSecureBoot())
                .biosObservacionesFicha(f.getBiosObservacionesFicha())

                // Sistema operativo físico
                .soTipo(f.getSoTipo())
                .soVersion(f.getSoVersion())
                .soLicenciaActiva(f.getSoLicenciaActiva())

                // Antivirus
                .antivirusMarca(f.getAntivirusMarca())
                .antivirusLicenciaActiva(f.getAntivirusLicenciaActiva())
                .antivirusObservaciones(f.getAntivirusObservaciones())

                // Office
                .officeLicenciaActiva(f.getOfficeLicenciaActiva())
                .officeVersion(f.getOfficeVersion())

                // Info almacenada
                .informacionCantidad(f.getInformacionCantidad())
                .informacionRequiereRespaldo(f.getInformacionRequiereRespaldo())
                .informacionOtrosProgramas(f.getInformacionOtrosProgramas())

                // Cámara
                .camaraFunciona(f.getCamaraFunciona())
                .camaraObservaciones(f.getCamaraObservaciones())

                // WIFI prueba
                .wifiFunciona(f.getWifiFunciona())
                .wifiObservaciones(f.getWifiObservaciones())

                // Trabajo realizado
                .trabajoRealizado(f.getTrabajoRealizado())

                .build();
    }
}
