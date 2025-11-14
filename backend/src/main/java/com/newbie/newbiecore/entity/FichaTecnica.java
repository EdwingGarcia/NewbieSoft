package com.newbie.newbiecore.entity;

import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fichas_tecnicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaTecnica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "orden_trabajo_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private OrdenTrabajo ordenTrabajo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tecnico_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario tecnico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Equipo equipo;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant fechaCreacion;

    /* ========= CAMPOS AUTORELLENABLES DESDE hardware_json ========= */

    // SISTEMA OPERATIVO (Hoja: "SISTEMA OPERATIVO / VERSIÓN / LICENCIA")
    @Column(name = "so_descripcion")
    private String soDescripcion; // ej: "Microsoft Windows 10 Professional (x64) Build 17134.1304 ..."

    // CPU (Hoja: PROCESADOR MARCA Y MODELO)
    @Column(name = "cpu_nombre")
    private String cpuNombre; // "Intel Core i5-8400"

    @Column(name = "cpu_nucleos")
    private Integer cpuNucleos; // "Número de núcleos de procesador"

    @Column(name = "cpu_logicos")
    private Integer cpuLogicos; // "Número de procesadores lógicos"

    // RAM (Hoja: MEMORIA RAM: tipo, capacidad, frecuencia)
    @Column(name = "ram_tipo")
    private String ramTipo; // "DDR4 SDRAM"

    @Column(name = "ram_tecnologia_modulo")
    private String ramTecnologiaModulo; // "SO-DIMM"

    @Column(name = "ram_capacidad_gb")
    private Integer ramCapacidadGb; // de "Tamaño del módulo": 16 GBytes

    @Column(name = "ram_frecuencia_mhz")
    private Integer ramFrecuenciaMhz; // si lo sacas del JSON (si viene)

    // DISCO DURO (Hoja: DISCO DURO tipo/marca/capacidad/serie/estado)
    @Column(name = "disco_modelo")
    private String discoModelo; // "HGST HTS721010A9E630"

    @Column(name = "disco_capacidad_mb")
    private Integer discoCapacidadMb; // 953869

    @Column(name = "disco_capacidad_str")
    private String discoCapacidadStr; // texto original completo, por si acaso

    @Column(name = "disco_numero_serie")
    private String discoNumeroSerie; // "JR1000BNKGWT9E"

    @Column(name = "disco_rpm")
    private Integer discoRpm; // 7200

    @Column(name = "disco_tipo")
    private String discoTipo; // "MECÁNICO" / "SÓLIDO" -> lo puedes derivar si quieres (HDD/SSD)

    // MAINBOARD
    @Column(name = "mainboard_modelo")
    private String mainboardModelo; // "DELL 03CDJK"

    @Column(name = "chipset")
    private String chipset; // "Intel Q370 (Cannon Lake-H)"

    // GPU
    @Column(name = "gpu_nombre")
    private String gpuNombre; // "Intel UHD Graphics 630..."

    // RED
    @Column(name = "adaptador_red")
    private String adaptadorRed; // "Atheros/Qualcomm QCA6174 ..."

    @Column(name = "mac_address")
    private String macAddress; // "28-3A-4D-53-69-CB"

    @Column(name = "wifi_link_speed_actual")
    private String wifiLinkSpeedActual; // "2460 Mbps"

    @Column(name = "wifi_link_speed_max")
    private String wifiLinkSpeedMax; // "2460 Mbps"

    // BIOS / ARRANQUE (Hoja: BIOS: TIPO DE ARRANQUE / SECURITY BOOT)
    @Column(name = "bios_version")
    private String biosVersion; // "1.4.6"

    @Column(name = "bios_fabricante")
    private String biosFabricante; // "Dell Inc."

    @Column(name = "bios_fecha_str")
    private String biosFechaStr; // "10/10/2018" como string

    @Column(name = "bios_es_uefi_capaz")
    private Boolean biosEsUefiCapaz; // "UEFI BIOS": "Capaz"

    @Column(name = "arranque_uefi_presente")
    private Boolean arranqueUefiPresente; // "Arranque UEFI": "Presente"

    @Column(name = "secure_boot_activo")
    private Boolean secureBootActivo; // "Arranque seguro": "Activado"
}
