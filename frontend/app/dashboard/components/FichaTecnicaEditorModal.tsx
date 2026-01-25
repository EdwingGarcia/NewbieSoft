"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  type SyntheticEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, X, FileUp, Save, Search, ChevronDown,
  Cpu, MemoryStick, HardDrive, CircuitBoard, Wifi, Shield,
  Laptop, Keyboard, Monitor, Plug, Battery, FileCode,
  Database, Wrench, ClipboardList, Info, Zap, Settings2,
  Edit2, Lock, FileCheck, AlertCircle,
  type LucideIcon
} from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

const FICHAS_API_BASE = `${API_BASE_URL}/api/fichas`;
const EQUIPOS_API_BASE = `${API_BASE_URL}/api/equipos`;

// ===== Helpers para parsear valores del hardwareJson =====
/** Extrae el primer número entero de un string */
const extractInt = (value: string | undefined): number | null => {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/** Parsea booleano de texto (busca palabras clave) */
const parseBoolean = (value: string | undefined, expected: string): boolean | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes(expected.toLowerCase())) return true;
  if (lower.includes("no") || lower.includes("deshabilitado") || lower.includes("disabled")) return false;
  return null;
};

/** Extrae versión TPM de texto como "Present, version 2.0" */
const extractTpmVersion = (value: string | undefined): string | null => {
  if (!value) return null;
  const idx = value.toLowerCase().indexOf("version");
  if (idx >= 0) {
    return value.substring(idx).replace(/version/i, "").trim();
  }
  return value;
};

// ===== Interfaz para el hardwareJson (claves planas del backend) =====
// El backend guarda las claves tal cual vienen del XML HWiNFO en español
interface HardwareJson {
  // CPU
  "Nombre del procesador"?: string;
  "Número de núcleos de procesador"?: string;
  "Número de procesadores lógicos"?: string;
  "Número de paquetes de procesador (físicos)"?: string;
  "Original Processor Frequency [MHz]"?: string;

  // RAM
  "Tamaño del módulo"?: string;
  "Tipo de módulo"?: string;
  "Tipo de memoria"?: string;
  "Número de módulo"?: string;
  "Número de serie del módulo"?: string;
  "Fecha de fabricación del módulo"?: string;
  "Ubicación de fabricación del módulo"?: string;

  // Disco
  "Modelo de unidad"?: string;
  "Número de serie de la unidad"?: string;
  "Drive Capacity [MB]"?: string;
  "Capacidad de la unidad"?: string;
  "Tasa de rotación de medios"?: string;
  "Drive Letter(s)"?: string;
  "Nombre mundial (WWN)"?: string;
  "[C2] Temperatura"?: string;
  "[09] Número de ciclos/horas de encendido"?: string;
  "[05] Reasignado el conteo del sector"?: string;
  "[C5] Recuento actual de sectores pendientes"?: string;
  "[01] Tasa de errores en la lectura"?: string;
  "[C7] Tasa de error UltraDMA/SATA CRC"?: string;

  // GPU / Mainboard
  "Tarjeta grafica"?: string;
  "Modelo de placa base"?: string;
  "Chipset de la placa base"?: string;
  "Versión de PCI Express admitida"?: string;
  "Versión USB admitida"?: string;

  // Red
  "Tarjeta de red"?: string;
  "Dirección MAC"?: string;
  "Velocidad de enlace actual"?: string;
  "Velocidad máxima de enlace"?: string;

  // BIOS / UEFI
  "Fabricante de BIOS"?: string;
  "Versión de BIOS"?: string;
  "Fecha de BIOS (mm/dd/yyyy)"?: string;
  "UEFI BIOS"?: string;
  "Arranque UEFI"?: string;
  "Arranque seguro"?: string;

  // SO
  "Sistema operativo"?: string;
  "Descripción del proveedor"?: string;

  // TPM / HVCI
  "Chip del módulo de plataforma segura (TPM)"?: string;
  "Integridad de código protegida por hipervisor (HVCI)"?: string;

  // Equipo / Monitor
  "Nombre del computadora"?: string;
  "Nombre del monitor"?: string;
  "Nombre del monitor (del fabricante)"?: string;

  // Audio
  "Adaptador de sonido"?: string;
  "Códec de audio de alta definición"?: string;
  "ID de hardware del códec de audio"?: string;

  // Permitir propiedades adicionales
  [key: string]: string | undefined;
}

// ===== DTO Equipo (extendido) =====
interface EquipoDTO {
  idEquipo: number;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  hostname: string | null;
  sistemaOperativo: string | null;
  propietario?: string | null;
}

// ===== DTO Equipo completo del backend =====
interface EquipoDetalleDTO {
  id: number;
  numeroSerie: string | null;
  modelo: string | null;
  marca: string | null;
  cedulaCliente: string | null;
  tecnicoCedula: string | null;
  tecnicoNombre: string | null;
  hardwareJson: HardwareJson | null;
}

// ===== DTO Ficha =====
interface FichaTecnicaDTO {
  id: number;
  fechaCreacion: string;
  observaciones: string | null;

  equipoId: number | null;
  ordenTrabajoId: number | null;
  tecnicoId: string | null;
  clienteId: string | null;
  estado: string | null; // BORRADOR o CERRADA

  adaptadorRed: string | null;
  arranqueUefiPresente: boolean | null;
  biosEsUefiCapaz: boolean | null;
  biosFabricante: string | null;
  biosFechaStr: string | null;
  biosVersion: string | null;
  chipset: string | null;
  secureBootActivo: boolean | null;
  soDescripcion: string | null;
  soProveedor: string | null;
  macAddress: string | null;
  wifiLinkSpeedActual: string | null;
  wifiLinkSpeedMax: string | null;

  cpuNombre: string | null;
  cpuNucleos: number | null;
  cpuLogicos: number | null;
  cpuPaquetesFisicos: number | null;
  cpuFrecuenciaOriginalMhz: number | null;

  discoCapacidadMb: number | null;
  discoCapacidadStr: string | null;
  discoModelo: string | null;
  discoNumeroSerie: string | null;
  discoRpm: number | null;
  discoTipo: string | null;
  discoLetras: string | null;
  discoWwn: string | null;
  discoTemperatura: string | null;
  discoHorasEncendido: string | null;
  discoSectoresReasignados: string | null;
  discoSectoresPendientes: string | null;
  discoErroresLectura: string | null;
  discoErrorCrc: string | null;

  gpuNombre: string | null;

  ramCapacidadGb: number | null;
  ramFrecuenciaMhz: number | null;
  ramTecnologiaModulo: string | null;
  ramTipo: string | null;
  ramNumeroModulo: number | null;
  ramSerieModulo: string | null;
  ramFechaFabricacion: string | null;
  ramLugarFabricacion: string | null;

  mainboardModelo: string | null;
  equipoNombre: string | null;
  monitorNombre: string | null;
  monitorModelo: string | null;

  audioAdaptador: string | null;
  audioCodec: string | null;
  audioHardwareId: string | null;

  pciExpressVersion: string | null;
  usbVersion: string | null;

  tpmPresente: boolean | null;
  tpmVersion: string | null;
  hvciEstado: string | null;

  equipoMarca: string | null;
  equipoModelo: string | null;
  equipoSerie: string | null;
  equipoOtros: string | null;
  equipoRoturas: string | null;
  equipoMarcasDesgaste: string | null;
  tornillosFaltantes: boolean | null;

  carcasaEstado: string | null;
  carcasaObservaciones: string | null;

  tecladoEstado: string | null;
  tecladoTeclasDanadas: boolean | null;
  tecladoTeclasFaltantes: boolean | null;
  tecladoRetroiluminacion: boolean | null;
  tecladoObservaciones: string | null;

  pantallaRayones: boolean | null;
  pantallaTrizaduras: boolean | null;
  pantallaPixelesMuertos: boolean | null;
  pantallaManchas: boolean | null;
  pantallaTactil: boolean | null;
  pantallaObservaciones: string | null;

  puertoUsb: boolean | null;
  puertoVga: boolean | null;
  puertoEthernet: boolean | null;
  puertoHdmi: boolean | null;
  puertoEntradaAudio: boolean | null;
  puertoSalidaAudio: boolean | null;
  puertoMicroSd: boolean | null;
  puertoDvd: boolean | null;
  puertosObservaciones: string | null;

  touchpadEstado: string | null;
  touchpadFunciona: boolean | null;
  touchpadBotonIzq: boolean | null;
  touchpadBotonDer: boolean | null;
  touchpadTactil: boolean | null;
  touchpadObservaciones: string | null;

  discoEstado: string | null;
  discoTipoFicha: string | null;
  discoMarcaFicha: string | null;
  discoCapacidadFicha: string | null;
  discoSerieFicha: string | null;
  discoObservacionesFicha: string | null;

  ramTipoEquipo: string | null;
  ramCantidadModulos: number | null;
  ramMarcaFicha: string | null;
  ramTecnologiaFicha: string | null;
  ramCapacidadFicha: string | null;
  ramFrecuenciaFicha: string | null;
  ramObservacionesFicha: string | null;

  mainboardModeloFicha: string | null;
  mainboardObservaciones: string | null;

  procesadorMarca: string | null;
  procesadorModelo: string | null;

  fuenteVentiladorEstado: string | null;
  fuenteRuido: string | null;
  fuenteMedicionVoltaje: string | null;
  fuenteObservaciones: string | null;

  graficaTipo: string | null;
  ventiladorCpuObservaciones: string | null;

  bateriaCodigo: string | null;
  bateriaObservaciones: string | null;

  cargadorCodigo: string | null;
  cargadorEstadoCable: string | null;
  cargadorVoltajes: string | null;

  biosContrasena: boolean | null;
  biosTipoArranque: string | null;
  biosSecureBoot: boolean | null;
  biosObservacionesFicha: string | null;

  soTipo: string | null;
  soVersion: string | null;
  soLicenciaActiva: boolean | null;

  antivirusMarca: string | null;
  antivirusLicenciaActiva: boolean | null;
  antivirusObservaciones: string | null;

  officeLicenciaActiva: boolean | null;
  officeVersion: string | null;

  informacionCantidad: string | null;
  informacionRequiereRespaldo: boolean | null;
  informacionOtrosProgramas: string | null;

  camaraFunciona: boolean | null;
  camaraObservaciones: string | null;

  wifiFunciona: boolean | null;
  wifiObservaciones: string | null;

  trabajoRealizado: string | null;
}

// ===== Campos que se llenan automáticamente desde la API =====
const AUTO_FILL_FIELDS: (keyof FichaTecnicaDTO)[] = [
  // CPU
  "cpuNombre",
  "cpuNucleos",
  "cpuLogicos",
  "cpuPaquetesFisicos",
  "cpuFrecuenciaOriginalMhz",
  // RAM
  "ramCapacidadGb",
  "ramFrecuenciaMhz",
  "ramTecnologiaModulo",
  "ramTipo",
  "ramNumeroModulo",
  "ramSerieModulo",
  "ramFechaFabricacion",
  "ramLugarFabricacion",
  // Disco
  "discoModelo",
  "discoNumeroSerie",
  "discoTipo",
  "discoCapacidadMb",
  "discoCapacidadStr",
  "discoRpm",
  "discoLetras",
  "discoWwn",
  "discoTemperatura",
  "discoHorasEncendido",
  "discoSectoresReasignados",
  "discoSectoresPendientes",
  "discoErroresLectura",
  "discoErrorCrc",
  // Mainboard
  "mainboardModelo",
  "chipset",
  "pciExpressVersion",
  "usbVersion",
  // GPU
  "gpuNombre",
  // Red
  "adaptadorRed",
  "macAddress",
  "wifiLinkSpeedActual",
  "wifiLinkSpeedMax",
  // BIOS
  "biosFabricante",
  "biosVersion",
  "biosFechaStr",
  "biosEsUefiCapaz",
  "arranqueUefiPresente",
  "secureBootActivo",
  // TPM
  "tpmPresente",
  "tpmVersion",
  "hvciEstado",
  // Monitor
  "monitorNombre",
  "monitorModelo",
  // Audio
  "audioAdaptador",
  "audioCodec",
  "audioHardwareId",
  // SO
  "soDescripcion",
  "soProveedor",
  // Equipo
  "equipoNombre",
  "equipoMarca",
  "equipoModelo",
  "equipoSerie",
];

// ===== Section Component con Iconos =====
interface SectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-slate-500",
  badge,
  badgeColor = "bg-slate-100 text-slate-600",
  children,
}) => (
  <section className="group rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 shadow-sm ${iconColor}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {badge && (
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
    <div className="px-4 py-3 space-y-3">
      {children}
    </div>
  </section>
);

// ===== Campo con indicador de auto-relleno =====
const FieldLabel: React.FC<{
  label: string;
  isAuto?: boolean;
  required?: boolean;
}> = ({ label, isAuto, required }) => (
  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
    {label}
    {required && <span className="text-rose-500">*</span>}
    {isAuto && (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <Zap className="h-2.5 w-2.5" />
        Auto
      </span>
    )}
  </label>
);

// ===== Select Booleano Estilizado =====
const BooleanSelect: React.FC<{
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <select
    className="border border-slate-200 rounded-lg px-3 h-9 w-full text-xs bg-white hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    value={value === null ? "" : value ? "true" : "false"}
    onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "true")}
    disabled={disabled}
  >
    <option value="">Sin especificar</option>
    <option value="true">✓ Sí</option>
    <option value="false">✗ No</option>
  </select>
);

// ===== Combobox de Equipos con búsqueda y Soporte para InitialDisplay =====
interface EquipoComboboxProps {
  value: number | null;
  onChange: (equipoId: number | null, equipoData?: EquipoDTO | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  initialDisplay?: string | null;
}

const EquipoCombobox: React.FC<EquipoComboboxProps> = ({
  value,
  onChange,
  disabled,
  isLoading = false,
  initialDisplay
}) => {
  const [equipos, setEquipos] = useState<EquipoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Cargar equipos solo si no está deshabilitado para ahorrar recursos
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(EQUIPOS_API_BASE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEquipos(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error cargando equipos:", e);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargamos la lista si el combo está habilitado
    if (!disabled) {
      fetchEquipos();
    }
  }, [token, disabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeText = (text: string | null | undefined) => {
    if (!text) return "";
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const filteredEquipos = equipos.filter((eq) => {
    if (!searchTerm.trim()) return true;
    const term = normalizeText(searchTerm);
    return (
      normalizeText(eq.modelo).includes(term) ||
      normalizeText(eq.marca).includes(term) ||
      normalizeText(eq.numeroSerie).includes(term) ||
      normalizeText(eq.hostname).includes(term) ||
      normalizeText(eq.tipo).includes(term) ||
      String(eq.idEquipo).includes(term)
    );
  });

  const selectedEquipo = equipos.find((eq) => eq.idEquipo === value);

  const formatEquipoDisplay = (eq: EquipoDTO) => {
    const parts = [
      eq.marca,
      eq.modelo,
      eq.numeroSerie ? `(S/N: ${eq.numeroSerie})` : null,
      eq.hostname ? `[${eq.hostname}]` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : `Equipo #${eq.idEquipo}`;
  };

  const handleSelect = (eq: EquipoDTO) => {
    onChange(eq.idEquipo, eq);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange(null, null);
    setSearchTerm("");
  };

  // Función para obtener el texto a mostrar con prioridad
  const getDisplayText = () => {
    // 1. Si encontramos el equipo en la lista cargada (Prioridad Alta - Modo Selección)
    if (selectedEquipo) return formatEquipoDisplay(selectedEquipo);

    // 2. Si hay un initialDisplay y tenemos valor seleccionado (Prioridad Media - Modo Edición/Bloqueado)
    if (initialDisplay && value) return initialDisplay;

    // 3. Fallback si solo tenemos ID
    if (value) return `Equipo ID: ${value}`;

    return "Seleccionar equipo...";
  };

  // Renderizado en modo deshabilitado (SOLO LECTURA / EDICIÓN)
  if (disabled) {
    return (
      <div className="h-8 px-3 flex items-center bg-slate-100 border rounded-md text-xs text-slate-600 cursor-not-allowed opacity-80 select-none">
        <span className="truncate font-medium">
          {isLoading ? "Cargando..." : getDisplayText()}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
        disabled={isLoading || loading}
        className={`h-8 w-full px-3 flex items-center justify-between bg-white border rounded-md text-xs text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate">
          {(isLoading || loading) ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando...
            </span>
          ) : (
            getDisplayText()
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !isLoading && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar por serie, modelo, hostname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filteredEquipos.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">No se encontraron equipos</div>
            ) : (
              filteredEquipos.map((eq) => (
                <button
                  key={eq.idEquipo}
                  type="button"
                  onClick={() => handleSelect(eq)}
                  className={`w-full px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 ${value === eq.idEquipo ? "bg-slate-100" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {eq.marca} {eq.modelo}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {eq.tipo && <span className="mr-2">{eq.tipo}</span>}
                        {eq.numeroSerie && <span className="mr-2">S/N: {eq.numeroSerie}</span>}
                        {eq.hostname && <span>[{eq.hostname}]</span>}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">#{eq.idEquipo}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {value && (
            <div className="p-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-xs text-rose-600 hover:text-rose-700 py-1"
              >
                Quitar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== Props =====
interface FichaTecnicaEditorModalProps {
  open: boolean;
  fichaId: number | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function FichaTecnicaEditorModal({
  open,
  fichaId,
  onClose,
  onSaved,
}: FichaTecnicaEditorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargandoEquipo, setCargandoEquipo] = useState(false);

  const [detalle, setDetalle] = useState<FichaTecnicaDTO | null>(null);
  const [detalleForm, setDetalleForm] = useState<FichaTecnicaDTO | null>(null);

  // Estados para control de edición en fichas cerradas
  const [modoEdicionForzado, setModoEdicionForzado] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // ✅ Variable Helper para saber si estamos editando
  // Si fichaId existe (y es > 0), es modo edición. Si es null/0, es modo crear.
  const esModoEdicion = Boolean(fichaId && fichaId > 0);

  // ✅ Determinar si la ficha está cerrada
  const fichaCerrada = detalleForm?.estado === "CERRADA";

  // ✅ Determinar si los campos deben estar deshabilitados
  const camposDeshabilitados = fichaCerrada && !modoEdicionForzado;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fmtBoolSelect = (v: boolean | null): string => (v === null ? "" : v ? "true" : "false");

  const parseBoolInput = (value: string): boolean | null => {
    if (value === "") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  };

  const updateField = <K extends keyof FichaTecnicaDTO>(field: K, value: FichaTecnicaDTO[K]) => {
    // No permitir cambios si la ficha está cerrada y no hay modo edición forzado
    if (fichaCerrada && !modoEdicionForzado) return;
    setDetalleForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleEquipoChange = async (equipoId: number | null, equipoData?: EquipoDTO | null) => {
    // Si estamos editando una ficha existente, no permitimos cambiar el equipo
    if (esModoEdicion) return;
    // Si la ficha está cerrada y no hay modo edición forzado, no permitir
    if (fichaCerrada && !modoEdicionForzado) return;

    console.log("📝 Cambio de equipo:", { equipoId, tengoData: !!equipoData });

    // Si se quita la selección
    if (equipoId === null) {
      setDetalleForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          equipoId: null,
        };
      });
      return;
    }

    // Actualizar el ID del equipo inmediatamente con los datos básicos
    setDetalleForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        equipoId,
        // Información básica del equipo
        equipoNombre: equipoData?.hostname || null,
        equipoMarca: equipoData?.marca || null,
        equipoModelo: equipoData?.modelo || null,
        equipoSerie: equipoData?.numeroSerie || null,
        // SO si está disponible
        soDescripcion: equipoData?.sistemaOperativo || null,
        // Si la ficha no tiene cliente aún, poner el propietario
        clienteId: (!prev.clienteId && equipoData?.propietario) ? equipoData.propietario : prev.clienteId
      };
    });

    if (!token) return;

    console.log("🔍 Obteniendo datos completos del equipo:", equipoId);
    setCargandoEquipo(true);

    try {
      // 1. Primero obtener los detalles completos del equipo (con hardwareJson)
      const equipoRes = await fetch(`${EQUIPOS_API_BASE}/${equipoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (equipoRes.ok) {
        const equipoDetalle: EquipoDetalleDTO = await equipoRes.json();
        const hw = equipoDetalle.hardwareJson;

        if (hw) {
          console.log("✅ Hardware JSON encontrado, auto-rellenando campos...", hw);

          setDetalleForm((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              // === CPU ===
              cpuNombre: hw["Nombre del procesador"] || prev.cpuNombre,
              cpuNucleos: extractInt(hw["Número de núcleos de procesador"]) ?? prev.cpuNucleos,
              cpuLogicos: extractInt(hw["Número de procesadores lógicos"]) ?? prev.cpuLogicos,
              cpuPaquetesFisicos: extractInt(hw["Número de paquetes de procesador (físicos)"]) ?? prev.cpuPaquetesFisicos,
              cpuFrecuenciaOriginalMhz: extractInt(hw["Original Processor Frequency [MHz]"]) ?? prev.cpuFrecuenciaOriginalMhz,

              // === RAM ===
              ramCapacidadGb: extractInt(hw["Tamaño del módulo"]) ?? prev.ramCapacidadGb,
              ramTecnologiaModulo: hw["Tipo de módulo"] || prev.ramTecnologiaModulo,
              ramTipo: hw["Tipo de memoria"] || prev.ramTipo,
              ramNumeroModulo: extractInt(hw["Número de módulo"]) ?? prev.ramNumeroModulo,
              ramSerieModulo: hw["Número de serie del módulo"] || prev.ramSerieModulo,
              ramFechaFabricacion: hw["Fecha de fabricación del módulo"] || prev.ramFechaFabricacion,
              ramLugarFabricacion: hw["Ubicación de fabricación del módulo"] || prev.ramLugarFabricacion,

              // === DISCO ===
              discoModelo: hw["Modelo de unidad"] || prev.discoModelo,
              discoNumeroSerie: hw["Número de serie de la unidad"] || prev.discoNumeroSerie,
              discoCapacidadMb: extractInt(hw["Drive Capacity [MB]"]) ?? prev.discoCapacidadMb,
              discoCapacidadStr: hw["Capacidad de la unidad"] || prev.discoCapacidadStr,
              discoRpm: extractInt(hw["Tasa de rotación de medios"]) ?? prev.discoRpm,
              discoLetras: hw["Drive Letter(s)"] || prev.discoLetras,
              discoWwn: hw["Nombre mundial (WWN)"] || prev.discoWwn,
              discoTemperatura: hw["[C2] Temperatura"] || prev.discoTemperatura,
              discoHorasEncendido: hw["[09] Número de ciclos/horas de encendido"] || prev.discoHorasEncendido,
              discoSectoresReasignados: hw["[05] Reasignado el conteo del sector"] || prev.discoSectoresReasignados,
              discoSectoresPendientes: hw["[C5] Recuento actual de sectores pendientes"] || prev.discoSectoresPendientes,
              discoErroresLectura: hw["[01] Tasa de errores en la lectura"] || prev.discoErroresLectura,
              discoErrorCrc: hw["[C7] Tasa de error UltraDMA/SATA CRC"] || prev.discoErrorCrc,

              // === MAINBOARD ===
              mainboardModelo: hw["Modelo de placa base"] || prev.mainboardModelo,
              chipset: hw["Chipset de la placa base"] || prev.chipset,
              pciExpressVersion: hw["Versión de PCI Express admitida"] || prev.pciExpressVersion,
              usbVersion: hw["Versión USB admitida"] || prev.usbVersion,

              // === GPU ===
              gpuNombre: hw["Tarjeta grafica"] || prev.gpuNombre,

              // === RED ===
              adaptadorRed: hw["Tarjeta de red"] || prev.adaptadorRed,
              macAddress: hw["Dirección MAC"] || prev.macAddress,
              wifiLinkSpeedActual: hw["Velocidad de enlace actual"] || prev.wifiLinkSpeedActual,
              wifiLinkSpeedMax: hw["Velocidad máxima de enlace"] || prev.wifiLinkSpeedMax,

              // === BIOS ===
              biosFabricante: hw["Fabricante de BIOS"] || prev.biosFabricante,
              biosVersion: hw["Versión de BIOS"] || prev.biosVersion,
              biosFechaStr: hw["Fecha de BIOS (mm/dd/yyyy)"] || prev.biosFechaStr,
              biosEsUefiCapaz: parseBoolean(hw["UEFI BIOS"], "Capaz") ?? prev.biosEsUefiCapaz,
              arranqueUefiPresente: parseBoolean(hw["Arranque UEFI"], "Presente") ?? prev.arranqueUefiPresente,
              secureBootActivo: parseBoolean(hw["Arranque seguro"], "Activado") ?? prev.secureBootActivo,

              // === TPM ===
              tpmPresente: hw["Chip del módulo de plataforma segura (TPM)"]?.toLowerCase().includes("present") ?? prev.tpmPresente,
              tpmVersion: extractTpmVersion(hw["Chip del módulo de plataforma segura (TPM)"]) || prev.tpmVersion,
              hvciEstado: hw["Integridad de código protegida por hipervisor (HVCI)"] || prev.hvciEstado,

              // === MONITOR ===
              monitorNombre: hw["Nombre del monitor"] || prev.monitorNombre,
              monitorModelo: hw["Nombre del monitor (del fabricante)"] || prev.monitorModelo,

              // === AUDIO ===
              audioAdaptador: hw["Adaptador de sonido"] || prev.audioAdaptador,
              audioCodec: hw["Códec de audio de alta definición"] || prev.audioCodec,
              audioHardwareId: hw["ID de hardware del códec de audio"] || prev.audioHardwareId,

              // === SO ===
              soDescripcion: hw["Sistema operativo"] || prev.soDescripcion,
              soProveedor: hw["Descripción del proveedor"] || prev.soProveedor,

              // === NOMBRE EQUIPO ===
              equipoNombre: hw["Nombre del computadora"] || prev.equipoNombre,

              // === DATOS DEL EQUIPO (del DTO) ===
              equipoMarca: equipoDetalle.marca || prev.equipoMarca,
              equipoModelo: equipoDetalle.modelo || prev.equipoModelo,
              equipoSerie: equipoDetalle.numeroSerie || prev.equipoSerie,
              clienteId: equipoDetalle.cedulaCliente || prev.clienteId,
              tecnicoId: equipoDetalle.tecnicoCedula || prev.tecnicoId,
            };
          });
        }
      }

      // 2. Luego buscar si hay una ficha técnica anterior del equipo para campos adicionales
      console.log("🔍 Buscando ficha técnica anterior del equipo:", equipoId);

      const fichaRes = await fetch(`${FICHAS_API_BASE}/equipo/${equipoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fichaRes.ok) {
        const fichasArray = await fichaRes.json();
        const fichaEquipo = Array.isArray(fichasArray) && fichasArray.length > 0
          ? fichasArray[fichasArray.length - 1]
          : fichasArray;

        if (fichaEquipo && fichaEquipo.id) {
          console.log("📋 Ficha anterior encontrada, completando campos faltantes...");
          // Autollenar los campos especificados que no se hayan llenado ya
          setDetalleForm((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };

            AUTO_FILL_FIELDS.forEach((field) => {
              // Solo llenar si el campo está vacío y hay dato en la ficha anterior
              if ((updated[field] === null || updated[field] === undefined || updated[field] === "") &&
                fichaEquipo[field] !== undefined && fichaEquipo[field] !== null) {
                updated[field] = fichaEquipo[field];
              }
            });

            // Reasegurar el ID correcto del equipo seleccionado
            updated.equipoId = equipoId;
            return updated;
          });
        }
      }
    } catch (e) {
      console.error("❌ Error al cargar datos del equipo:", e);
    } finally {
      setCargandoEquipo(false);
    }
  };

  const fetchFicha = useCallback(async () => {
    if (!fichaId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${FICHAS_API_BASE}/${fichaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error al cargar ficha (HTTP ${res.status})`);

      const data: FichaTecnicaDTO = await res.json();
      setDetalle(data);
      setDetalleForm(data);
    } catch (e: any) {
      setError(e.message ?? "Error al cargar la ficha técnica");
    } finally {
      setLoading(false);
    }
  }, [fichaId, token]);

  useEffect(() => {
    if (open) {
      if (fichaId) {
        fetchFicha();
      } else {
        // Modo CREAR
        setDetalleForm({} as FichaTecnicaDTO);
        setDetalle(null);
        setError(null);
      }
    } else {
      setDetalle(null);
      setDetalleForm(null);
      setError(null);
    }
  }, [open, fichaId, fetchFicha]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const guardarFichaCompleta = async (e?: SyntheticEvent, estadoNuevo?: string) => {
    e?.preventDefault();
    if (!detalleForm || !token) return;

    const equipoIdAntes = detalleForm.equipoId;
    const method = detalleForm.id ? "PUT" : "POST";
    const url = detalleForm.id ? `${FICHAS_API_BASE}/${detalleForm.id}` : FICHAS_API_BASE;

    // Si se pasa un estado nuevo, actualizarlo
    const dataToSend = estadoNuevo
      ? { ...detalleForm, estado: estadoNuevo }
      : detalleForm;

    try {
      setGuardando(true);
      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al guardar (HTTP ${res.status}): ${errorText}`);
      }

      const actualizada: FichaTecnicaDTO = await res.json();
      const fichaActualizada = {
        ...actualizada,
        equipoId: actualizada.equipoId ?? equipoIdAntes,
      };

      setDetalle(fichaActualizada);
      setDetalleForm(fichaActualizada);

      // Resetear modo edición forzado si se cerró
      if (estadoNuevo === "CERRADA") {
        setModoEdicionForzado(false);
      }

      alert(estadoNuevo === "CERRADA"
        ? "✅ Ficha técnica cerrada correctamente"
        : "✅ Ficha técnica guardada como borrador");
      onSaved?.();
    } catch (e: any) {
      console.error("❌ Error al guardar:", e);
      alert("❌ " + (e.message || "Error desconocido"));
    } finally {
      setGuardando(false);
    }
  };

  // Guardar como borrador
  const guardarBorrador = (e?: SyntheticEvent) => {
    guardarFichaCompleta(e, "BORRADOR");
  };

  // Cerrar ficha (con confirmación)
  const cerrarFicha = () => {
    setShowConfirmClose(true);
  };

  const confirmarCerrarFicha = () => {
    setShowConfirmClose(false);
    guardarFichaCompleta(undefined, "CERRADA");
  };

  // Habilitar edición en ficha cerrada (con confirmación)
  const solicitarEdicion = () => {
    setShowConfirmEdit(true);
  };

  const confirmarEdicion = () => {
    setShowConfirmEdit(false);
    setModoEdicionForzado(true);
  };

  const descargarPdf = async () => {
    if (!detalleForm || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pdf/ficha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(detalleForm),
      });

      if (!res.ok) {
        console.error("Error al generar PDF", await res.text());
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ficha-${detalleForm.id || 'nueva'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-3 flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-2xl">
        {/* Header Mejorado */}
        <header className="sticky top-0 z-20 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Lado izquierdo - Título y badges */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {loading ? "Cargando..." : esModoEdicion ? `Ficha Técnica #${detalleForm?.id}` : "Nueva Ficha Técnica"}
                  </h2>
                  {/* Badge de estado */}
                  {fichaCerrada ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-green-300 border border-green-500/30">
                      <Lock className="h-3 w-3" />
                      Cerrada
                    </span>
                  ) : esModoEdicion ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Borrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Nuevo
                    </span>
                  )}
                  {/* Botón de editar para fichas cerradas */}
                  {fichaCerrada && !modoEdicionForzado && (
                    <button
                      onClick={solicitarEdicion}
                      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 transition-all"
                      title="Habilitar edición"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {modoEdicionForzado && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                      <Edit2 className="h-3 w-3" />
                      Modo Edición
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {esModoEdicion && detalleForm?.fechaCreacion
                    ? `Creada el ${new Date(detalleForm.fechaCreacion).toLocaleString()}`
                    : "Complete la información del equipo para generar el diagnóstico"}
                </p>
              </div>
            </div>

            {/* Lado derecho - Acciones */}
            <div className="flex items-center gap-3">
              {/* Info rápida */}
              {detalleForm && (
                <div className="hidden md:flex items-center gap-3 mr-2">
                  {detalleForm.equipoId && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg">
                      <Laptop className="h-3.5 w-3.5" />
                      <span>Equipo #{detalleForm.equipoId}</span>
                    </div>
                  )}
                  {detalleForm.ordenTrabajoId && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg">
                      <Wrench className="h-3.5 w-3.5" />
                      <span>OT #{detalleForm.ordenTrabajoId}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Body con scroll suave */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/50 p-5 scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-slate-400" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Cargando ficha técnica...</p>
              <p className="text-xs text-slate-400">Esto puede tomar un momento</p>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-6 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
                <X className="h-6 w-6 text-rose-500" />
              </div>
              <h3 className="text-sm font-semibold text-rose-800 mb-1">Error al cargar</h3>
              <p className="text-xs text-rose-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs border-rose-300 text-rose-700 hover:bg-rose-100"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          ) : !detalleForm ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 rounded-xl bg-slate-200 flex items-center justify-center animate-pulse mb-3">
                <Settings2 className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Iniciando formulario...</p>
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              {/* Banner de ficha cerrada */}
              {camposDeshabilitados && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Ficha técnica cerrada</p>
                    <p className="text-xs text-green-600">
                      Esta ficha está en modo solo lectura. Haz clic en el ícono de lápiz en la cabecera para habilitar la edición.
                    </p>
                  </div>
                </div>
              )}

              {/* METADATOS BÁSICOS */}
              <Section title="Identificación de Ficha" subtitle="Información básica del registro" icon={Info} iconColor="text-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel label="ID ficha" />
                    <Input className="h-9 bg-slate-50 text-xs border-slate-200" value={detalleForm.id ?? "(Nuevo)"} disabled />
                  </div>

                  <div>
                    <FieldLabel label="Fecha creación" />
                    <Input
                      className="h-9 bg-slate-50 text-xs border-slate-200"
                      value={
                        detalleForm.fechaCreacion
                          ? new Date(detalleForm.fechaCreacion).toLocaleString()
                          : new Date().toLocaleString()
                      }
                      disabled
                    />
                  </div>

                  {/* ✅ EQUIPO COMBOBOX */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">Equipo</label>
                      {esModoEdicion ? (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Bloqueado</span>
                      ) : (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Zap className="h-2.5 w-2.5" /> Autollenar
                        </span>
                      )}
                    </div>

                    <EquipoCombobox
                      value={detalleForm.equipoId}
                      onChange={handleEquipoChange}
                      isLoading={cargandoEquipo}
                      disabled={esModoEdicion}
                      initialDisplay={
                        esModoEdicion && detalleForm.equipoId
                          ? `${detalleForm.equipoMarca || ''} ${detalleForm.equipoModelo || ''} ${detalleForm.equipoSerie ? `(S/N: ${detalleForm.equipoSerie})` : ''} ${detalleForm.equipoNombre ? `[${detalleForm.equipoNombre}]` : ''}`.trim()
                          : null
                      }
                    />
                  </div>

                  {/* OT SOLO LECTURA */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">Orden Trabajo ID</label>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Solo lectura</span>
                    </div>
                    <Input
                      type="number"
                      className="h-9 bg-slate-50 text-xs cursor-not-allowed border-slate-200"
                      value={detalleForm.ordenTrabajoId ?? ""}
                      disabled
                      title="La orden de trabajo no se puede modificar"
                    />
                  </div>

                  {/* TÉCNICO */}
                  <div>
                    <FieldLabel label="Técnico (cédula)" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="Ej: 1234567890"
                      value={detalleForm.tecnicoId ?? ""}
                      onChange={(e) => updateField("tecnicoId", e.target.value || null)}
                    />
                  </div>

                  {/* CLIENTE */}
                  <div>
                    <FieldLabel label="Cliente (cédula)" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="Ej: 1234567890"
                      value={detalleForm.clienteId ?? ""}
                      onChange={(e) => updateField("clienteId", e.target.value || null)}
                    />
                  </div>
                </div>
              </Section>

              {/* ... RESTO DE SECCIONES COMPLETAS ... */}
              <Section title="Observaciones Generales" subtitle="Notas iniciales del equipo" icon={ClipboardList} iconColor="text-purple-500">
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:border-blue-400 transition-all resize-none"
                  value={detalleForm.observaciones ?? ""}
                  onChange={(e) => updateField("observaciones", e.target.value)}
                  placeholder="Estado general del equipo, comentarios del cliente, síntomas iniciales, etc."
                />
              </Section>

              {/* CPU */}
              <Section title="Procesador (CPU)" subtitle="Especificaciones del procesador" icon={Cpu} iconColor="text-indigo-500" badge="Hardware">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <FieldLabel label="Modelo" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                      value={detalleForm.cpuNombre ?? ""}
                      onChange={(e) => updateField("cpuNombre", e.target.value)}
                      placeholder="Ej: Intel Core i7-1165G7"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Núcleos" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                      value={detalleForm.cpuNucleos ?? ""}
                      onChange={(e) =>
                        updateField("cpuNucleos", e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Hilos lógicos" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                      value={detalleForm.cpuLogicos ?? ""}
                      onChange={(e) =>
                        updateField("cpuLogicos", e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Frecuencia (MHz)" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                      value={detalleForm.cpuFrecuenciaOriginalMhz ?? ""}
                      onChange={(e) =>
                        updateField(
                          "cpuFrecuenciaOriginalMhz",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      placeholder="2800"
                    />
                  </div>
                </div>
              </Section>

              {/* RAM */}
              <Section title="Memoria RAM" subtitle="Módulos de memoria instalados" icon={MemoryStick} iconColor="text-violet-500" badge="Hardware">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel label="Capacidad (GB)" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                      value={detalleForm.ramCapacidadGb ?? ""}
                      onChange={(e) =>
                        updateField("ramCapacidadGb", e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="16"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Frecuencia (MHz)" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                      value={detalleForm.ramFrecuenciaMhz ?? ""}
                      onChange={(e) =>
                        updateField("ramFrecuenciaMhz", e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="3200"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Tipo" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                      value={detalleForm.ramTipo ?? ""}
                      onChange={(e) => updateField("ramTipo", e.target.value)}
                      placeholder="DDR4"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Nº módulo" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                      value={detalleForm.ramNumeroModulo ?? ""}
                      onChange={(e) =>
                        updateField("ramNumeroModulo", e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Serie módulo" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                      value={detalleForm.ramSerieModulo ?? ""}
                      onChange={(e) => updateField("ramSerieModulo", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Tecnología" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                      value={detalleForm.ramTecnologiaModulo ?? ""}
                      onChange={(e) => updateField("ramTecnologiaModulo", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* DISCO */}
              <Section title="Almacenamiento" subtitle="Disco duro o SSD del equipo" icon={HardDrive} iconColor="text-emerald-500" badge="Hardware">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel label="Modelo" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoModelo ?? ""}
                      onChange={(e) => updateField("discoModelo", e.target.value)}
                      placeholder="Samsung 970 EVO"
                    />
                  </div>
                  <div>
                    <FieldLabel label="N° serie" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoNumeroSerie ?? ""}
                      onChange={(e) => updateField("discoNumeroSerie", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Tipo" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoTipo ?? ""}
                      onChange={(e) => updateField("discoTipo", e.target.value)}
                      placeholder="SSD NVMe"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Capacidad (MB)" isAuto />
                    <Input
                      type="number"
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoCapacidadMb ?? ""}
                      onChange={(e) =>
                        updateField("discoCapacidadMb", e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="512000"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Temperatura" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoTemperatura ?? ""}
                      onChange={(e) => updateField("discoTemperatura", e.target.value)}
                      placeholder="45°C"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Horas encendido" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoHorasEncendido ?? ""}
                      onChange={(e) => updateField("discoHorasEncendido", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Sectores reasignados" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoSectoresReasignados ?? ""}
                      onChange={(e) => updateField("discoSectoresReasignados", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Errores lectura" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      value={detalleForm.discoErroresLectura ?? ""}
                      onChange={(e) => updateField("discoErroresLectura", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* PLACA / GPU / TPM */}
              <Section title="Placa Base, GPU y Seguridad" subtitle="Componentes principales" icon={CircuitBoard} iconColor="text-cyan-500" badge="Hardware">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Modelo mainboard" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                      value={detalleForm.mainboardModelo ?? ""}
                      onChange={(e) => updateField("mainboardModelo", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Chipset" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                      value={detalleForm.chipset ?? ""}
                      onChange={(e) => updateField("chipset", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="GPU" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                      value={detalleForm.gpuNombre ?? ""}
                      onChange={(e) => updateField("gpuNombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="TPM presente" isAuto />
                    <BooleanSelect
                      value={detalleForm.tpmPresente}
                      onChange={(v) => updateField("tpmPresente", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="TPM versión" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                      value={detalleForm.tpmVersion ?? ""}
                      onChange={(e) => updateField("tpmVersion", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* RED / WIFI */}
              <Section title="Conectividad" subtitle="Red e interfaz inalámbrica" icon={Wifi} iconColor="text-sky-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Adaptador red" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-sky-400 focus:ring-sky-400/20"
                      value={detalleForm.adaptadorRed ?? ""}
                      onChange={(e) => updateField("adaptadorRed", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="MAC Address" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-sky-400 focus:ring-sky-400/20 font-mono"
                      value={detalleForm.macAddress ?? ""}
                      onChange={(e) => updateField("macAddress", e.target.value)}
                      placeholder="00:00:00:00:00:00"
                    />
                  </div>
                  <div>
                    <FieldLabel label="WiFi funciona" />
                    <BooleanSelect
                      value={detalleForm.wifiFunciona}
                      onChange={(v) => updateField("wifiFunciona", v)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <FieldLabel label="Observaciones WiFi" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-sky-400 focus:ring-sky-400/20"
                      value={detalleForm.wifiObservaciones ?? ""}
                      onChange={(e) => updateField("wifiObservaciones", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* BIOS */}
              <Section title="BIOS / UEFI" subtitle="Configuración de firmware" icon={Shield} iconColor="text-orange-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="BIOS fabricante" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                      value={detalleForm.biosFabricante ?? ""}
                      onChange={(e) => updateField("biosFabricante", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="BIOS versión" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                      value={detalleForm.biosVersion ?? ""}
                      onChange={(e) => updateField("biosVersion", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Secure Boot" isAuto />
                    <BooleanSelect
                      value={detalleForm.secureBootActivo}
                      onChange={(v) => updateField("secureBootActivo", v)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <FieldLabel label="Sistema Operativo" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                      value={detalleForm.soDescripcion ?? ""}
                      onChange={(e) => updateField("soDescripcion", e.target.value)}
                      placeholder="Windows 11 Pro 64-bit"
                    />
                  </div>
                </div>
              </Section>

              {/* EQUIPO FÍSICO */}
              <Section title="Identificación del Equipo" subtitle="Datos físicos y de etiquetado" icon={Laptop} iconColor="text-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel label="Hostname" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                      value={detalleForm.equipoNombre ?? ""}
                      onChange={(e) => updateField("equipoNombre", e.target.value)}
                      placeholder="PC-OFICINA-01"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Marca" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                      value={detalleForm.equipoMarca ?? ""}
                      onChange={(e) => updateField("equipoMarca", e.target.value)}
                      placeholder="HP, Dell, Lenovo..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="Modelo" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                      value={detalleForm.equipoModelo ?? ""}
                      onChange={(e) => updateField("equipoModelo", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Número de Serie" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 font-mono"
                      value={detalleForm.equipoSerie ?? ""}
                      onChange={(e) => updateField("equipoSerie", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Roturas o daños" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                      value={detalleForm.equipoRoturas ?? ""}
                      onChange={(e) => updateField("equipoRoturas", e.target.value)}
                      placeholder="Describir daños visibles..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="Tornillos faltantes" />
                    <BooleanSelect
                      value={detalleForm.tornillosFaltantes}
                      onChange={(v) => updateField("tornillosFaltantes", v)}
                    />
                  </div>
                </div>
              </Section>

              {/* CARCASA */}
              <Section title="Carcasa y Periféricos" subtitle="Estado de carcasa, teclado y touchpad" icon={Keyboard} iconColor="text-pink-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Estado carcasa" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-pink-400 focus:ring-pink-400/20"
                      value={detalleForm.carcasaEstado ?? ""}
                      onChange={(e) => updateField("carcasaEstado", e.target.value)}
                      placeholder="Bueno, Regular, Malo"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Observaciones carcasa" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-pink-400 focus:ring-pink-400/20"
                      value={detalleForm.carcasaObservaciones ?? ""}
                      onChange={(e) => updateField("carcasaObservaciones", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Estado teclado" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-pink-400 focus:ring-pink-400/20"
                      value={detalleForm.tecladoEstado ?? ""}
                      onChange={(e) => updateField("tecladoEstado", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Teclas dañadas" />
                    <BooleanSelect
                      value={detalleForm.tecladoTeclasDanadas}
                      onChange={(v) => updateField("tecladoTeclasDanadas", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Retroiluminación" />
                    <BooleanSelect
                      value={detalleForm.tecladoRetroiluminacion}
                      onChange={(v) => updateField("tecladoRetroiluminacion", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Touchpad funciona" />
                    <BooleanSelect
                      value={detalleForm.touchpadFunciona}
                      onChange={(v) => updateField("touchpadFunciona", v)}
                    />
                  </div>
                </div>
              </Section>

              {/* PANTALLA */}
              <Section title="Pantalla y Cámara" subtitle="Estado del display y webcam" icon={Monitor} iconColor="text-teal-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Modelo monitor" isAuto />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
                      value={detalleForm.monitorNombre ?? ""}
                      onChange={(e) => updateField("monitorNombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Rayones" />
                    <BooleanSelect
                      value={detalleForm.pantallaRayones}
                      onChange={(v) => updateField("pantallaRayones", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Píxeles muertos" />
                    <BooleanSelect
                      value={detalleForm.pantallaPixelesMuertos}
                      onChange={(v) => updateField("pantallaPixelesMuertos", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Pantalla táctil" />
                    <BooleanSelect
                      value={detalleForm.pantallaTactil}
                      onChange={(v) => updateField("pantallaTactil", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Cámara funciona" />
                    <BooleanSelect
                      value={detalleForm.camaraFunciona}
                      onChange={(v) => updateField("camaraFunciona", v)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <FieldLabel label="Observaciones pantalla" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
                      value={detalleForm.pantallaObservaciones ?? ""}
                      onChange={(e) => updateField("pantallaObservaciones", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* PUERTOS */}
              <Section title="Puertos e Interfaces" subtitle="Conectores disponibles" icon={Plug} iconColor="text-purple-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {([
                    ["puertoUsb", "USB"],
                    ["puertoVga", "VGA"],
                    ["puertoEthernet", "Ethernet"],
                    ["puertoHdmi", "HDMI"],
                    ["puertoEntradaAudio", "Audio In"],
                    ["puertoSalidaAudio", "Audio Out"],
                    ["puertoMicroSd", "MicroSD"],
                    ["puertoDvd", "DVD/CD"],
                  ] as const).map(([field, label]) => (
                    <div key={field}>
                      <FieldLabel label={label} />
                      <BooleanSelect
                        value={detalleForm[field] as boolean | null}
                        onChange={(v) => updateField(field, v as any)}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-4">
                    <FieldLabel label="Observaciones puertos" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                      value={detalleForm.puertosObservaciones ?? ""}
                      onChange={(e) => updateField("puertosObservaciones", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* BATERÍA */}
              <Section title="Batería y Cargador" subtitle="Estado de alimentación" icon={Battery} iconColor="text-lime-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Código batería" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-lime-400 focus:ring-lime-400/20 font-mono"
                      value={detalleForm.bateriaCodigo ?? ""}
                      onChange={(e) => updateField("bateriaCodigo", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Observaciones batería" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-lime-400 focus:ring-lime-400/20"
                      value={detalleForm.bateriaObservaciones ?? ""}
                      onChange={(e) => updateField("bateriaObservaciones", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Código cargador" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-lime-400 focus:ring-lime-400/20 font-mono"
                      value={detalleForm.cargadorCodigo ?? ""}
                      onChange={(e) => updateField("cargadorCodigo", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Estado cable" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-lime-400 focus:ring-lime-400/20"
                      value={detalleForm.cargadorEstadoCable ?? ""}
                      onChange={(e) => updateField("cargadorEstadoCable", e.target.value)}
                      placeholder="Bueno, Dañado, Pelado..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="Voltajes" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-lime-400 focus:ring-lime-400/20"
                      value={detalleForm.cargadorVoltajes ?? ""}
                      onChange={(e) => updateField("cargadorVoltajes", e.target.value)}
                      placeholder="19V 3.42A"
                    />
                  </div>
                </div>
              </Section>

              {/* SOFTWARE / LICENCIAS */}
              <Section title="Software y Licencias" subtitle="Sistema operativo y aplicaciones" icon={FileCode} iconColor="text-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel label="Tipo SO" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      value={detalleForm.soTipo ?? ""}
                      onChange={(e) => updateField("soTipo", e.target.value)}
                      placeholder="Windows, Linux, macOS"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Versión SO" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      value={detalleForm.soVersion ?? ""}
                      onChange={(e) => updateField("soVersion", e.target.value)}
                      placeholder="11 Pro, 10 Home..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="Licencia SO" />
                    <BooleanSelect
                      value={detalleForm.soLicenciaActiva}
                      onChange={(v) => updateField("soLicenciaActiva", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Antivirus" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      value={detalleForm.antivirusMarca ?? ""}
                      onChange={(e) => updateField("antivirusMarca", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Licencia Antivirus" />
                    <BooleanSelect
                      value={detalleForm.antivirusLicenciaActiva}
                      onChange={(v) => updateField("antivirusLicenciaActiva", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Versión Office" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      value={detalleForm.officeVersion ?? ""}
                      onChange={(e) => updateField("officeVersion", e.target.value)}
                      placeholder="365, 2021, 2019..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="Licencia Office" />
                    <BooleanSelect
                      value={detalleForm.officeLicenciaActiva}
                      onChange={(v) => updateField("officeLicenciaActiva", v)}
                    />
                  </div>
                </div>
              </Section>

              {/* INFORMACIÓN / RESPALDO */}
              <Section title="Datos y Respaldo" subtitle="Información del usuario" icon={Database} iconColor="text-rose-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Cantidad de información" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-rose-400 focus:ring-rose-400/20"
                      value={detalleForm.informacionCantidad ?? ""}
                      onChange={(e) => updateField("informacionCantidad", e.target.value)}
                      placeholder="50GB, 200GB..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="Requiere respaldo" />
                    <BooleanSelect
                      value={detalleForm.informacionRequiereRespaldo}
                      onChange={(v) => updateField("informacionRequiereRespaldo", v)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <FieldLabel label="Otros programas instalados" />
                    <Input
                      className="h-9 text-xs border-slate-200 focus:border-rose-400 focus:ring-rose-400/20"
                      value={detalleForm.informacionOtrosProgramas ?? ""}
                      onChange={(e) => updateField("informacionOtrosProgramas", e.target.value)}
                      placeholder="AutoCAD, Photoshop, Visual Studio..."
                    />
                  </div>
                </div>
              </Section>

              {/* TRABAJO REALIZADO */}
              <Section title="Trabajo Realizado" subtitle="Diagnóstico y reparaciones" icon={Wrench} iconColor="text-indigo-600">
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/30 focus-visible:border-indigo-400 transition-all resize-none"
                  value={detalleForm.trabajoRealizado ?? ""}
                  onChange={(e) => updateField("trabajoRealizado", e.target.value)}
                  placeholder="Describe detalladamente las acciones realizadas, repuestos cambiados, diagnósticos finales, recomendaciones, etc."
                />
              </Section>
            </form>
          )}
        </div>

        {/* Footer Mejorado con Exportar, Guardar Borrador y Cerrar Ficha */}
        {detalleForm && !loading && !error && (
          <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  {fichaCerrada && !modoEdicionForzado ? (
                    <Lock className="h-4 w-4 text-green-600" />
                  ) : (
                    <Settings2 className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Ficha #{detalleForm.id ?? "Nueva"}
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${fichaCerrada
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                      }`}>
                      {fichaCerrada ? "Cerrada" : "Borrador"}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {fichaCerrada && !modoEdicionForzado
                      ? "Ficha cerrada - Solo lectura"
                      : "Los cambios se guardarán al confirmar"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Botón Exportar PDF */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={descargarPdf}
                  disabled={!detalleForm.id}
                  className="h-10 px-4 border-violet-300 text-xs font-medium text-violet-700 hover:bg-violet-50"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-10 px-4 border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </Button>

                {/* Mostrar botones de edición solo si no está cerrada o si tiene modo edición forzado */}
                {(!fichaCerrada || modoEdicionForzado) && (
                  <>
                    {/* Guardar Borrador */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={guardando || camposDeshabilitados}
                      onClick={guardarBorrador}
                      className="h-10 px-4 border-amber-300 text-xs font-medium text-amber-700 hover:bg-amber-50"
                    >
                      {guardando ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar Borrador
                    </Button>

                    {/* Cerrar Ficha */}
                    <Button
                      type="button"
                      size="sm"
                      disabled={guardando || camposDeshabilitados}
                      onClick={cerrarFicha}
                      className="flex h-10 items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 px-5 text-xs font-medium text-white shadow-lg shadow-green-900/20 hover:from-green-500 hover:to-green-600 transition-all"
                    >
                      <FileCheck className="h-4 w-4" />
                      Cerrar Ficha
                    </Button>
                  </>
                )}
              </div>
            </div>
          </footer>
        )}

        {/* Modal de confirmación para editar ficha cerrada */}
        {showConfirmEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">¿Habilitar edición?</h3>
                  <p className="text-sm text-slate-500">Esta ficha está cerrada</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                La ficha técnica ya fue cerrada. ¿Estás seguro de que deseas habilitarla para edición?
                Los cambios quedarán registrados.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmEdit(false)}
                  className="px-4"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarEdicion}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Sí, habilitar edición
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para cerrar ficha */}
        {showConfirmClose && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <FileCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">¿Cerrar ficha técnica?</h3>
                  <p className="text-sm text-slate-500">Esta acción bloqueará la edición</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Una vez cerrada, la ficha técnica quedará en modo solo lectura.
                Podrás habilitarla para edición nuevamente si es necesario.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmClose(false)}
                  className="px-4"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarCerrarFicha}
                  className="bg-green-600 hover:bg-green-700 text-white px-4"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Sí, cerrar ficha
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}