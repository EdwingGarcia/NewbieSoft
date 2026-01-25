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

    /* ======================= METADATOS ======================= */

    private Long id;
    private Instant fechaCreacion;
    private String observaciones;
    private Long equipoId;
    private Long ordenTrabajoId;
    private String tecnicoId;
    private String numeroOrden;
    private String estado; // BORRADOR o CERRADA
    /* ============== CAMPOS AUTOCOMPLETADOS HW =============== */

    // Red / BIOS / Sistema
    private String adaptadorRed;
    private Boolean arranqueUefiPresente;
    private Boolean biosEsUefiCapaz;
    private String biosFabricante;
    private String biosFechaStr;
    private String biosVersion;
    private String chipset;

    private Boolean secureBootActivo;
    private String soDescripcion;
    private String soProveedor;

    private String macAddress;
    private String wifiLinkSpeedActual;
    private String wifiLinkSpeedMax;

    // CPU
    private String cpuNombre;
    private Integer cpuNucleos;
    private Integer cpuLogicos;
    private Integer cpuPaquetesFisicos;
    private Integer cpuFrecuenciaOriginalMhz;

    // Disco (HW)
    private Integer discoCapacidadMb;
    private String discoCapacidadStr;
    private String discoModelo;
    private String discoNumeroSerie;
    private Integer discoRpm;
    private String discoTipo;
    private String discoLetras;
    private String discoWwn;

    // SMART / Estado disco
    private String discoTemperatura;
    private String discoHorasEncendido;
    private String discoSectoresReasignados;
    private String discoSectoresPendientes;
    private String discoErroresLectura;
    private String discoErrorCrc;

    // GPU
    private String gpuNombre;

    // RAM (desde HW)
    private Integer ramCapacidadGb;
    private Integer ramFrecuenciaMhz;
    private String ramTecnologiaModulo;
    private String ramTipo;
    private Integer ramNumeroModulo;
    private String ramSerieModulo;
    private String ramFechaFabricacion;
    private String ramLugarFabricacion;

    // Mainboard / Host
    private String mainboardModelo;
    private String equipoNombre;

    // Monitor
    private String monitorNombre;
    private String monitorModelo;

    // Audio
    private String audioAdaptador;
    private String audioCodec;
    private String audioHardwareId;

    // Interfaces
    private String pciExpressVersion;
    private String usbVersion;

    // Seguridad
    private Boolean tpmPresente;
    private String tpmVersion;
    private String hvciEstado;

    /* ============ CAMPOS FÍSICOS HOJA TÉCNICA ============= */

    // Identificación equipo
    private String equipoMarca;
    private String equipoModelo;
    private String equipoSerie;
    private String equipoOtros;
    private String equipoRoturas;
    private String equipoMarcasDesgaste;

    // Carcasa / Tornillos
    private Boolean tornillosFaltantes;
    private String carcasaEstado;
    private String carcasaObservaciones;

    // Teclado
    private String tecladoEstado;
    private Boolean tecladoTeclasDanadas;
    private Boolean tecladoTeclasFaltantes;
    private Boolean tecladoRetroiluminacion;
    private String tecladoObservaciones;

    // Pantalla
    private Boolean pantallaRayones;
    private Boolean pantallaTrizaduras;
    private Boolean pantallaPixelesMuertos;
    private Boolean pantallaManchas;
    private Boolean pantallaTactil;
    private String pantallaObservaciones;

    // Puertos
    private Boolean puertoUsb;
    private Boolean puertoVga;
    private Boolean puertoEthernet;
    private Boolean puertoHdmi;
    private Boolean puertoEntradaAudio;
    private Boolean puertoSalidaAudio;
    private Boolean puertoMicroSd;
    private Boolean puertoDvd;
    private String puertosObservaciones;

    // Touchpad
    private String touchpadEstado;
    private Boolean touchpadFunciona;
    private Boolean touchpadBotonIzq;
    private Boolean touchpadBotonDer;
    private Boolean touchpadTactil;
    private String touchpadObservaciones;

    // Disco duro (ficha física)
    private String discoEstado;
    private String discoTipoFicha;
    private String discoMarcaFicha;
    private String discoCapacidadFicha;
    private String discoSerieFicha;
    private String discoObservacionesFicha;

    // RAM (ficha física)
    private String ramTipoEquipo;
    private Integer ramCantidadModulos;
    private String ramMarcaFicha;
    private String ramTecnologiaFicha;
    private String ramCapacidadFicha;
    private String ramFrecuenciaFicha;
    private String ramObservacionesFicha;

    // Mainboard (ficha física)
    private String mainboardModeloFicha;
    private String mainboardObservaciones;

    // Procesador (físico)
    private String procesadorMarca;
    private String procesadorModelo;

    // Fuente de poder
    private String fuenteVentiladorEstado;
    private String fuenteRuido;
    private String fuenteMedicionVoltaje;
    private String fuenteObservaciones;

    // Gráfica (física)
    private String graficaTipo;

    // Ventilador CPU
    private String ventiladorCpuObservaciones;

    // Batería
    private String bateriaCodigo;
    private String bateriaObservaciones;

    // Cargador
    private String cargadorCodigo;
    private String cargadorEstadoCable;
    private String cargadorVoltajes;

    // BIOS (física)
    private Boolean biosContrasena;
    private String biosTipoArranque;
    private Boolean biosSecureBoot;
    private String biosObservacionesFicha;

    // Sistema operativo (físico)
    private String soTipo;
    private String soVersion;
    private Boolean soLicenciaActiva;

    // Antivirus
    private String antivirusMarca;
    private Boolean antivirusLicenciaActiva;
    private String antivirusObservaciones;

    // Office
    private Boolean officeLicenciaActiva;
    private String officeVersion;

    // Información almacenada
    private String informacionCantidad;
    private Boolean informacionRequiereRespaldo;
    private String informacionOtrosProgramas;

    // Cámara
    private Boolean camaraFunciona;
    private String camaraObservaciones;

    // Conexión WiFi (prueba funcional)
    private Boolean wifiFunciona;
    private String wifiObservaciones;

    // Trabajo realizado
    private String trabajoRealizado;
}
