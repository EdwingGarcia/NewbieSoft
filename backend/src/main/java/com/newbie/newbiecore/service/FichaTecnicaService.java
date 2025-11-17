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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class FichaTecnicaService {

    private final FichaTecnicaRepository fichaTecnicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;

    public FichaTecnicaService(FichaTecnicaRepository fichaTecnicaRepository,
                               UsuarioRepository usuarioRepository,
                               EquipoRepository equipoRepository,
                               OrdenTrabajoRepository ordenTrabajoRepository) {
        this.fichaTecnicaRepository = fichaTecnicaRepository;
        this.usuarioRepository = usuarioRepository;
        this.equipoRepository = equipoRepository;
        this.ordenTrabajoRepository = ordenTrabajoRepository;
    }

    /* ===========================================================
       =============== CREACIÓN / REGISTRO =======================
       =========================================================== */

    /**
     * 🆕 Crear una nueva ficha técnica AUTORRELLENADA a partir de equipo (hardwareJson).
     * Si ya existe una ficha para esa orden de trabajo, la reutiliza.
     */
    @Transactional
    public FichaTecnica crearONegociar(String cedulaTecnico,
                                       Long equipoId,
                                       Long ordenTrabajoId,
                                       String observaciones) {

        // ✅ Validar técnico
        Usuario tecnico = usuarioRepository.findById(cedulaTecnico)
                .orElseThrow(() -> new IllegalArgumentException("Técnico no encontrado"));

        // ✅ Cargar equipo (para hardwareJson)
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado"));

        // ✅ Validar OT y reutilizar ficha si ya existe
        if (ordenTrabajoId != null) {
            OrdenTrabajo ot = ordenTrabajoRepository.findById(ordenTrabajoId)
                    .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));

            var existente = fichaTecnicaRepository.findByOrdenTrabajoId(ordenTrabajoId);
            if (existente.isPresent()) {
                return existente.get();
            }
        }

        FichaTecnica ficha = FichaTecnica.builder()
                .tecnicoId(cedulaTecnico)
                .equipoId(equipoId)
                .ordenTrabajoId(ordenTrabajoId)
                .observaciones(observaciones)
                .fechaCreacion(Instant.now())
                .build();

        // Autocomplete desde hardwareJson
        FichaTecnicaAutoFillHelper.rellenarDesdeHardwareJson(ficha, equipo);

        return fichaTecnicaRepository.save(ficha);
    }

    /**
     * Variante que ya devuelve DTO (útil para el controller).
     */
    @Transactional
    public FichaTecnicaDTO crearONegociarDTO(String cedulaTecnico,
                                             Long equipoId,
                                             Long ordenTrabajoId,
                                             String observaciones) {
        FichaTecnica ficha = crearONegociar(cedulaTecnico, equipoId, ordenTrabajoId, observaciones);
        return FichaTecnicaMapper.toDTO(ficha);
    }

    /* ===========================================================
       ======================= EDICIÓN ===========================
       =========================================================== */

    /** 📝 Actualizar SOLO observaciones */
    @Transactional
    public Optional<FichaTecnicaDTO> actualizarObservaciones(Long fichaId, String observaciones) {
        return fichaTecnicaRepository.findById(fichaId)
                .map(ficha -> {
                    ficha.setObservaciones(observaciones);
                    return FichaTecnicaMapper.toDTO(fichaTecnicaRepository.save(ficha));
                });
    }

    /**
     * ✏️ Actualizar la ficha completa desde el DTO.
     * Se respeta el id, equipoId, ordenTrabajoId y tecnicoId originales (no se cambian aquí).
     */
    @Transactional
    public Optional<FichaTecnicaDTO> actualizarDesdeDTO(Long fichaId, FichaTecnicaDTO dto) {
        return fichaTecnicaRepository.findById(fichaId)
                .map(ficha -> {
                    aplicarDtoEnEntidad(dto, ficha);
                    return FichaTecnicaMapper.toDTO(fichaTecnicaRepository.save(ficha));
                });
    }

    /**
     * ♻️ Re-autocompletar la ficha desde el hardwareJson actual del equipo.
     * Útil cuando se vuelve a correr el diagnóstico y se quiere refrescar la parte técnica.
     */
    @Transactional
    public Optional<FichaTecnicaDTO> refrescarDesdeHardware(Long fichaId) {
        return fichaTecnicaRepository.findById(fichaId)
                .map(ficha -> {
                    if (ficha.getEquipoId() == null) {
                        throw new IllegalStateException("La ficha no tiene equipo asociado");
                    }

                    Equipo equipo = equipoRepository.findById(ficha.getEquipoId())
                            .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado"));

                    FichaTecnicaAutoFillHelper.rellenarDesdeHardwareJson(ficha, equipo);
                    return FichaTecnicaMapper.toDTO(fichaTecnicaRepository.save(ficha));
                });
    }

    /* ===========================================================
       ======================= CONSULTAS =========================
       =========================================================== */

    @Transactional(readOnly = true)
    public List<FichaTecnicaDTO> listarPorEquipo(Long equipoId) {
        return fichaTecnicaRepository.findByEquipoId(equipoId)
                .stream()
                .map(FichaTecnicaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FichaTecnicaDTO> listarPorTecnico(String cedulaTecnico) {
        return fichaTecnicaRepository.findByTecnicoId(cedulaTecnico)
                .stream()
                .map(FichaTecnicaMapper::toDTO)
                .toList();
    }

    /** 🔍 Buscar ficha por orden de trabajo (siempre debería ser máx. 1) */
    @Transactional(readOnly = true)
    public Optional<FichaTecnicaDTO> buscarPorOrdenTrabajo(Long ordenTrabajoId) {
        return fichaTecnicaRepository.findByOrdenTrabajoId(ordenTrabajoId)
                .map(FichaTecnicaMapper::toDTO);
    }

    /** 📋 Listar todas las fichas en formato DTO */
    @Transactional(readOnly = true)
    public List<FichaTecnicaDTO> listarDTO() {
        return fichaTecnicaRepository.findAll()
                .stream()
                .map(FichaTecnicaMapper::toDTO)
                .toList();
    }

    /** 🔍 Obtener ficha técnica en formato DTO por id */
    @Transactional(readOnly = true)
    public Optional<FichaTecnicaDTO> obtenerDTO(Long id) {
        return fichaTecnicaRepository.findById(id)
                .map(FichaTecnicaMapper::toDTO);
    }

    /* ===========================================================
       ======================= ELIMINACIÓN =======================
       =========================================================== */

    /** 🗑️ Eliminar ficha técnica por id */
    @Transactional
    public void eliminar(Long id) {
        if (!fichaTecnicaRepository.existsById(id)) {
            throw new IllegalArgumentException("Ficha técnica no encontrada");
        }
        fichaTecnicaRepository.deleteById(id);
    }

    /* ===========================================================
       ============== MAPEADOR DTO -> ENTIDAD ====================
       =========================================================== */

    /**
     * Copia los campos editables de DTO hacia la entidad.
     * No cambia: id, equipoId, ordenTrabajoId, tecnicoId, fechaCreacion.
     */
    private void aplicarDtoEnEntidad(FichaTecnicaDTO dto, FichaTecnica f) {
        // Observaciones generales
        f.setObservaciones(dto.getObservaciones());

        // ================= HW AUTO =================
        f.setAdaptadorRed(dto.getAdaptadorRed());
        f.setArranqueUefiPresente(dto.getArranqueUefiPresente());
        f.setBiosEsUefiCapaz(dto.getBiosEsUefiCapaz());
        f.setBiosFabricante(dto.getBiosFabricante());
        f.setBiosFechaStr(dto.getBiosFechaStr());
        f.setBiosVersion(dto.getBiosVersion());
        f.setChipset(dto.getChipset());
        f.setSecureBootActivo(dto.getSecureBootActivo());
        f.setSoDescripcion(dto.getSoDescripcion());
        f.setSoProveedor(dto.getSoProveedor());
        f.setMacAddress(dto.getMacAddress());
        f.setWifiLinkSpeedActual(dto.getWifiLinkSpeedActual());
        f.setWifiLinkSpeedMax(dto.getWifiLinkSpeedMax());

        f.setCpuNombre(dto.getCpuNombre());
        f.setCpuNucleos(dto.getCpuNucleos());
        f.setCpuLogicos(dto.getCpuLogicos());
        f.setCpuPaquetesFisicos(dto.getCpuPaquetesFisicos());
        f.setCpuFrecuenciaOriginalMhz(dto.getCpuFrecuenciaOriginalMhz());

        f.setDiscoCapacidadMb(dto.getDiscoCapacidadMb());
        f.setDiscoCapacidadStr(dto.getDiscoCapacidadStr());
        f.setDiscoModelo(dto.getDiscoModelo());
        f.setDiscoNumeroSerie(dto.getDiscoNumeroSerie());
        f.setDiscoRpm(dto.getDiscoRpm());
        f.setDiscoTipo(dto.getDiscoTipo());
        f.setDiscoLetras(dto.getDiscoLetras());
        f.setDiscoWwn(dto.getDiscoWwn());

        f.setDiscoTemperatura(dto.getDiscoTemperatura());
        f.setDiscoHorasEncendido(dto.getDiscoHorasEncendido());
        f.setDiscoSectoresReasignados(dto.getDiscoSectoresReasignados());
        f.setDiscoSectoresPendientes(dto.getDiscoSectoresPendientes());
        f.setDiscoErroresLectura(dto.getDiscoErroresLectura());
        f.setDiscoErrorCrc(dto.getDiscoErrorCrc());

        f.setGpuNombre(dto.getGpuNombre());

        f.setRamCapacidadGb(dto.getRamCapacidadGb());
        f.setRamFrecuenciaMhz(dto.getRamFrecuenciaMhz());
        f.setRamTecnologiaModulo(dto.getRamTecnologiaModulo());
        f.setRamTipo(dto.getRamTipo());
        f.setRamNumeroModulo(dto.getRamNumeroModulo());
        f.setRamSerieModulo(dto.getRamSerieModulo());
        f.setRamFechaFabricacion(dto.getRamFechaFabricacion());
        f.setRamLugarFabricacion(dto.getRamLugarFabricacion());

        f.setMainboardModelo(dto.getMainboardModelo());
        f.setEquipoNombre(dto.getEquipoNombre());

        f.setMonitorNombre(dto.getMonitorNombre());
        f.setMonitorModelo(dto.getMonitorModelo());

        f.setAudioAdaptador(dto.getAudioAdaptador());
        f.setAudioCodec(dto.getAudioCodec());
        f.setAudioHardwareId(dto.getAudioHardwareId());

        f.setPciExpressVersion(dto.getPciExpressVersion());
        f.setUsbVersion(dto.getUsbVersion());

        f.setTpmPresente(dto.getTpmPresente());
        f.setTpmVersion(dto.getTpmVersion());
        f.setHvciEstado(dto.getHvciEstado());

        // ================= HOJA FÍSICA =================
        f.setEquipoMarca(dto.getEquipoMarca());
        f.setEquipoModelo(dto.getEquipoModelo());
        f.setEquipoSerie(dto.getEquipoSerie());
        f.setEquipoOtros(dto.getEquipoOtros());
        f.setEquipoRoturas(dto.getEquipoRoturas());
        f.setEquipoMarcasDesgaste(dto.getEquipoMarcasDesgaste());

        f.setTornillosFaltantes(dto.getTornillosFaltantes());
        f.setCarcasaEstado(dto.getCarcasaEstado());
        f.setCarcasaObservaciones(dto.getCarcasaObservaciones());

        f.setTecladoEstado(dto.getTecladoEstado());
        f.setTecladoTeclasDanadas(dto.getTecladoTeclasDanadas());
        f.setTecladoTeclasFaltantes(dto.getTecladoTeclasFaltantes());
        f.setTecladoRetroiluminacion(dto.getTecladoRetroiluminacion());
        f.setTecladoObservaciones(dto.getTecladoObservaciones());

        f.setPantallaRayones(dto.getPantallaRayones());
        f.setPantallaTrizaduras(dto.getPantallaTrizaduras());
        f.setPantallaPixelesMuertos(dto.getPantallaPixelesMuertos());
        f.setPantallaManchas(dto.getPantallaManchas());
        f.setPantallaTactil(dto.getPantallaTactil());
        f.setPantallaObservaciones(dto.getPantallaObservaciones());

        f.setPuertoUsb(dto.getPuertoUsb());
        f.setPuertoVga(dto.getPuertoVga());
        f.setPuertoEthernet(dto.getPuertoEthernet());
        f.setPuertoHdmi(dto.getPuertoHdmi());
        f.setPuertoEntradaAudio(dto.getPuertoEntradaAudio());
        f.setPuertoSalidaAudio(dto.getPuertoSalidaAudio());
        f.setPuertoMicroSd(dto.getPuertoMicroSd());
        f.setPuertoDvd(dto.getPuertoDvd());
        f.setPuertosObservaciones(dto.getPuertosObservaciones());

        f.setTouchpadEstado(dto.getTouchpadEstado());
        f.setTouchpadFunciona(dto.getTouchpadFunciona());
        f.setTouchpadBotonIzq(dto.getTouchpadBotonIzq());
        f.setTouchpadBotonDer(dto.getTouchpadBotonDer());
        f.setTouchpadTactil(dto.getTouchpadTactil());
        f.setTouchpadObservaciones(dto.getTouchpadObservaciones());

        f.setDiscoEstado(dto.getDiscoEstado());
        f.setDiscoTipoFicha(dto.getDiscoTipoFicha());
        f.setDiscoMarcaFicha(dto.getDiscoMarcaFicha());
        f.setDiscoCapacidadFicha(dto.getDiscoCapacidadFicha());
        f.setDiscoSerieFicha(dto.getDiscoSerieFicha());
        f.setDiscoObservacionesFicha(dto.getDiscoObservacionesFicha());

        f.setRamTipoEquipo(dto.getRamTipoEquipo());
        f.setRamCantidadModulos(dto.getRamCantidadModulos());
        f.setRamMarcaFicha(dto.getRamMarcaFicha());
        f.setRamTecnologiaFicha(dto.getRamTecnologiaFicha());
        f.setRamCapacidadFicha(dto.getRamCapacidadFicha());
        f.setRamFrecuenciaFicha(dto.getRamFrecuenciaFicha());
        f.setRamObservacionesFicha(dto.getRamObservacionesFicha());

        f.setMainboardModeloFicha(dto.getMainboardModeloFicha());
        f.setMainboardObservaciones(dto.getMainboardObservaciones());

        f.setProcesadorMarca(dto.getProcesadorMarca());
        f.setProcesadorModelo(dto.getProcesadorModelo());

        f.setFuenteVentiladorEstado(dto.getFuenteVentiladorEstado());
        f.setFuenteRuido(dto.getFuenteRuido());
        f.setFuenteMedicionVoltaje(dto.getFuenteMedicionVoltaje());
        f.setFuenteObservaciones(dto.getFuenteObservaciones());

        f.setGraficaTipo(dto.getGraficaTipo());
        f.setVentiladorCpuObservaciones(dto.getVentiladorCpuObservaciones());

        f.setBateriaCodigo(dto.getBateriaCodigo());
        f.setBateriaObservaciones(dto.getBateriaObservaciones());

        f.setCargadorCodigo(dto.getCargadorCodigo());
        f.setCargadorEstadoCable(dto.getCargadorEstadoCable());
        f.setCargadorVoltajes(dto.getCargadorVoltajes());

        f.setBiosContrasena(dto.getBiosContrasena());
        f.setBiosTipoArranque(dto.getBiosTipoArranque());
        f.setBiosSecureBoot(dto.getBiosSecureBoot());
        f.setBiosObservacionesFicha(dto.getBiosObservacionesFicha());

        f.setSoTipo(dto.getSoTipo());
        f.setSoVersion(dto.getSoVersion());
        f.setSoLicenciaActiva(dto.getSoLicenciaActiva());

        f.setAntivirusMarca(dto.getAntivirusMarca());
        f.setAntivirusLicenciaActiva(dto.getAntivirusLicenciaActiva());
        f.setAntivirusObservaciones(dto.getAntivirusObservaciones());

        f.setOfficeLicenciaActiva(dto.getOfficeLicenciaActiva());
        f.setOfficeVersion(dto.getOfficeVersion());

        f.setInformacionCantidad(dto.getInformacionCantidad());
        f.setInformacionRequiereRespaldo(dto.getInformacionRequiereRespaldo());
        f.setInformacionOtrosProgramas(dto.getInformacionOtrosProgramas());

        f.setCamaraFunciona(dto.getCamaraFunciona());
        f.setCamaraObservaciones(dto.getCamaraObservaciones());

        f.setWifiFunciona(dto.getWifiFunciona());
        f.setWifiObservaciones(dto.getWifiObservaciones());

        f.setTrabajoRealizado(dto.getTrabajoRealizado());
    }
}
