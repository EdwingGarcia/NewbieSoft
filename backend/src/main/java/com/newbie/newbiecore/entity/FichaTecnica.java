package com.newbie.newbiecore.entity;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fichas_tecnicas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaTecnica {

    /* ===========================================================
       ======================= METADATOS ==========================
       =========================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "fecha_creacion")
    private Instant fechaCreacion;

    @Column(name = "observaciones", length = 2000)
    private String observaciones;

    // Relaciones lógicas
    @Column(name = "equipo_id")
    private Long equipoId;

    @Column(name = "orden_trabajo_id")
    private Long ordenTrabajoId;

    @Column(name = "tecnico_id")
    private String tecnicoId;

    /* ===========================================================
       =============== CAMPOS AUTOCOMPLETADOS HW =================
       =========================================================== */

    // Red / BIOS / Sistema
    @Column(name = "adaptador_red")
    private String adaptadorRed;

    @Column(name = "arranque_uefi_presente")
    private Boolean arranqueUefiPresente;

    @Column(name = "bios_es_uefi_capaz")
    private Boolean biosEsUefiCapaz;

    @Column(name = "bios_fabricante")
    private String biosFabricante;

    @Column(name = "bios_fecha_str")
    private String biosFechaStr;

    @Column(name = "bios_version")
    private String biosVersion;

    @Column(name = "chipset")
    private String chipset;

    @Column(name = "secure_boot_activo")
    private Boolean secureBootActivo;

    @Column(name = "so_descripcion", length = 2000)
    private String soDescripcion;

    @Column(name = "so_proveedor")
    private String soProveedor;

    @Column(name = "mac_address")
    private String macAddress;

    @Column(name = "wifi_link_speed_actual")
    private String wifiLinkSpeedActual;

    @Column(name = "wifi_link_speed_max")
    private String wifiLinkSpeedMax;

    // CPU
    @Column(name = "cpu_nombre")
    private String cpuNombre;

    @Column(name = "cpu_nucleos")
    private Integer cpuNucleos;

    @Column(name = "cpu_logicos")
    private Integer cpuLogicos;

    @Column(name = "cpu_paquetes_fisicos")
    private Integer cpuPaquetesFisicos;

    @Column(name = "cpu_frecuencia_original_mhz")
    private Integer cpuFrecuenciaOriginalMhz;

    // Disco
    @Column(name = "disco_capacidad_mb")
    private Integer discoCapacidadMb;

    @Column(name = "disco_capacidad_str")
    private String discoCapacidadStr;

    @Column(name = "disco_modelo")
    private String discoModelo;

    @Column(name = "disco_numero_serie")
    private String discoNumeroSerie;

    @Column(name = "disco_rpm")
    private Integer discoRpm;

    @Column(name = "disco_tipo")
    private String discoTipo;

    @Column(name = "disco_letras")
    private String discoLetras;

    @Column(name = "disco_wwn")
    private String discoWwn;

    // SMART
    @Column(name = "disco_temperatura")
    private String discoTemperatura;

    @Column(name = "disco_horas_encendido")
    private String discoHorasEncendido;

    @Column(name = "disco_sectores_reasignados")
    private String discoSectoresReasignados;

    @Column(name = "disco_sectores_pendientes")
    private String discoSectoresPendientes;

    @Column(name = "disco_errores_lectura")
    private String discoErroresLectura;

    @Column(name = "disco_error_crc")
    private String discoErrorCrc;

    // GPU
    @Column(name = "gpu_nombre")
    private String gpuNombre;

    // RAM (desde HW)
    @Column(name = "ram_capacidad_gb")
    private Integer ramCapacidadGb;

    @Column(name = "ram_frecuencia_mhz")
    private Integer ramFrecuenciaMhz;

    @Column(name = "ram_tecnologia_modulo")
    private String ramTecnologiaModulo;

    @Column(name = "ram_tipo")
    private String ramTipo;

    @Column(name = "ram_numero_modulo")
    private Integer ramNumeroModulo;

    @Column(name = "ram_serie_modulo")
    private String ramSerieModulo;

    @Column(name = "ram_fecha_fabricacion")
    private String ramFechaFabricacion;

    @Column(name = "ram_lugar_fabricacion")
    private String ramLugarFabricacion;

    // Mainboard
    @Column(name = "mainboard_modelo")
    private String mainboardModelo;

    @Column(name = "equipo_nombre")
    private String equipoNombre;

    // Monitor
    @Column(name = "monitor_nombre")
    private String monitorNombre;

    @Column(name = "monitor_modelo")
    private String monitorModelo;

    // Audio
    @Column(name = "audio_adaptador")
    private String audioAdaptador;

    @Column(name = "audio_codec")
    private String audioCodec;

    @Column(name = "audio_hardware_id")
    private String audioHardwareId;

    // Interfaces
    @Column(name = "pci_express_version")
    private String pciExpressVersion;

    @Column(name = "usb_version")
    private String usbVersion;

    // Seguridad
    @Column(name = "tpm_presente")
    private Boolean tpmPresente;

    @Column(name = "tpm_version")
    private String tpmVersion;

    @Column(name = "hvci_estado")
    private String hvciEstado;

    /* ===========================================================
       =============== CAMPOS FÍSICOS HOJA TÉCNICA ===============
       =========================================================== */

    // Identificación
    @Column(name = "equipo_marca")
    private String equipoMarca;

    @Column(name = "equipo_modelo")
    private String equipoModelo;

    @Column(name = "equipo_serie")
    private String equipoSerie;

    @Column(name = "equipo_otros", length = 1000)
    private String equipoOtros;

    @Column(name = "equipo_roturas", length = 1000)
    private String equipoRoturas;

    @Column(name = "equipo_marcas_desgaste", length = 1000)
    private String equipoMarcasDesgaste;

    // Carcasa
    @Column(name = "tornillos_faltantes")
    private Boolean tornillosFaltantes;

    @Column(name = "carcasa_estado")
    private String carcasaEstado;

    @Column(name = "carcasa_observaciones", length = 1000)
    private String carcasaObservaciones;

    // Teclado
    @Column(name = "teclado_estado")
    private String tecladoEstado;

    @Column(name = "teclado_teclas_danadas")
    private Boolean tecladoTeclasDanadas;

    @Column(name = "teclado_teclas_faltantes")
    private Boolean tecladoTeclasFaltantes;

    @Column(name = "teclado_retroiluminacion")
    private Boolean tecladoRetroiluminacion;

    @Column(name = "teclado_observaciones", length = 1000)
    private String tecladoObservaciones;

    // Pantalla
    @Column(name = "pantalla_rayones")
    private Boolean pantallaRayones;

    @Column(name = "pantalla_trizaduras")
    private Boolean pantallaTrizaduras;

    @Column(name = "pantalla_pixeles_muertos")
    private Boolean pantallaPixelesMuertos;

    @Column(name = "pantalla_manchas")
    private Boolean pantallaManchas;

    @Column(name = "pantalla_tactil")
    private Boolean pantallaTactil;

    @Column(name = "pantalla_observaciones", length = 1000)
    private String pantallaObservaciones;

    // Puertos
    @Column(name = "puerto_usb")
    private Boolean puertoUsb;

    @Column(name = "puerto_vga")
    private Boolean puertoVga;

    @Column(name = "puerto_ethernet")
    private Boolean puertoEthernet;

    @Column(name = "puerto_hdmi")
    private Boolean puertoHdmi;

    @Column(name = "puerto_entrada_audio")
    private Boolean puertoEntradaAudio;

    @Column(name = "puerto_salida_audio")
    private Boolean puertoSalidaAudio;

    @Column(name = "puerto_micro_sd")
    private Boolean puertoMicroSd;

    @Column(name = "puerto_dvd")
    private Boolean puertoDvd;

    @Column(name = "puertos_observaciones", length = 1000)
    private String puertosObservaciones;

    // Touchpad
    @Column(name = "touchpad_estado")
    private String touchpadEstado;

    @Column(name = "touchpad_funciona")
    private Boolean touchpadFunciona;

    @Column(name = "touchpad_boton_izq")
    private Boolean touchpadBotonIzq;

    @Column(name = "touchpad_boton_der")
    private Boolean touchpadBotonDer;

    @Column(name = "touchpad_tactil")
    private Boolean touchpadTactil;

    @Column(name = "touchpad_observaciones", length = 1000)
    private String touchpadObservaciones;

    // Disco Hoja Técnica
    @Column(name = "disco_estado")
    private String discoEstado;

    @Column(name = "disco_tipo_ficha")
    private String discoTipoFicha;

    @Column(name = "disco_marca_ficha")
    private String discoMarcaFicha;

    @Column(name = "disco_capacidad_ficha")
    private String discoCapacidadFicha;

    @Column(name = "disco_serie_ficha")
    private String discoSerieFicha;

    @Column(name = "disco_observaciones_ficha", length = 1000)
    private String discoObservacionesFicha;

    // RAM Hoja Técnica
    @Column(name = "ram_tipo_equipo")
    private String ramTipoEquipo;

    @Column(name = "ram_cantidad_modulos")
    private Integer ramCantidadModulos;

    @Column(name = "ram_marca_ficha")
    private String ramMarcaFicha;

    @Column(name = "ram_tecnologia_ficha")
    private String ramTecnologiaFicha;

    @Column(name = "ram_capacidad_ficha")
    private String ramCapacidadFicha;

    @Column(name = "ram_frecuencia_ficha")
    private String ramFrecuenciaFicha;

    @Column(name = "ram_observaciones_ficha", length = 1000)
    private String ramObservacionesFicha;

    // Mainboard Hoja Técnica
    @Column(name = "mainboard_modelo_ficha")
    private String mainboardModeloFicha;

    @Column(name = "mainboard_observaciones", length = 1000)
    private String mainboardObservaciones;

    // Procesador Hoja Técnica
    @Column(name = "procesador_marca")
    private String procesadorMarca;

    @Column(name = "procesador_modelo")
    private String procesadorModelo;

    // Fuente de poder
    @Column(name = "fuente_ventilador_estado")
    private String fuenteVentiladorEstado;

    @Column(name = "fuente_ruido")
    private String fuenteRuido;

    @Column(name = "fuente_medicion_voltaje")
    private String fuenteMedicionVoltaje;

    @Column(name = "fuente_observaciones", length = 1000)
    private String fuenteObservaciones;

    // Gráfica física
    @Column(name = "grafica_tipo")
    private String graficaTipo;

    // Ventilador CPU
    @Column(name = "ventilador_cpu_observaciones", length = 1000)
    private String ventiladorCpuObservaciones;

    // Batería
    @Column(name = "bateria_codigo")
    private String bateriaCodigo;

    @Column(name = "bateria_observaciones", length = 1000)
    private String bateriaObservaciones;

    // Cargador
    @Column(name = "cargador_codigo")
    private String cargadorCodigo;

    @Column(name = "cargador_estado_cable")
    private String cargadorEstadoCable;

    @Column(name = "cargador_voltajes")
    private String cargadorVoltajes;

    // BIOS física
    @Column(name = "bios_contrasena")
    private Boolean biosContrasena;

    @Column(name = "bios_tipo_arranque")
    private String biosTipoArranque;

    @Column(name = "bios_secure_boot")
    private Boolean biosSecureBoot;

    @Column(name = "bios_observaciones_ficha", length = 1000)
    private String biosObservacionesFicha;

    // SO físico
    @Column(name = "so_tipo")
    private String soTipo;

    @Column(name = "so_version")
    private String soVersion;

    @Column(name = "so_licencia_activa")
    private Boolean soLicenciaActiva;

    // Antivirus
    @Column(name = "antivirus_marca")
    private String antivirusMarca;

    @Column(name = "antivirus_licencia_activa")
    private Boolean antivirusLicenciaActiva;

    @Column(name = "antivirus_observaciones", length = 1000)
    private String antivirusObservaciones;

    // Office
    @Column(name = "office_licencia_activa")
    private Boolean officeLicenciaActiva;

    @Column(name = "office_version")
    private String officeVersion;

    // Info almacenada
    @Column(name = "informacion_cantidad")
    private String informacionCantidad;

    @Column(name = "informacion_requiere_respaldo")
    private Boolean informacionRequiereRespaldo;

    @Column(name = "informacion_otros_programas", length = 1000)
    private String informacionOtrosProgramas;

    // Cámara
    @Column(name = "camara_funciona")
    private Boolean camaraFunciona;

    @Column(name = "camara_observaciones", length = 1000)
    private String camaraObservaciones;

    // WiFi
    @Column(name = "wifi_funciona")
    private Boolean wifiFunciona;

    @Column(name = "wifi_observaciones", length = 1000)
    private String wifiObservaciones;

    // Trabajo realizado
    @Column(name = "trabajo_realizado")
    private String trabajoRealizado;
}
