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
import { Loader2, X, FileUp, Save, Search, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

const FICHAS_API_BASE = `${API_BASE_URL}/api/fichas`;
const EQUIPOS_API_BASE = `${API_BASE_URL}/api/equipos`;

// ===== DTO Equipo =====
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

// ===== DTO Ficha =====
interface FichaTecnicaDTO {
  id: number;
  fechaCreacion: string;
  observaciones: string | null;

  equipoId: number | null;
  ordenTrabajoId: number | null;
  tecnicoId: string | null;
  clienteId: string | null;

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
  "cpuNombre",
  "cpuNucleos",
  "cpuLogicos",
  "cpuPaquetesFisicos",
  "cpuFrecuenciaOriginalMhz",
  "ramCapacidadGb",
  "ramFrecuenciaMhz",
  "ramTecnologiaModulo",
  "ramTipo",
  "ramNumeroModulo",
  "ramSerieModulo",
  "ramFechaFabricacion",
  "ramLugarFabricacion",
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
  "mainboardModelo",
  "chipset",
  "gpuNombre",
  "adaptadorRed",
  "macAddress",
  "wifiLinkSpeedActual",
  "wifiLinkSpeedMax",
  "biosFabricante",
  "biosVersion",
  "biosFechaStr",
  "biosEsUefiCapaz",
  "arranqueUefiPresente",
  "secureBootActivo",
  "tpmPresente",
  "tpmVersion",
  "hvciEstado",
  "monitorNombre",
  "monitorModelo",
  "audioAdaptador",
  "audioCodec",
  "audioHardwareId",
  "soDescripcion",
];

// ===== Section Component =====
const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <section className="rounded-xl border bg-white/80 dark:bg-slate-900/50 shadow-sm px-4 py-3 space-y-3">
    <div className="flex items-center justify-between gap-2 border-b pb-1.5">
      <h3 className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-100 uppercase">
        {title}
      </h3>
      {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
    </div>
    {children}
  </section>
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

  // ✅ Variable Helper para saber si estamos editando
  // Si fichaId existe (y es > 0), es modo edición. Si es null/0, es modo crear.
  const esModoEdicion = Boolean(fichaId && fichaId > 0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fmtBoolSelect = (v: boolean | null): string => (v === null ? "" : v ? "true" : "false");

  const parseBoolInput = (value: string): boolean | null => {
    if (value === "") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  };

  const updateField = <K extends keyof FichaTecnicaDTO>(field: K, value: FichaTecnicaDTO[K]) => {
    setDetalleForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleEquipoChange = async (equipoId: number | null, equipoData?: EquipoDTO | null) => {
    // Si estamos editando una ficha existente, no permitimos cambiar el equipo
    if (esModoEdicion) return;

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

    // Actualizar el ID del equipo inmediatamente
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

    console.log("🔍 Buscando ficha técnica anterior del equipo:", equipoId);
    setCargandoEquipo(true);

    try {
      const res = await fetch(`${FICHAS_API_BASE}/equipo/${equipoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const fichasArray = await res.json();
        const fichaEquipo = Array.isArray(fichasArray) && fichasArray.length > 0
          ? fichasArray[fichasArray.length - 1]
          : fichasArray;

        if (fichaEquipo && fichaEquipo.id) {
          // Autollenar los campos especificados
          setDetalleForm((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };

            AUTO_FILL_FIELDS.forEach((field) => {
              if (fichaEquipo[field] !== undefined && fichaEquipo[field] !== null) {
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
      console.error("❌ Error al cargar ficha del equipo:", e);
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

  const guardarFichaCompleta = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (!detalleForm || !token) return;

    const equipoIdAntes = detalleForm.equipoId;
    const method = detalleForm.id ? "PUT" : "POST";
    const url = detalleForm.id ? `${FICHAS_API_BASE}/${detalleForm.id}` : FICHAS_API_BASE;

    try {
      setGuardando(true);
      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(detalleForm),
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

      alert("✅ Ficha técnica guardada correctamente");
      onSaved?.();
    } catch (e: any) {
      console.error("❌ Error al guardar:", e);
      alert("❌ " + (e.message || "Error desconocido"));
    } finally {
      setGuardando(false);
    }
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
      <div className="relative mx-3 flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                {loading ? "Cargando..." : esModoEdicion ? `Ficha Técnica #${detalleForm?.id}` : "Nueva Ficha Técnica"}
              </h2>
              <p className="text-[11px] text-slate-300">
                {esModoEdicion && detalleForm?.fechaCreacion
                  ? `Creada el ${new Date(detalleForm.fechaCreacion).toLocaleString()}`
                  : "Formulario de ingreso"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 border border-white/40 bg-white/10 px-3 text-[11px] text-white hover:bg-white/20"
                onClick={descargarPdf}
                disabled={!detalleForm || !detalleForm.id}
              >
                <FileUp className="h-4 w-4" />
                Descargar PDF
              </Button>

              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <p className="mt-3 text-sm text-slate-500">Cargando ficha técnica...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : !detalleForm ? (
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">
              Iniciando formulario...
            </div>
          ) : (
            <form onSubmit={guardarFichaCompleta} className="space-y-4">
              {/* METADATOS BÁSICOS */}
              <Section title="Metadatos de ficha">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">ID ficha</label>
                    <Input className="h-8 bg-slate-100 text-xs" value={detalleForm.id ?? "(Nuevo)"} disabled />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Fecha creación</label>
                    <Input
                      className="h-8 bg-slate-100 text-xs"
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
                    <label className="text-[11px] font-semibold text-slate-600">
                      Equipo
                      {esModoEdicion ? (
                        <span className="ml-1 text-[10px] text-slate-400">(Bloqueado en edición)</span>
                      ) : (
                        <span className="ml-1 text-[10px] text-amber-600">(Selecciona para autollenar)</span>
                      )}
                    </label>

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
                    <label className="text-[11px] font-semibold text-slate-600">
                      Orden Trabajo ID{" "}
                      <span className="ml-1 text-[10px] text-slate-400">(solo lectura)</span>
                    </label>
                    <Input
                      type="number"
                      className="h-8 bg-slate-100 text-xs cursor-not-allowed"
                      value={detalleForm.ordenTrabajoId ?? ""}
                      disabled
                      title="La orden de trabajo no se puede modificar"
                    />
                  </div>

                  {/* TÉCNICO */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Técnico (cédula)</label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Ej: 1234567890"
                      value={detalleForm.tecnicoId ?? ""}
                      onChange={(e) => updateField("tecnicoId", e.target.value || null)}
                    />
                  </div>

                  {/* CLIENTE */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cliente (cédula)</label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Ej: 1234567890"
                      value={detalleForm.clienteId ?? ""}
                      onChange={(e) => updateField("clienteId", e.target.value || null)}
                    />
                  </div>
                </div>
              </Section>

              {/* ... RESTO DE SECCIONES COMPLETAS ... */}
              <Section title="Observaciones generales">
                <textarea
                  className="w-full border rounded-md px-2 py-1 text-xs min-h-[70px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  value={detalleForm.observaciones ?? ""}
                  onChange={(e) => updateField("observaciones", e.target.value)}
                  placeholder="Estado general del equipo, comentarios del cliente, síntomas iniciales, etc."
                />
              </Section>

              {/* CPU */}
              <Section title="CPU" subtitle="Información lógica del procesador">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Nombre</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.cpuNombre ?? ""}
                      onChange={(e) => updateField("cpuNombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Núcleos</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.cpuNucleos ?? ""}
                      onChange={(e) =>
                        updateField("cpuNucleos", e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Hilos lógicos</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.cpuLogicos ?? ""}
                      onChange={(e) =>
                        updateField("cpuLogicos", e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Frecuencia (MHz)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.cpuFrecuenciaOriginalMhz ?? ""}
                      onChange={(e) =>
                        updateField(
                          "cpuFrecuenciaOriginalMhz",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </Section>

              {/* RAM */}
              <Section title="RAM (hardware)">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Capacidad (GB)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.ramCapacidadGb ?? ""}
                      onChange={(e) =>
                        updateField("ramCapacidadGb", e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Frecuencia (MHz)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.ramFrecuenciaMhz ?? ""}
                      onChange={(e) =>
                        updateField("ramFrecuenciaMhz", e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Tipo (DDR3/DDR4/DDR5)</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.ramTipo ?? ""}
                      onChange={(e) => updateField("ramTipo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Nº módulo</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.ramNumeroModulo ?? ""}
                      onChange={(e) =>
                        updateField("ramNumeroModulo", e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Serie módulo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.ramSerieModulo ?? ""}
                      onChange={(e) => updateField("ramSerieModulo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Tecnología módulo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.ramTecnologiaModulo ?? ""}
                      onChange={(e) => updateField("ramTecnologiaModulo", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* DISCO */}
              <Section title="Disco (hardware)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Modelo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoModelo ?? ""}
                      onChange={(e) => updateField("discoModelo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">N° serie</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoNumeroSerie ?? ""}
                      onChange={(e) => updateField("discoNumeroSerie", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Tipo (SSD/HDD)</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoTipo ?? ""}
                      onChange={(e) => updateField("discoTipo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Capacidad (MB)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={detalleForm.discoCapacidadMb ?? ""}
                      onChange={(e) =>
                        updateField("discoCapacidadMb", e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Temperatura</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoTemperatura ?? ""}
                      onChange={(e) => updateField("discoTemperatura", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Horas encendido</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoHorasEncendido ?? ""}
                      onChange={(e) => updateField("discoHorasEncendido", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Sectores reasignados</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoSectoresReasignados ?? ""}
                      onChange={(e) => updateField("discoSectoresReasignados", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Errores lectura</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.discoErroresLectura ?? ""}
                      onChange={(e) => updateField("discoErroresLectura", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* PLACA / GPU / TPM */}
              <Section title="Placa base / GPU / TPM">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Mainboard modelo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.mainboardModelo ?? ""}
                      onChange={(e) => updateField("mainboardModelo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Chipset</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.chipset ?? ""}
                      onChange={(e) => updateField("chipset", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">GPU nombre</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.gpuNombre ?? ""}
                      onChange={(e) => updateField("gpuNombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">TPM presente</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.tpmPresente)}
                      onChange={(e) => updateField("tpmPresente", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">TPM versión</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.tpmVersion ?? ""}
                      onChange={(e) => updateField("tpmVersion", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* RED / WIFI */}
              <Section title="Red / Wi-Fi">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Adaptador red</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.adaptadorRed ?? ""}
                      onChange={(e) => updateField("adaptadorRed", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">MAC Address</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.macAddress ?? ""}
                      onChange={(e) => updateField("macAddress", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">WiFi funciona</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.wifiFunciona)}
                      onChange={(e) => updateField("wifiFunciona", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600">Wifi observaciones</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.wifiObservaciones ?? ""}
                      onChange={(e) => updateField("wifiObservaciones", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* BIOS */}
              <Section title="BIOS / UEFI / Sistema Operativo">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">BIOS fabricante</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.biosFabricante ?? ""}
                      onChange={(e) => updateField("biosFabricante", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">BIOS versión</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.biosVersion ?? ""}
                      onChange={(e) => updateField("biosVersion", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Secure Boot activo</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.secureBootActivo)}
                      onChange={(e) => updateField("secureBootActivo", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600">SO descripción</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.soDescripcion ?? ""}
                      onChange={(e) => updateField("soDescripcion", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* EQUIPO FÍSICO */}
              <Section title="Equipo (identificación física)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Nombre equipo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.equipoNombre ?? ""}
                      onChange={(e) => updateField("equipoNombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Marca</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.equipoMarca ?? ""}
                      onChange={(e) => updateField("equipoMarca", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Modelo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.equipoModelo ?? ""}
                      onChange={(e) => updateField("equipoModelo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Serie</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.equipoSerie ?? ""}
                      onChange={(e) => updateField("equipoSerie", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Roturas</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.equipoRoturas ?? ""}
                      onChange={(e) => updateField("equipoRoturas", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Tornillos faltantes</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.tornillosFaltantes)}
                      onChange={(e) => updateField("tornillosFaltantes", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* CARCASA */}
              <Section title="Carcasa / Teclado / Touchpad">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Carcasa estado</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.carcasaEstado ?? ""}
                      onChange={(e) => updateField("carcasaEstado", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Carcasa observaciones</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.carcasaObservaciones ?? ""}
                      onChange={(e) => updateField("carcasaObservaciones", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Teclado estado</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.tecladoEstado ?? ""}
                      onChange={(e) => updateField("tecladoEstado", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Teclas dañadas</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.tecladoTeclasDanadas)}
                      onChange={(e) => updateField("tecladoTeclasDanadas", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Retroiluminación</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.tecladoRetroiluminacion)}
                      onChange={(e) => updateField("tecladoRetroiluminacion", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Touchpad funciona</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.touchpadFunciona)}
                      onChange={(e) => updateField("touchpadFunciona", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* PANTALLA */}
              <Section title="Pantalla / Cámara">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Monitor nombre</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.monitorNombre ?? ""}
                      onChange={(e) => updateField("monitorNombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Rayones</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.pantallaRayones)}
                      onChange={(e) => updateField("pantallaRayones", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Pixeles muertos</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.pantallaPixelesMuertos)}
                      onChange={(e) => updateField("pantallaPixelesMuertos", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Pantalla táctil</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.pantallaTactil)}
                      onChange={(e) => updateField("pantallaTactil", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cámara funciona</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.camaraFunciona)}
                      onChange={(e) => updateField("camaraFunciona", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600">Observaciones pantalla</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.pantallaObservaciones ?? ""}
                      onChange={(e) => updateField("pantallaObservaciones", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* PUERTOS */}
              <Section title="Puertos">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(
                    [
                      ["puertoUsb", "USB"],
                      ["puertoVga", "VGA"],
                      ["puertoEthernet", "Ethernet"],
                      ["puertoHdmi", "HDMI"],
                      ["puertoEntradaAudio", "Entrada audio"],
                      ["puertoSalidaAudio", "Salida audio"],
                      ["puertoMicroSd", "MicroSD"],
                      ["puertoDvd", "DVD"],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className="text-[11px] font-semibold text-slate-600">{label}</label>
                      <select
                        className="border rounded-md px-2 h-8 w-full text-[11px]"
                        value={fmtBoolSelect(detalleForm[field] as boolean | null)}
                        onChange={(e) => updateField(field, parseBoolInput(e.target.value) as any)}
                      >
                        <option value="">-</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  ))}
                  <div className="md:col-span-4">
                    <label className="text-[11px] font-semibold text-slate-600">Observaciones puertos</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.puertosObservaciones ?? ""}
                      onChange={(e) => updateField("puertosObservaciones", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* BATERÍA */}
              <Section title="Batería / Cargador">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Batería código</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.bateriaCodigo ?? ""}
                      onChange={(e) => updateField("bateriaCodigo", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Batería observaciones</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.bateriaObservaciones ?? ""}
                      onChange={(e) => updateField("bateriaObservaciones", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cargador código</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.cargadorCodigo ?? ""}
                      onChange={(e) => updateField("cargadorCodigo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cargador estado cable</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.cargadorEstadoCable ?? ""}
                      onChange={(e) => updateField("cargadorEstadoCable", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cargador voltajes</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.cargadorVoltajes ?? ""}
                      onChange={(e) => updateField("cargadorVoltajes", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* SOFTWARE / LICENCIAS */}
              <Section title="Software / Licencias">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SO tipo</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.soTipo ?? ""}
                      onChange={(e) => updateField("soTipo", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SO versión</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.soVersion ?? ""}
                      onChange={(e) => updateField("soVersion", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SO licencia activa</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.soLicenciaActiva)}
                      onChange={(e) => updateField("soLicenciaActiva", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Antivirus marca</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.antivirusMarca ?? ""}
                      onChange={(e) => updateField("antivirusMarca", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Antivirus licencia activa</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.antivirusLicenciaActiva)}
                      onChange={(e) =>
                        updateField("antivirusLicenciaActiva", parseBoolInput(e.target.value))
                      }
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Office versión</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.officeVersion ?? ""}
                      onChange={(e) => updateField("officeVersion", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Office licencia activa</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.officeLicenciaActiva)}
                      onChange={(e) => updateField("officeLicenciaActiva", parseBoolInput(e.target.value))}
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* INFORMACIÓN / RESPALDO */}
              <Section title="Información / Respaldo">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cantidad información</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.informacionCantidad ?? ""}
                      onChange={(e) => updateField("informacionCantidad", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Requiere respaldo</label>
                    <select
                      className="border rounded-md px-2 h-8 w-full text-[11px]"
                      value={fmtBoolSelect(detalleForm.informacionRequiereRespaldo)}
                      onChange={(e) =>
                        updateField("informacionRequiereRespaldo", parseBoolInput(e.target.value))
                      }
                    >
                      <option value="">-</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600">Otros programas</label>
                    <Input
                      className="h-8 text-xs"
                      value={detalleForm.informacionOtrosProgramas ?? ""}
                      onChange={(e) => updateField("informacionOtrosProgramas", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* TRABAJO REALIZADO */}
              <Section title="Trabajo realizado">
                <textarea
                  className="w-full border rounded-md px-2 py-1 text-xs min-h-[90px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  value={detalleForm.trabajoRealizado ?? ""}
                  onChange={(e) => updateField("trabajoRealizado", e.target.value)}
                  placeholder="Describe las acciones realizadas, repuestos cambiados, diagnósticos finales, etc."
                />
              </Section>
            </form>
          )}
        </div>

        {/* Footer */}
        {detalleForm && !loading && !error && (
          <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">Los cambios se guardarán en la ficha #{detalleForm.id ?? "(Nueva)"}</p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-9 border-slate-300 text-[11px] text-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={guardando}
                  onClick={guardarFichaCompleta}
                  className="flex h-9 items-center gap-2 bg-slate-900 text-[11px] text-slate-50 hover:bg-slate-800"
                >
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Guardar ficha
                </Button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}