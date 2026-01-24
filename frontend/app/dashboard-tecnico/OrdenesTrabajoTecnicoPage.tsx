"use client";

import React, { useEffect, useState, useCallback, ChangeEvent, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Signature,
    MessageCircle,
    X,
    Loader2,
    CalendarDays,
    Upload,
    FileText,
    Plus,
    User,
    History,
    Search,
    Check,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown, // Nuevo icono
    PenTool // Icono para firma
} from "lucide-react";

import ModalNotificacion from "../components/ModalNotificacion";
import SecureImage from "../components/SecureImage";
import FichaTecnicaEditorModal from "@/app/dashboard/components/FichaTecnicaEditorModal";
import CostosPanel from "../dashboard-tecnico/costos/CostosPanel";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from "../lib/api";
import { CrearFichaTecnicaModal } from "@/app/dashboard/components/CrearFichaTecnicaModal";

const FICHAS_API_BASE = `${API_BASE_URL}/api/fichas`;
const API_BASE = `${API_BASE_URL}/api/ordenes`;
const OTP_API_BASE = `${API_BASE_URL}/api/otp`;
const buildUrl = (p: string = "") => `${API_BASE}${p}`;

// --- CONSTANTES ---
const ITEMS_PER_PAGE = 6;

/* =========================
   DTOs / Interfaces base
========================= */

interface Rol {
    idRol: number;
    nombre: string;
}

interface Usuario {
    cedula: string;
    nombre: string;
    rol?: Rol;
}

interface ImagenDTO {
    id: number;
    ruta: string;
    categoria: string;
    descripcion: string | null;
    fechaSubida: string;
}

interface OrdenTrabajoListaDTO {
    id: number;
    numeroOrden: string;
    estado: string | null;
    tipoServicio: string | null;
    prioridad: string | null;
    fechaHoraIngreso: string;
    fechaHoraEntrega?: string | null;
    medioContacto?: string | null;
    modalidad?: string | null;
    clienteCedula?: string | null;
    clienteNombre?: string | null;
    tecnicoCedula?: string | null;
    tecnicoNombre?: string | null;
    equipoId: number;
    equipoModelo?: string | null;
    equipoHostname?: string | null;
    problemaReportado?: string | null;
    observacionesIngreso?: string | null;
}

interface OrdenTrabajoDetalleDTO extends OrdenTrabajoListaDTO {
    ordenId: number;
    clienteCorreo?: string | null;
    diagnosticoTrabajo?: string | null;
    observacionesRecomendaciones?: string | null;
    imagenes?: ImagenDTO[];
    costoManoObra?: number | null;
    costoRepuestos?: number | null;
    costoOtros?: number | null;
    descuento?: number | null;
    subtotal?: number | null;
    iva?: number | null;
    total?: number | null;
    fechaHoraInicioDiagnostico?: string | null;
    fechaHoraFinDiagnostico?: string | null;
    fechaHoraInicioReparacion?: string | null;
    fechaHoraFinReparacion?: string | null;
    esEnGarantia?: boolean | null;
    referenciaOrdenGarantia?: number | null;
    motivoCierre?: string | null;
    cerradaPor?: string | null;
    otpCodigo?: string | null;
    otpValidado?: boolean | null;
    otpFechaValidacion?: string | null;
}

interface CrearOrdenPayload {
    clienteCedula: string;
    tecnicoCedula: string;
    equipoId: number;
    medioContacto: string;
    contrasenaEquipo: string;
    accesorios: string;
    problemaReportado: string;
    observacionesIngreso: string;
    tipoServicio: string;
    prioridad: string;
}

interface CrearOrdenFormState {
    clienteCedula: string;
    tecnicoCedula: string;
    equipoId: string;
    medioContacto: string;
    contrasenaEquipo: string;
    accesorios: string;
    problemaReportado: string;
    observacionesIngreso: string;
    tipoServicio: string;
    prioridad: string;
}

/* =========================
   Fichas (Historial)
========================= */

interface FichaTecnicaResumenDTO {
    id: number;
    fechaCreacion: string;
    equipoModelo?: string | null;
    tecnicoNombre?: string | null;
    observaciones?: string | null;
}

interface FichaTecnicaDetalleDTO {
    id: number;
    fechaCreacion?: string;
    equipoId?: number;
    equipoModelo?: string | null;
    equipoHostname?: string | null;
    tecnicoCedula?: string | null;
    tecnicoNombre?: string | null;
    observaciones?: string | null;
    hardwareJson?: any;
    [key: string]: any;
}

interface FichaTecnicaAnexaDTO {
    id: number;
    fechaCreacion: string;
    tecnicoNombre?: string | null;
    observaciones?: string | null;
}

/* =========================
   COMPONENTE: EquipoSelector
========================= */

interface EquipoBasicDTO {
    idEquipo: number;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    tipo: string | null;
}

interface EquipoSelectorProps {
    value: number | string;
    onChange: (id: number) => void;
}

const EquipoSelector = ({ value, onChange }: EquipoSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [equipos, setEquipos] = useState<EquipoBasicDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchEquipos = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/equipos`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setEquipos(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error("Error al cargar equipos", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipos();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredEquipos = equipos.filter((eq) => {
        const term = searchTerm.toLowerCase();
        const textoCompleto = `${eq.marca} ${eq.modelo} ${eq.numeroSerie} ${eq.idEquipo}`.toLowerCase();
        return textoCompleto.includes(term);
    });

    const selectedEquipo = equipos.find((eq) => eq.idEquipo === Number(value));

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => {
                    setOpen(!open);
                    if (!open) setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer hover:bg-slate-50 border-slate-300`}
            >
                <span className="truncate text-slate-700">
                    {selectedEquipo ? (
                        <span className="flex items-center gap-2">
                            <span className="font-semibold">{selectedEquipo.marca} {selectedEquipo.modelo}</span>
                            <span className="text-slate-400 text-xs">| S/N: {selectedEquipo.numeroSerie}</span>
                        </span>
                    ) : (
                        <span className="text-slate-400 text-xs">Seleccionar equipo...</span>
                    )}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 opacity-50" />
                        <input
                            ref={inputRef}
                            className="flex h-5 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-slate-400"
                            placeholder="Buscar por serie, modelo o marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {loading ? (
                            <div className="py-6 text-center text-sm text-slate-500 flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                            </div>
                        ) : filteredEquipos.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-500">No se encontraron equipos.</div>
                        ) : (
                            filteredEquipos.map((eq) => (
                                <div
                                    key={eq.idEquipo}
                                    className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 cursor-pointer ${Number(value) === eq.idEquipo ? "bg-slate-100 text-slate-900" : "text-slate-700"
                                        }`}
                                    onClick={() => {
                                        onChange(eq.idEquipo);
                                        setOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    <div className="flex flex-col w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-medium">{eq.marca} {eq.modelo}</span>
                                            {Number(value) === eq.idEquipo && <Check className="h-3 w-3 text-blue-600" />}
                                        </div>
                                        <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                            <span>S/N: {eq.numeroSerie ?? "N/A"}</span>
                                            <span>ID: {eq.idEquipo}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ===== COMPONENTE: LISTA DE FICHAS POR CLIENTE ===== */
const ListaFichasPorCliente: React.FC<{
    clienteCedula: string;
    onSelectFicha: (id: number) => void;
}> = ({ clienteCedula, onSelectFicha }) => {
    const [fichas, setFichas] = useState<FichaTecnicaResumenDTO[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!clienteCedula?.trim()) {
            setFichas([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const run = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setFichas([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const res = await fetch(`${FICHAS_API_BASE}/cliente/${clienteCedula}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (res.status === 204 || res.status === 404) {
                    setFichas([]);
                    return;
                }

                if (!res.ok) throw new Error(`Error al cargar el historial (HTTP ${res.status})`);

                const data: unknown = await res.json();

                const lista: FichaTecnicaResumenDTO[] = Array.isArray(data)
                    ? (data as FichaTecnicaResumenDTO[])
                    : data
                        ? ([data] as FichaTecnicaResumenDTO[])
                        : [];

                const ordenada = (typeof (lista as any).toSorted === "function"
                    ? (lista as any).toSorted(
                        (a: FichaTecnicaResumenDTO, b: FichaTecnicaResumenDTO) =>
                            new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
                    )
                    : lista
                        .slice()
                        .sort(
                            (a, b) =>
                                new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
                        )) as FichaTecnicaResumenDTO[];

                setFichas(ordenada);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error(err);
                setFichas([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        run();

        return () => controller.abort();
    }, [clienteCedula]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500">Cargando historial del cliente...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">Historial Técnico del Cliente</h3>
                <p className="text-xs text-slate-500">
                    Cédula: {clienteCedula} • Fichas encontradas: {fichas.length}
                </p>
            </div>

            {fichas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                    <FileText className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-900">Sin historial previo</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        Este cliente no tiene fichas técnicas registradas anteriormente.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {fichas.map((ficha) => (
                        <Card
                            key={ficha.id}
                            className="group cursor-pointer border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col"
                            onClick={() => onSelectFicha(ficha.id)}
                        >
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded border border-slate-200">
                                        ID #{ficha.id}
                                    </div>
                                    <CalendarDays className="h-4 w-4 text-slate-400" />
                                </div>

                                <CardTitle className="text-sm font-bold text-slate-800 mt-2 line-clamp-1">
                                    {ficha.equipoModelo || "Equipo sin modelo"}
                                </CardTitle>

                                <p className="text-[11px] text-slate-500">
                                    {new Date(ficha.fechaCreacion).toLocaleDateString("es-EC", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </CardHeader>

                            <CardContent className="p-4 pt-2 flex-1">
                                <div className="text-xs text-slate-500 space-y-1 h-full">
                                    <p className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {ficha.tecnicoNombre || "Técnico..."}
                                    </p>

                                    {ficha.observaciones && (
                                        <p className="line-clamp-2 mt-2 italic text-slate-600 border-l-2 border-slate-200 pl-2 text-[11px]">
                                            "{ficha.observaciones}"
                                        </p>
                                    )}
                                </div>
                            </CardContent>

                            <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto">
                                <div className="text-xs font-medium text-indigo-600 group-hover:underline text-center">
                                    Ver detalles →
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

/* =========================
   Modales + Helpers
========================= */

type Paso = 1 | 2 | 3 | 4;

const mapEstadoToPaso = (estado: string | null): Paso => {
    const e = (estado || "").toUpperCase();
    if (e === "INGRESO" || e === "PENDIENTE") return 1;
    if (e === "EN_DIAGNOSTICO") return 2;
    if (e === "COSTOS") return 3;
    if (e === "LISTA_ENTREGA" || e === "CERRADO") return 4;
    return 1;
};

const pasoToEstado = (p: Paso): string => {
    if (p === 1) return "INGRESO";
    if (p === 2) return "EN_DIAGNOSTICO";
    if (p === 3) return "COSTOS";
    return "LISTA_ENTREGA";
};

const estadoBadgeClasses = (estado: string | null) => {
    const e = (estado || "").toUpperCase();
    if (e === "EN_DIAGNOSTICO" || e === "COSTOS")
        return "bg-blue-50 text-blue-700 border border-blue-200";
    if (e === "INGRESO" || e === "PENDIENTE")
        return "bg-amber-50 text-amber-700 border border-amber-200";
    if (e === "CERRADO" || e === "LISTA_ENTREGA")
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
};

const StepPill: React.FC<{ active: boolean; label: string; desc: string }> = ({
    active,
    label,
    desc,
}) => (
    <div
        className={[
            "flex items-center gap-2 rounded-full border px-3 py-1 transition select-none",
            active
                ? "border-white bg-white/20 text-white"
                : "border-white/30 bg-slate-800/40 text-slate-200",
        ].join(" ")}
    >
        <span className="text-[10px] font-semibold">{label}</span>
        <span className="hidden sm:inline text-[10px] opacity-80">{desc}</span>
    </div>
);


function FichaTecnicaDetalleModal({
    open,
    onClose,
    loading,
    error,
    data,
}: {
    open: boolean;
    onClose: () => void;
    loading: boolean;
    error: string | null;
    data: FichaTecnicaDetalleDTO | null;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const safeDate = (iso?: string) => {
        if (!iso) return "-";
        try {
            return new Date(iso).toLocaleString("es-EC");
        } catch {
            return String(iso);
        }
    };

    const fmt = (v: any) => (v === null || v === undefined || v === "" ? "-" : String(v));

    const topEntries =
        data
            ? Object.entries(data)
                .filter(([k]) => !["hardwareJson"].includes(k))
                .filter(([_, v]) => typeof v !== "object" || v === null)
                .slice(0, 20)
            : [];

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative mx-3 w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-700" />
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Detalle de Ficha Técnica</p>
                            <p className="text-[11px] text-slate-500">
                                {data ? `ID #${data.id}` : "—"} •{" "}
                                {data?.fechaCreacion ? safeDate(data.fechaCreacion) : "-"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[82vh] overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            <p className="text-sm text-slate-500">Cargando detalles de la ficha...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {error}
                        </div>
                    ) : !data ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            No hay datos para mostrar.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm">Resumen</CardTitle>
                                    <CardDescription className="text-xs">
                                        Información general de la ficha técnica.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid gap-3 md:grid-cols-3 text-[12px]">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-[11px] font-semibold text-slate-700">Equipo</p>
                                            <p className="mt-1 text-slate-900">
                                                {fmt(data.equipoModelo)}{" "}
                                                {data.equipoHostname ? `(${data.equipoHostname})` : ""}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                EquipoId: {fmt(data.equipoId)}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-[11px] font-semibold text-slate-700">Técnico</p>
                                            <p className="mt-1 text-slate-900">{fmt(data.tecnicoNombre)}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Cédula: {fmt(data.tecnicoCedula)}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-[11px] font-semibold text-slate-700">Fecha</p>
                                            <p className="mt-1 text-slate-900">{safeDate(data.fechaCreacion)}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">ID: #{data.id}</p>
                                        </div>
                                    </div>

                                    {data.observaciones && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                                            <p className="text-[11px] font-semibold text-slate-700">Observaciones</p>
                                            <p className="mt-1 whitespace-pre-wrap text-[12px] text-slate-800">
                                                {data.observaciones}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {topEntries.length > 0 && (
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Campos</CardTitle>
                                        <CardDescription className="text-xs">
                                            Valores principales detectados (top-level).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {topEntries.map(([k, v]) => (
                                                <div
                                                    key={k}
                                                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                                >
                                                    <div className="text-[11px] font-semibold text-slate-700">{k}</div>
                                                    <div className="text-[11px] text-slate-900 text-right break-all">{fmt(v)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {typeof data.hardwareJson !== "undefined" && (
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Hardware JSON</CardTitle>
                                        <CardDescription className="text-xs">
                                            Información técnica (puede ser extensa).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-[11px] text-slate-100">
                                            {JSON.stringify(data.hardwareJson, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================
   Página Principal
========================= */

export default function OrdenesTrabajoPage() {
    const router = useRouter();

    const [showNotifModal, setShowNotifModal] = useState(false);
    const [notifOtId, setNotifOtId] = useState<number | null>(null);

    const [ordenes, setOrdenes] = useState<OrdenTrabajoListaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [detalle, setDetalle] = useState<OrdenTrabajoDetalleDTO | null>(null);
    const [imagenesDetalle, setImagenesDetalle] = useState<ImagenDTO[]>([]);

    const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
    const [categoriaImg, setCategoriaImg] = useState<string>("INGRESO");

    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const [imgFilterCategoria, setImgFilterCategoria] = useState<string>("");

    // === PASOS ===
    const [pasoActivo, setPasoActivo] = useState<Paso>(1);

    // === EDITABLES ===
    const [tipoServicioEdit, setTipoServicioEdit] = useState<string>("DIAGNOSTICO");
    const [prioridadEdit, setPrioridadEdit] = useState<string>("MEDIA");
    const [estadoEdit, setEstadoEdit] = useState<string>("INGRESO");

    const [diagEdit, setDiagEdit] = useState<string>("");
    const [obsRecEdit, setObsRecEdit] = useState<string>("");

    const [costoManoObra, setCostoManoObra] = useState<number>(0);
    const [costoRepuestos, setCostoRepuestos] = useState<number>(0);
    const [costoOtros, setCostoOtros] = useState<number>(0);
    const [descuento, setDescuento] = useState<number>(0);
    const [iva, setIva] = useState<number>(0);

    const [esEnGarantia, setEsEnGarantia] = useState<boolean>(false);
    const [referenciaGarantia, setReferenciaGarantia] = useState<string>("");
    const [motivoCierre, setMotivoCierre] = useState<string>("");
    const [cerradaPor, setCerradaPor] = useState<string>("");

    const [otpCodigo, setOtpCodigo] = useState<string>("");
    const [otpValidado, setOtpValidado] = useState<boolean>(false);
    const [otpEnviando, setOtpEnviando] = useState<boolean>(false);
    const [otpVerificando, setOtpVerificando] = useState<boolean>(false);
    const [otpMensaje, setOtpMensaje] = useState<string | null>(null);

    const [guardando, setGuardando] = useState(false);

    // === PAGINACIÓN ===
    const [currentPage, setCurrentPage] = useState(1);

    // === CREAR OT ===
    const [showCrear, setShowCrear] = useState(false);
    const [listaClientes, setListaClientes] = useState<Usuario[]>([]);
    const [listaTecnicos, setListaTecnicos] = useState<Usuario[]>([]);

    const [crearLoading, setCrearLoading] = useState(false);
    const [formCrear, setFormCrear] = useState<CrearOrdenFormState>({
        clienteCedula: "",
        tecnicoCedula: "",
        equipoId: "",
        medioContacto: "",
        contrasenaEquipo: "",
        accesorios: "",
        problemaReportado: "",
        observacionesIngreso: "",
        tipoServicio: "DIAGNOSTICO",
        prioridad: "MEDIA",
    });

    // ✅ Nuevo estado para almacenar los nombres obtenidos de la API
    const [nombresAutocompletados, setNombresAutocompletados] = useState({
        cliente: "",
        tecnico: ""
    });

    // === MODAL HISTORIAL FICHAS ===
    const [showHistorialFichas, setShowHistorialFichas] = useState(false);
    const [historialCedula, setHistorialCedula] = useState<string>("");
    const [historialOtId, setHistorialOtId] = useState<number | null>(null);
    const [historialEquipoId, setHistorialEquipoId] = useState<number | null>(null);

    // === MODAL DETALLE FICHA ===
    const [showFichaDetalle, setShowFichaDetalle] = useState(false);
    const [fichaLoading, setFichaLoading] = useState(false);
    const [fichaError, setFichaError] = useState<string | null>(null);
    const [fichaDetalle, setFichaDetalle] = useState<FichaTecnicaDetalleDTO | null>(null);

    const [fichaDetalleId, setFichaDetalleId] = useState<number | null>(null);

    // ✅ FICHAS TÉCNICAS ANEXAS (por OT)
    const [fichasAnexas, setFichasAnexas] = useState<FichaTecnicaAnexaDTO[]>([]);
    const [fichasAnexasLoading, setFichasAnexasLoading] = useState(false);
    const [fichasAnexasError, setFichasAnexasError] = useState<string | null>(null);

    // ✅ Editor modal (formulario grande)
    const [showFichaEditor, setShowFichaEditor] = useState(false);
    const [editorFichaId, setEditorFichaId] = useState<number | null>(null);

    // ✅ NUEVO: Estado para el modal de crear ficha
    const [showCrearFichaTecnica, setShowCrearFichaTecnica] = useState(false);

    // ✅ NUEVO: Estado para el modal de firma de conformidad
    const [showModalFirmaConformidad, setShowModalFirmaConformidad] = useState(false);
    const [modoFirma, setModoFirma] = useState<"conformidad" | "aceptacion">("conformidad");
    const [firmaCanvasRef, setFirmaCanvasRef] = useState<HTMLCanvasElement | null>(null);
    const [isDrawingFirma, setIsDrawingFirma] = useState(false);
    const [conformidadFirmada, setConformidadFirmada] = useState(false);
    const [reciboFirmado, setReciboFirmado] = useState(false);

    // === BUSCADOR Y FILTROS ===
    const [searchTerm, setSearchTerm] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");

    // ✅ NUEVO: Estado para el ordenamiento (Defecto: 'desc' para ver las más recientes primero)
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fmt = (v: unknown) => (v === null || v === undefined || v === "" ? "-" : String(v));

    const fmtFecha = (iso?: string | null) => {
        if (!iso) return "-";
        return new Date(iso).toLocaleString();
    };

    const fmtMoney = (n?: number | null) => {
        if (n === null || n === undefined) return "-";
        return Number(n).toFixed(2);
    };

    const toNumber = (value: string): number =>
        value.trim() === "" || isNaN(Number(value)) ? 0 : Number(value);

    const subtotalCalculado = useMemo(
        () => costoManoObra + costoRepuestos + costoOtros - descuento,
        [costoManoObra, costoRepuestos, costoOtros, descuento]
    );
    const totalCalculado = useMemo(() => subtotalCalculado + iva, [subtotalCalculado, iva]);

    /* =========================
       LOGICA DE FILTRADO
    ========================= */
    const normalizeText = (text: string | null | undefined) => {
        if (!text) return "";
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    const ordenesFiltradas = useMemo(() => {
        const term = normalizeText(searchTerm);

        // 1. Filtrar primero
        const filtradas = ordenes.filter((ot) => {
            const matchesText =
                !term ||
                normalizeText(ot.numeroOrden).includes(term) ||
                normalizeText(ot.equipoModelo).includes(term) ||
                normalizeText(ot.equipoHostname).includes(term) ||
                normalizeText(ot.clienteNombre).includes(term) ||
                normalizeText(ot.clienteCedula).includes(term) ||
                normalizeText(ot.tecnicoNombre).includes(term) ||
                normalizeText(ot.tecnicoCedula).includes(term) ||
                normalizeText(ot.problemaReportado).includes(term);

            let matchDate = true;
            if (dateStart || dateEnd) {
                const d = new Date(ot.fechaHoraIngreso);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const otYMD = `${year}-${month}-${day}`;

                if (dateStart && otYMD < dateStart) matchDate = false;
                if (dateEnd && otYMD > dateEnd) matchDate = false;
            }

            return matchesText && matchDate;
        });

        // 2. Ordenar después (✅ NUEVA LÓGICA DE ORDENAMIENTO)
        return filtradas.sort((a, b) => {
            const dateA = new Date(a.fechaHoraIngreso).getTime();
            const dateB = new Date(b.fechaHoraIngreso).getTime();

            if (sortOrder === "asc") {
                return dateA - dateB; // Más antiguas primero
            } else {
                return dateB - dateA; // Más recientes primero (descendente)
            }
        });

    }, [ordenes, searchTerm, dateStart, dateEnd, sortOrder]);

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateStart, dateEnd]);

    // Calcular datos de la página actual
    const totalPages = Math.ceil(ordenesFiltradas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentOrdenes = ordenesFiltradas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    /* ===== GET lista ===== */
    const fetchOrdenes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(buildUrl(""), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Error al cargar órdenes de trabajo (HTTP ${res.status})`);
            const data: OrdenTrabajoListaDTO[] = await res.json();
            setOrdenes(data);
        } catch (e: any) {
            setError(e.message ?? "Error al cargar órdenes de trabajo");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchCombos = useCallback(async () => {
        if (!token) return;
        try {
            const resUsers = await fetch(`${API_BASE_URL}/api/usuarios`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const usuarios: Usuario[] = await resUsers.json();
            setListaClientes(usuarios.filter((u) => u.rol?.nombre === "ROLE_CLIENTE"));
            setListaTecnicos(usuarios.filter((u) => u.rol?.nombre === "ROLE_TECNICO"));
        } catch (err) {
            console.error("Error cargando combos:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchOrdenes();
        fetchCombos();
    }, [fetchOrdenes, fetchCombos]);

    // Helpers para mostrar nombre en inputs readonly
    const getNombreCliente = (cedula: string) => listaClientes.find(c => c.cedula === cedula)?.nombre || cedula || "";
    const getNombreTecnico = (cedula: string) => listaTecnicos.find(t => t.cedula === cedula)?.nombre || cedula || "";

    // ✅ LÓGICA AUTOCOMPLETAR AL SELECCIONAR EQUIPO
    const handleEquipoSeleccionado = async (id: number) => {
        setFormCrear(prev => ({ ...prev, equipoId: String(id) }));

        if (!token) return;

        try {
            // 1. Buscamos los detalles completos del equipo
            const res = await fetch(`${API_BASE_URL}/api/equipos/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const equipoData = await res.json();

                // Extraer datos del equipo
                const clienteCed = equipoData.cliente?.cedula || equipoData.cedulaCliente || "";
                const tecnicoCed = equipoData.tecnico?.cedula || equipoData.tecnicoCedula || "";
                const tecnicoNom = equipoData.tecnico?.nombre || equipoData.tecnicoNombre || "";

                // 2. Buscar el nombre real del cliente usando la cédula
                let clienteNom = "";
                if (clienteCed) {
                    try {
                        const resUsuario = await fetch(`${API_BASE_URL}/api/usuarios/${clienteCed}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (resUsuario.ok) {
                            const usuarioData = await resUsuario.json();
                            clienteNom = usuarioData.nombre || "";
                        }
                    } catch (err) {
                        console.error("Error buscando nombre de cliente:", err);
                    }
                }

                // 3. Actualizar el formulario (datos que se envían)
                setFormCrear(prev => ({
                    ...prev,
                    clienteCedula: clienteCed,
                    tecnicoCedula: tecnicoCed
                }));

                // 4. Actualizar nombres visuales
                setNombresAutocompletados({
                    cliente: clienteNom,
                    tecnico: tecnicoNom
                });
            }
        } catch (error) {
            console.error("Error al obtener datos del equipo:", error);
        }
    };


    /* ===== GET imágenes ===== */
    const fetchImagenes = useCallback(
        async (ordenId: number) => {
            try {
                const res = await fetch(buildUrl(`/${ordenId}/imagenes`), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 204) {
                    setImagenesDetalle([]);
                    return;
                }

                if (!res.ok) throw new Error(`Error al cargar imágenes (HTTP ${res.status})`);
                const data: ImagenDTO[] = await res.json();
                setImagenesDetalle(data);
            } catch (e) {
                console.error(e);
                setImagenesDetalle([]);
            }
        },
        [token]
    );

    /* ===== sync editable con detalle ===== */
    const sincronizarDetalleEditable = (data: OrdenTrabajoDetalleDTO) => {
        setTipoServicioEdit(data.tipoServicio ?? "DIAGNOSTICO");
        setPrioridadEdit(data.prioridad ?? "MEDIA");

        const p = mapEstadoToPaso(data.estado ?? "INGRESO");
        setPasoActivo(p);
        setEstadoEdit(pasoToEstado(p));

        setDiagEdit(data.diagnosticoTrabajo ?? "");
        setObsRecEdit(data.observacionesRecomendaciones ?? "");

        setCostoManoObra(data.costoManoObra ?? 0);
        setCostoRepuestos(data.costoRepuestos ?? 0);
        setCostoOtros(data.costoOtros ?? 0);
        setDescuento(data.descuento ?? 0);
        setIva(data.iva ?? 0);

        setEsEnGarantia(!!data.esEnGarantia);
        setReferenciaGarantia(
            data.referenciaOrdenGarantia != null ? String(data.referenciaOrdenGarantia) : ""
        );
        setMotivoCierre(data.motivoCierre ?? "");
        setCerradaPor(data.cerradaPor ?? "");

        setOtpCodigo(data.otpCodigo ?? "");
        setOtpValidado(!!data.otpValidado);
        setOtpMensaje(null);
        setOtpEnviando(false);
        setOtpVerificando(false);
    };

    const closeDetalle = useCallback(() => {
        setDetalle(null);
        setImagenesDetalle([]);
        setSelectedImg(null);
        setImgFilterCategoria("");
    }, []);

    useEffect(() => {
        if (!detalle) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDetalle();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [detalle, closeDetalle]);

    /* ===== GET detalle ===== */
    const abrirDetalle = async (id: number) => {
        try {
            setError(null);
            const res = await fetch(buildUrl(`/${id}/detalle`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Error al cargar detalles (HTTP ${res.status})`);
            const data: OrdenTrabajoDetalleDTO = await res.json();

            setDetalle(data);
            setImagenesNuevas([]);
            setSelectedImg(null);
            setImgFilterCategoria("");

            // Verificar estado de firmas
            verificarEstadoFirmas(data.numeroOrden);

            sincronizarDetalleEditable(data);
            await fetchImagenes(id);
            await fetchFichasAnexasPorOT(id, data.equipoId);
        } catch (e: any) {
            setError(e.message ?? "Error al cargar detalles de la orden");
        }
    };

    /* ===== Navegación pasos ===== */
    const irSiguientePaso = () =>
        setPasoActivo((prev) => {
            const next = prev < 4 ? ((prev + 1) as Paso) : prev;
            setEstadoEdit(pasoToEstado(next));
            return next;
        });

    const irPasoAnterior = () =>
        setPasoActivo((prev) => {
            const next = prev > 1 ? ((prev - 1) as Paso) : prev;
            setEstadoEdit(pasoToEstado(next));
            return next;
        });

    /* ===== PUT guardar ===== */
    const guardarCambiosOrden = async (esCierre: boolean = false) => {
        if (!detalle) return;
        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        const estadoFlujo = pasoToEstado(pasoActivo);

        const payload = {
            tipoServicio: tipoServicioEdit,
            prioridad: prioridadEdit,
            estado: esCierre ? "CERRADO" : estadoFlujo,

            diagnosticoTrabajo: diagEdit.trim(),
            observacionesRecomendaciones: obsRecEdit.trim(),

            costoManoObra,
            costoRepuestos,
            costoOtros,
            descuento,
            subtotal: subtotalCalculado,
            iva,
            total: totalCalculado,

            esEnGarantia,
            referenciaOrdenGarantia: referenciaGarantia ? Number(referenciaGarantia) : null,

            motivoCierre: motivoCierre.trim() || null,
            cerradaPor: cerradaPor.trim() || null,

            otpCodigo: otpCodigo.trim() || null,
            otpValidado,

            cerrarOrden: esCierre,
        };

        try {
            setGuardando(true);
            const res = await fetch(buildUrl(`/${detalle.ordenId}/entrega`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Error guardando (HTTP ${res.status})`);

            alert(esCierre ? "✅ Orden cerrada correctamente" : "✅ Cambios guardados");
            await abrirDetalle(detalle.ordenId);
            await fetchOrdenes();
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "Error guardando datos de la orden");
        } finally {
            setGuardando(false);
        }
    };

    const cerrarOrden = async () => {
        if (!detalle) return;

        if (pasoActivo !== 4) {
            alert("Solo puedes cerrar la orden en el Paso 4. Se guardará como borrador.");
            await guardarCambiosOrden(false);
            return;
        }

        if (!diagEdit.trim()) {
            alert("Debes registrar un diagnóstico antes de cerrar la orden.");
            return;
        }

        if (totalCalculado <= 0 && !esEnGarantia) {
            const seguir = window.confirm(
                "El total es 0 y la orden no está marcada como garantía. ¿Cerrar igualmente?"
            );
            if (!seguir) return;
        }

        if (!motivoCierre.trim()) {
            alert("Debes indicar un motivo de cierre.");
            return;
        }

        if (!otpValidado) {
            const seguir = window.confirm("La OTP no está validada. ¿Cerrar de todas formas?");
            if (!seguir) return;
        }

        await guardarCambiosOrden(true);
    };

    /* ===== OTP ===== */
    const handleEnviarOtp = async () => {
        if (!detalle) return;

        const cedula = detalle.clienteCedula;
        const correo = detalle.clienteCorreo;

        if (!cedula || !correo) {
            setOtpMensaje("No se encontró la cédula o el correo del cliente para enviar el OTP.");
            return;
        }
        if (!token) {
            setOtpMensaje("Sesión inválida. Inicia sesión nuevamente.");
            return;
        }

        setOtpMensaje(null);
        setOtpEnviando(true);

        try {
            const response = await fetch(`${OTP_API_BASE}/generar`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ cedula: Number(cedula), correo }),
            });

            if (!response.ok) throw new Error("No se pudo enviar el OTP.");
            setOtpMensaje("OTP enviado al correo del cliente.");
        } catch (err: any) {
            console.error("Error al enviar OTP:", err);
            setOtpMensaje(err?.message || "Error al enviar OTP.");
        } finally {
            setOtpEnviando(false);
        }
    };

    const handleValidarOtp = async () => {
        if (!detalle) return;
        const cedula = detalle.clienteCedula;

        if (!cedula) {
            setOtpMensaje("No se encontró la cédula del cliente.");
            return;
        }
        if (!otpCodigo) {
            setOtpMensaje("Ingrese el código OTP enviado al cliente.");
            return;
        }
        if (!token) {
            setOtpMensaje("Sesión inválida. Inicia sesión nuevamente.");
            return;
        }

        setOtpMensaje(null);
        setOtpVerificando(true);

        try {
            const response = await fetch(`${OTP_API_BASE}/validar`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ cedula: Number(cedula), codigo: otpCodigo }),
            });

            if (!response.ok) throw new Error("OTP inválido o expirado.");

            setOtpValidado(true);
            setOtpMensaje("OTP validado correctamente.");
        } catch (err: any) {
            console.error("Error al validar OTP:", err);
            setOtpValidado(false);
            setOtpMensaje(err?.message || "Error al validar OTP.");
        } finally {
            setOtpVerificando(false);
        }
    };

    /* ===== Subir imágenes ===== */
    const subirImagenes = async () => {
        if (!detalle) return;
        if (imagenesNuevas.length === 0) {
            alert("Selecciona al menos una imagen");
            return;
        }
        try {
            const formData = new FormData();
            imagenesNuevas.forEach((f) => formData.append("files", f));
            formData.append("categoria", categoriaImg);

            const res = await fetch(buildUrl(`/${detalle.ordenId}/imagenes`), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error(`Error ${res.status} subiendo imágenes`);
            alert("📸 Imágenes subidas correctamente");
            setImagenesNuevas([]);
            await fetchImagenes(detalle.ordenId);
        } catch (e: any) {
            alert("❌ " + (e.message ?? "Error subiendo imágenes"));
        }
    };

    const irAAprobacionProcedimiento = (ordenId: number) => {
        router.push(`/firma?ordenId=${ordenId}&modo=aceptacion`);
    };

    /* ===== Verificar estado de firmas ===== */
    const verificarEstadoFirmas = async (numeroOrden: string | null | undefined) => {
        if (!numeroOrden || !token) {
            setConformidadFirmada(false);
            setReciboFirmado(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/firmas/estado/${numeroOrden}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setConformidadFirmada(data.conformidadFirmada || false);
                setReciboFirmado(data.reciboFirmado || false);
            } else {
                setConformidadFirmada(false);
                setReciboFirmado(false);
            }
        } catch {
            setConformidadFirmada(false);
            setReciboFirmado(false);
        }
    };

    /* ===== Firma de Conformidad Modal ===== */
    const iniciarFirmaConformidad = (modo: "conformidad" | "aceptacion" = "conformidad") => {
        setModoFirma(modo);
        setShowModalFirmaConformidad(true);
        setIsDrawingFirma(false);
        
        // Inicializar canvas cuando se abre
        setTimeout(() => {
            if (firmaCanvasRef) {
                const ctx = firmaCanvasRef.getContext("2d");
                if (ctx) {
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.strokeStyle = "#000";
                }
            }
        }, 0);
    };

    const limpiarFirmaConformidad = () => {
        if (firmaCanvasRef) {
            const ctx = firmaCanvasRef.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, firmaCanvasRef.width, firmaCanvasRef.height);
        }
    };

    const guardarFirmaConformidad = async () => {
        if (!detalle || !firmaCanvasRef) return;

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            return;
        }

        const firmaBase64 = firmaCanvasRef.toDataURL("image/png");

        const payload = {
            ordenId: Number(detalle?.ordenId) || 0,
            numeroOrden: String(detalle?.numeroOrden || ""),
            cliente: String(detalle?.clienteNombre || ""),
            equipo: String(detalle?.equipoModelo || ""),
            procedimiento: String(diagEdit || ""),
            modo: String(modoFirma || ""),
            firma: firmaBase64,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/firmas/conformidad`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Error al guardar firma (HTTP ${res.status})`);

            alert("✅ Firma guardada correctamente");
            setShowModalFirmaConformidad(false);
            limpiarFirmaConformidad();
            // Actualizar estado de firmas
            if (modoFirma === "conformidad") {
                setConformidadFirmada(true);
            } else {
                setReciboFirmado(true);
            }
        } catch (err: any) {
            console.error(err);
            alert("❌ " + (err?.message ?? "Error al guardar firma"));
        }
    };

    const startDrawingFirma = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!firmaCanvasRef) return;
        const ctx = firmaCanvasRef.getContext("2d");
        if (!ctx) return;

        setIsDrawingFirma(true);
        const rect = firmaCanvasRef.getBoundingClientRect();

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const drawFirma = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingFirma || !firmaCanvasRef) return;

        const ctx = firmaCanvasRef.getContext("2d");
        if (!ctx) return;

        const rect = firmaCanvasRef.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawingFirma = () => setIsDrawingFirma(false);

    /* =========================================================
       FICHAS TÉCNICAS EN MODAL
    ========================================================= */

    const closeFichaDetalle = () => {
        setShowFichaDetalle(false);
        setFichaLoading(false);
        setFichaError(null);
        setFichaDetalle(null);
        setFichaDetalleId(null);
    };

    const tryFetchJson = async (urls: string[], tokenStr: string) => {
        let lastStatus: number | null = null;
        let lastErr: any = null;

        for (const url of urls) {
            try {
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${tokenStr}` },
                });

                lastStatus = res.status;

                if (res.status === 204) return null;
                if (res.status === 404) continue;

                if (!res.ok) {
                    lastErr = new Error(`HTTP ${res.status} (${url})`);
                    continue;
                }

                const data = (await res.json()) as any;
                return data;
            } catch (e) {
                lastErr = e;
                continue;
            }
        }

        if (lastStatus === 404) return { __notFound: true };
        throw lastErr ?? new Error("No se pudo obtener respuesta de fichas.");
    };

    const normalizeToFicha = (raw: any): FichaTecnicaDetalleDTO | null => {
        if (!raw) return null;
        if (Array.isArray(raw)) {
            if (raw.length === 0) return null;
            const sorted = raw.slice().sort((a, b) => {
                const da = new Date(a?.fechaCreacion ?? 0).getTime();
                const db = new Date(b?.fechaCreacion ?? 0).getTime();
                return db - da;
            });
            return sorted[0] as FichaTecnicaDetalleDTO;
        }
        if (raw?.data && (raw.data.id || Array.isArray(raw.data))) return normalizeToFicha(raw.data);
        return raw as FichaTecnicaDetalleDTO;
    };

    const irAFichaTecnica = async (ordenId: number, equipoId: number) => {
        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        setShowFichaDetalle(true);
        setFichaLoading(true);
        setFichaError(null);
        setFichaDetalle(null);

        try {
            if (fichaDetalleId) {
                const raw = await tryFetchJson([`${FICHAS_API_BASE}/${fichaDetalleId}`], token);
                if ((raw as any)?.__notFound) {
                    setFichaError("No se encontró la ficha seleccionada.");
                    return;
                }
                setFichaDetalle(normalizeToFicha(raw));
                return;
            }

            const candidates = [
                `${FICHAS_API_BASE}/orden/${ordenId}/equipo/${equipoId}`,
                `${FICHAS_API_BASE}/ordenTrabajo/${ordenId}/equipo/${equipoId}`,
                `${FICHAS_API_BASE}/orden/${ordenId}?equipoId=${equipoId}`,
                `${FICHAS_API_BASE}?ordenTrabajoId=${ordenId}&equipoId=${equipoId}`,
            ];

            const raw = await tryFetchJson(candidates, token);

            if ((raw as any)?.__notFound) {
                setFichaError("No se encontró ficha para esta OT/equipo (o el endpoint no existe).");
                return;
            }

            const ficha = normalizeToFicha(raw);
            if (!ficha) {
                setFichaError("No existe ficha técnica disponible para este caso.");
                return;
            }

            setFichaDetalle(ficha);
        } catch (e: any) {
            console.error(e);
            setFichaError(e?.message ?? "Error cargando detalle de la ficha técnica.");
        } finally {
            setFichaLoading(false);
        }
    };

    /* =========================================================
       FICHAS TÉCNICAS ANEXAS (POR OT) + EDITOR MODAL
    ========================================================= */

    const normalizeToAnexas = (raw: any): FichaTecnicaAnexaDTO[] => {
        if (!raw) return [];
        const arr: any[] = Array.isArray(raw) ? raw : raw?.data && Array.isArray(raw.data) ? raw.data : [raw];
        return arr
            .filter(Boolean)
            .map((x: any) => ({
                id: Number(x.id),
                fechaCreacion: x.fechaCreacion ?? x.createdAt ?? new Date().toISOString(),
                tecnicoNombre: x.tecnicoNombre ?? x.tecnicoId ?? null,
                observaciones: x.observaciones ?? null,
            }))
            .filter((x) => Number.isFinite(x.id));
    };

    const fetchFichasAnexasPorOT = useCallback(
        async (ordenId: number, _equipoId: number) => {
            if (!token) return;

            setFichasAnexasLoading(true);
            setFichasAnexasError(null);

            try {
                const res = await fetch(`${FICHAS_API_BASE}/orden-trabajo/${ordenId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 204 || res.status === 404) {
                    setFichasAnexas([]);
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Error al cargar fichas (HTTP ${res.status})`);
                }

                const fichasOT = await res.json();

                if (!Array.isArray(fichasOT) || fichasOT.length === 0) {
                    setFichasAnexas([]);
                    return;
                }

                const lista = normalizeToAnexas(fichasOT)
                    .slice()
                    .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

                setFichasAnexas(lista);
            } catch (e: any) {
                console.error("Error en fetchFichasAnexasPorOT:", e);
                setFichasAnexas([]);
                setFichasAnexasError(e?.message ?? "Error cargando fichas anexas");
            } finally {
                setFichasAnexasLoading(false);
            }
        },
        [token]
    );

    const abrirEditorFicha = (id: number) => {
        setEditorFichaId(id);
        setShowFichaEditor(true);
    };

    /* ===== Crear OT ===== */
    const handleCrearChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormCrear((prev) => ({ ...prev, [name]: value }));
    };

    const resetCrearForm = () => {
        setFormCrear({
            clienteCedula: "",
            tecnicoCedula: "",
            equipoId: "",
            medioContacto: "",
            contrasenaEquipo: "",
            accesorios: "",
            problemaReportado: "",
            observacionesIngreso: "",
            tipoServicio: "DIAGNOSTICO",
            prioridad: "MEDIA",
        });
        setNombresAutocompletados({ cliente: "", tecnico: "" });
    };

    const eliminarFichaTecnica = async (fichaId: number) => {
        const confirmDelete = window.confirm(
            "¿Estás seguro de que deseas eliminar esta ficha técnica? Esta acción no se puede deshacer."
        );

        if (!confirmDelete) return;

        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        try {
            const res = await fetch(`${FICHAS_API_BASE}/${fichaId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error(`Error eliminando ficha (HTTP ${res.status})`);
            }

            alert("✅ Ficha técnica eliminada correctamente");

            // Refrescar la lista de fichas anexas
            if (detalle) {
                await fetchFichasAnexasPorOT(detalle.ordenId, detalle.equipoId);
            }

            // Si el modal de detalle estaba abierto, cerrarlo
            if (showFichaDetalle) {
                closeFichaDetalle();
            }
        } catch (e: any) {
            console.error("Error al eliminar ficha:", e);
            alert("❌ " + (e?.message ?? "Error eliminando la ficha técnica"));
        }
    };

    const crearOrden = async () => {
        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        if (!formCrear.clienteCedula.trim()) {
            alert("La cédula del cliente es obligatoria");
            return;
        }
        if (!formCrear.equipoId.trim() || isNaN(Number(formCrear.equipoId))) {
            alert("El ID de equipo debe ser un número válido");
            return;
        }
        if (!formCrear.problemaReportado.trim()) {
            alert("El problema reportado es obligatorio");
            return;
        }
        if (!formCrear.tipoServicio) {
            alert("El tipo de servicio es obligatorio");
            return;
        }
        if (!formCrear.prioridad) {
            alert("La prioridad es obligatoria");
            return;
        }

        const payload: CrearOrdenPayload = {
            clienteCedula: formCrear.clienteCedula.trim(),
            tecnicoCedula: formCrear.tecnicoCedula.trim(),
            equipoId: Number(formCrear.equipoId),
            medioContacto: formCrear.medioContacto.trim(),
            contrasenaEquipo: formCrear.contrasenaEquipo.trim(),
            accesorios: formCrear.accesorios.trim(),
            problemaReportado: formCrear.problemaReportado.trim(),
            observacionesIngreso: formCrear.observacionesIngreso.trim(),
            tipoServicio: formCrear.tipoServicio,
            prioridad: formCrear.prioridad,
        };

        try {
            setCrearLoading(true);
            const res = await fetch(buildUrl(""), {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Error creando OT (HTTP ${res.status})`);

            alert("✅ Orden de trabajo creada correctamente");
            resetCrearForm();
            setShowCrear(false);
            await fetchOrdenes();
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "Error creando la orden de trabajo");
        } finally {
            setCrearLoading(false);
        }
    };

    const abrirHistorialFichas = (cedula: string, otId: number, eqId: number) => {
        setHistorialCedula(cedula);
        setHistorialOtId(otId);
        setHistorialEquipoId(eqId);
        setShowHistorialFichas(true);
    };


    /* =========================
       RENDER
    ========================= */
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* HEADER CON BUSCADOR Y RANGO DE FECHAS */}
                <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Órdenes de Trabajo</h1>
                        <p className="mt-1 text-sm text-slate-500">Gestiona los ingresos, diagnósticos y entregas.</p>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative min-w-[220px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar OT, cliente, equipo..."
                                className="h-9 w-full pl-9 text-sm bg-slate-50 border-slate-200 focus-visible:ring-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative flex items-center gap-1">
                                <span className="text-xs text-slate-500 font-medium">Desde:</span>
                                <Input
                                    type="date"
                                    className="h-9 w-36 text-sm bg-slate-50 border-slate-200"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                />
                            </div>

                            <div className="relative flex items-center gap-1">
                                <span className="text-xs text-slate-500 font-medium">Hasta:</span>
                                <Input
                                    type="date"
                                    className="h-9 w-36 text-sm bg-slate-50 border-slate-200"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* ✅ NUEVO: Selector de Ordenamiento */}
                        <div className="relative min-w-[140px]">
                            <Select
                                value={sortOrder}
                                onValueChange={(val) => setSortOrder(val as "asc" | "desc")}
                            >
                                <SelectTrigger className="h-9 w-full bg-slate-50 border-slate-200 text-xs">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ArrowUpDown className="h-3.5 w-3.5" />
                                        <SelectValue placeholder="Orden" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">Más recientes</SelectItem>
                                    <SelectItem value="asc">Más antiguas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            size="sm"
                            className="flex items-center gap-2 bg-slate-900 text-slate-50 hover:bg-slate-800 whitespace-nowrap"
                            onClick={() => setShowCrear((prev) => !prev)}
                        >
                            <Plus className="h-4 w-4" />
                            {showCrear ? "Cerrar form" : "Nueva OT"}
                        </Button>
                    </div>
                </div>

                {/* FORM CREAR */}
                {showCrear && (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900">Crear nueva Orden de Trabajo</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Selecciona el equipo para cargar automáticamente los responsables.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-4">

                            {/* FILA 1: EQUIPO (El disparador) */}
                            <div className="grid gap-4 md:grid-cols-1">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Equipo *</label>
                                    <EquipoSelector
                                        value={formCrear.equipoId}
                                        onChange={handleEquipoSeleccionado}
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Busca por serie, marca o modelo. Esto asignará el cliente y técnico automáticamente.
                                    </p>
                                </div>
                            </div>

                            {/* FILA 2: CLIENTE Y TÉCNICO (Autocompletados y ReadOnly) */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Cliente (Asignado al equipo)</label>
                                    <div className="relative">
                                        <Input
                                            readOnly
                                            disabled
                                            value={formCrear.clienteCedula ? `${nombresAutocompletados.cliente || "Cargando..."} (${formCrear.clienteCedula})` : ""}
                                            placeholder="Se cargará automáticamente..."
                                            className="h-9 bg-slate-100 text-slate-600 font-medium"
                                        />
                                        {/* Input oculto para asegurar que se envíe el valor si usas FormData nativo */}
                                        <input type="hidden" name="clienteCedula" value={formCrear.clienteCedula} />
                                        <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Técnico (Responsable del equipo)</label>
                                    <div className="relative">
                                        <Input
                                            readOnly
                                            disabled
                                            value={formCrear.tecnicoCedula ? `${nombresAutocompletados.tecnico || "Sin nombre"} (${formCrear.tecnicoCedula})` : ""}
                                            placeholder="Se cargará automáticamente..."
                                            className="h-9 bg-slate-100 text-slate-600 font-medium"
                                        />
                                        <input type="hidden" name="tecnicoCedula" value={formCrear.tecnicoCedula} />
                                        <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 my-2"></div>

                            {/* FILA 3: DETALLES DE LA ORDEN */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Medio de contacto</label>
                                    <Input
                                        name="medioContacto"
                                        value={formCrear.medioContacto}
                                        onChange={handleCrearChange}
                                        placeholder="WhatsApp, llamada, correo..."
                                        className="h-9 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Tipo de servicio *</label>
                                    <Select
                                        value={formCrear.tipoServicio}
                                        onValueChange={(value) => setFormCrear((prev) => ({ ...prev, tipoServicio: value }))}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Selecciona tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DIAGNOSTICO">DIAGNOSTICO</SelectItem>
                                            <SelectItem value="REPARACION">REPARACION</SelectItem>
                                            <SelectItem value="MANTENIMIENTO">MANTENIMIENTO</SelectItem>
                                            <SelectItem value="FORMATEO">FORMATEO</SelectItem>
                                            <SelectItem value="INSTALACION_SO">INSTALACION_SO</SelectItem>
                                            <SelectItem value="OTRO">OTRO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Prioridad *</label>
                                    <Select
                                        value={formCrear.prioridad}
                                        onValueChange={(value) => setFormCrear((prev) => ({ ...prev, prioridad: value }))}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Selecciona prioridad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BAJA">Baja</SelectItem>
                                            <SelectItem value="MEDIA">Media</SelectItem>
                                            <SelectItem value="ALTA">Alta</SelectItem>
                                            <SelectItem value="URGENTE">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Contraseña equipo</label>
                                    <Input
                                        name="contrasenaEquipo"
                                        value={formCrear.contrasenaEquipo}
                                        onChange={handleCrearChange}
                                        placeholder="***"
                                        className="h-9 text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Accesorios</label>
                                    <Input
                                        name="accesorios"
                                        value={formCrear.accesorios}
                                        onChange={handleCrearChange}
                                        placeholder="Cargador, mouse, base, etc."
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Problema reportado *</label>
                                    <textarea
                                        name="problemaReportado"
                                        value={formCrear.problemaReportado}
                                        onChange={handleCrearChange}
                                        placeholder="Descripción del problema..."
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Observaciones de ingreso</label>
                                    <textarea
                                        name="observacionesIngreso"
                                        value={formCrear.observacionesIngreso}
                                        onChange={handleCrearChange}
                                        placeholder="Rayones, estado físico, notas adicionales..."
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                                    onClick={() => {
                                        resetCrearForm();
                                        setShowCrear(false);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={crearOrden}
                                    disabled={crearLoading}
                                    className="flex items-center gap-2 bg-slate-900 text-slate-50 hover:bg-slate-800"
                                >
                                    {crearLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Guardar OT
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {error}
                    </div>
                )}

                {/* LISTA FILTRADA Y PAGINADA */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                    </div>
                ) : ordenesFiltradas.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-100 px-4 py-12 text-center">
                        <Search className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-900">No se encontraron órdenes</p>
                        <p className="text-xs text-slate-500">
                            {(searchTerm || dateStart || dateEnd)
                                ? `No hay resultados para tus filtros.`
                                : "No hay órdenes registradas en el sistema."}
                        </p>
                        {(searchTerm || dateStart || dateEnd) && (
                            <Button
                                variant="link"
                                className="mt-2 h-auto p-0 text-xs text-indigo-600"
                                onClick={() => {
                                    setSearchTerm("");
                                    setDateStart("");
                                    setDateEnd("");
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {currentOrdenes.map((ot) => (
                                <Card
                                    key={ot.id}
                                    onDoubleClick={() => abrirDetalle(ot.id)}
                                    className="cursor-pointer border border-slate-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                                >
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-start justify-between gap-2 text-sm">
                                            <div className="space-y-1">
                                                <span className="block font-semibold text-slate-900">{ot.numeroOrden}</span>
                                                <span className="text-[11px] text-slate-500">
                                                    {fmt(ot.equipoModelo)} {ot.equipoHostname ? `(${ot.equipoHostname})` : ""}
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {ot.estado && (
                                                    <span
                                                        className={`rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase ${estadoBadgeClasses(
                                                            ot.estado
                                                        )}`}
                                                    >
                                                        {ot.estado}
                                                    </span>
                                                )}
                                                <div className="flex gap-1">
                                                    {ot.tipoServicio && (
                                                        <span className="rounded-full bg-slate-50 px-2 py-[2px] text-[10px] uppercase text-slate-700">
                                                            {ot.tipoServicio}
                                                        </span>
                                                    )}
                                                    {ot.prioridad && (
                                                        <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] uppercase text-emerald-700">
                                                            {ot.prioridad}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardTitle>

                                        <CardDescription>
                                            <div className="mt-1 flex flex-col gap-1 text-xs text-slate-600">
                                                <div>
                                                    <span className="font-semibold text-slate-700">Cliente: </span>
                                                    {fmt(ot.clienteNombre)} {ot.clienteCedula ? `(${ot.clienteCedula})` : ""}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-700">Técnico: </span>
                                                    {fmt(ot.tecnicoNombre) || fmt(ot.tecnicoCedula)}
                                                </div>
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {fmtFecha(ot.fechaHoraIngreso)}
                                                </div>
                                            </div>
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pt-0">
                                        <div className="text-xs text-slate-600 line-clamp-3">
                                            <span className="font-semibold text-slate-700">Problema: </span>
                                            {fmt(ot.problemaReportado)}
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[11px] text-slate-500">Doble clic para ver detalle</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* --- PAGINACIÓN --- */}
                        {ordenesFiltradas.length > ITEMS_PER_PAGE && (
                            <div className="mt-6 flex items-center justify-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-slate-300"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-slate-500">
                                    Página <span className="font-semibold text-slate-900">{currentPage}</span> de{" "}
                                    <span className="font-semibold text-slate-900">{totalPages}</span>
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-slate-300"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* ===== MODAL DETALLE OT ===== */}
                {detalle && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) closeDetalle();
                        }}
                    >
                        <div className="relative mx-3 flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            {/* Header */}
                            <header className="sticky top-0 z-20 border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1 pr-10">
                                        <h2 className="text-base font-semibold leading-tight text-white">
                                            Orden #{detalle.numeroOrden} <span className="text-slate-300">·</span> Equipo{" "}
                                            <span className="font-bold">{detalle.equipoModelo ?? detalle.equipoId}</span>
                                        </h2>
                                        <p className="text-[11px] text-slate-200">
                                            Cliente: <span className="font-medium text-white">{fmt(detalle.clienteNombre)}</span>{" "}
                                            {detalle.clienteCedula ? `(${detalle.clienteCedula})` : ""} · Técnico:{" "}
                                            <span className="font-medium text-white">
                                                {fmt(detalle.tecnicoNombre) || fmt(detalle.tecnicoCedula)}
                                            </span>
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-200">
                                            <span>
                                                <span className="font-semibold text-white">Ingreso:</span> {fmtFecha(detalle.fechaHoraIngreso)}
                                            </span>
                                            <span className="hidden sm:inline text-slate-500">·</span>
                                            <span>
                                                <span className="font-semibold text-white">Entrega:</span> {fmtFecha(detalle.fechaHoraEntrega)}
                                            </span>
                                            {detalle.medioContacto && (
                                                <>
                                                    <span className="hidden sm:inline text-slate-500">·</span>
                                                    <span>
                                                        <span className="font-semibold text-white">Medio:</span> {detalle.medioContacto}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {esEnGarantia && (
                                            <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-500/25 px-3 py-1 text-[11px] font-semibold text-amber-50">
                                                Garantía
                                            </span>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => irAAprobacionProcedimiento(detalle.ordenId)}
                                            className="flex items-center gap-2 border border-white/40 bg-white/10 px-3 text-[11px] text-white hover:bg-white/20"
                                        >
                                            <Signature className="h-4 w-4" />
                                            Firma
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setNotifOtId(detalle.ordenId);
                                                setShowNotifModal(true);
                                            }}
                                            className="flex items-center gap-2 border border-white/40 bg-white/10 px-3 text-[11px] text-white hover:bg-white/20"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Notificar
                                        </Button>

                                        <button
                                            onClick={closeDetalle}
                                            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60"
                                            aria-label="Cerrar"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                    {[
                                        { paso: 1, label: "1. Contexto", desc: "Datos de ingreso" },
                                        { paso: 2, label: "2. Diagnóstico", desc: "Trabajo realizado" },
                                        { paso: 3, label: "3. Costos", desc: "Valores económicos" },
                                        { paso: 4, label: "4. Cierre / OTP", desc: "Motivo y firma" },
                                    ].map((p) => (
                                        <StepPill
                                            key={p.paso}
                                            active={pasoActivo === (p.paso as Paso)}
                                            label={p.label}
                                            desc={p.desc}
                                        />
                                    ))}
                                </div>
                            </header>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto bg-slate-50">
                                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                    {/* Izquierda */}
                                    <div className="space-y-4">
                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="py-3">
                                                <CardTitle className="text-sm">Checklist técnico</CardTitle>
                                                <CardDescription className="text-xs">
                                                    Completa el flujo por pasos para no olvidar nada.
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {/* PASO 1 */}
                                                {pasoActivo === 1 && (
                                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                                Datos de ingreso
                                                            </h3>
                                                            <span className="text-[10px] text-slate-400">Paso 1 de 4</span>
                                                        </div>

                                                        <p className="mt-2 text-[11px] text-slate-600">
                                                            Revisa la información de entrada antes de continuar con el diagnóstico.
                                                        </p>

                                                        <div className="mt-3 grid grid-cols-1 gap-3 text-[11px] md:grid-cols-2">
                                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                                <span className="font-semibold text-slate-700">Problema:</span>
                                                                <p className="mt-1 whitespace-pre-wrap text-slate-800">
                                                                    {fmt(detalle.problemaReportado)}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                                <span className="font-semibold text-slate-700">Observaciones:</span>
                                                                <p className="mt-1 whitespace-pre-wrap text-slate-800">
                                                                    {fmt(detalle.observacionesIngreso)}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 md:col-span-2">
                                                                <span className="font-semibold text-slate-700">Equipo:</span>
                                                                <p className="mt-1 text-slate-800">
                                                                    {fmt(detalle.equipoModelo)}{" "}
                                                                    {detalle.equipoHostname ? `(${detalle.equipoHostname})` : ""}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PASO 2 */}
                                                {pasoActivo === 2 && (
                                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                                Diagnóstico y trabajo realizado
                                                            </h3>
                                                            <span className="text-[10px] text-slate-400">Paso 2 de 4</span>
                                                        </div>

                                                        <p className="mt-2 text-[11px] text-slate-600">
                                                            Registra tus pruebas, hallazgos y acciones realizadas.
                                                        </p>

                                                        {/* ✅ FICHAS TÉCNICAS ANEXAS */}
                                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                                        Fichas Técnicas Anexas
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-500">
                                                                        Crea y completa fichas técnicas asociadas a esta OT.
                                                                    </p>
                                                                </div>

                                                                {/* ✅ BOTÓN NUEVA FICHA CON LÓGICA DE MODAL */}
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    className="h-8 bg-slate-900 text-[11px] text-white hover:bg-slate-800"
                                                                    onClick={() => setShowCrearFichaTecnica(true)}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    Nueva ficha
                                                                </Button>
                                                            </div>

                                                            <div className="mt-3">
                                                                {fichasAnexasLoading ? (
                                                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Cargando fichas anexas...
                                                                    </div>
                                                                ) : fichasAnexasError ? (
                                                                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                                                                        {fichasAnexasError}
                                                                    </div>
                                                                ) : fichasAnexas.length === 0 ? (
                                                                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-[11px] text-slate-600">
                                                                        No hay fichas anexas creadas para esta OT.
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid gap-2">
                                                                        {fichasAnexas.map((f) => (
                                                                            <div
                                                                                key={f.id}
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={() => abrirEditorFicha(f.id)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter" || e.key === " ") abrirEditorFicha(f.id);
                                                                                }}
                                                                                className="group relative flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                            >
                                                                                {/* Contenido */}
                                                                                <div className="min-w-0">
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <span className="text-[12px] font-semibold text-slate-900">
                                                                                            Ficha #{f.id}
                                                                                        </span>

                                                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                                                                            {new Date(f.fechaCreacion).toLocaleString("es-EC")}
                                                                                        </span>

                                                                                        {f.tecnicoNombre && (
                                                                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                                                                {f.tecnicoNombre}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {f.observaciones ? (
                                                                                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                                                                                            {f.observaciones}
                                                                                        </p>
                                                                                    ) : (
                                                                                        <p className="mt-1 text-[11px] text-slate-400 italic">
                                                                                            Sin observaciones
                                                                                        </p>
                                                                                    )}
                                                                                </div>

                                                                                {/* Indicador "Abrir" */}
                                                                                <div className="flex shrink-0 items-center gap-2">
                                                                                    <span className="text-[11px] font-medium text-indigo-600 opacity-90 group-hover:opacity-100">

                                                                                    </span>

                                                                                    {/* Eliminar (no abre) */}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const ok = window.confirm(`¿Eliminar la ficha #${f.id}?`);
                                                                                            if (!ok) return;
                                                                                            eliminarFichaTecnica(f.id);
                                                                                        }}
                                                                                        className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 opacity-0 transition hover:bg-rose-100 group-hover:opacity-100"
                                                                                        title="Eliminar ficha"
                                                                                        aria-label={`Eliminar ficha ${f.id}`}
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 space-y-2">
                                                            <label className="text-[11px] font-medium text-slate-700">
                                                                Diagnóstico / trabajo realizado *
                                                            </label>
                                                            <textarea
                                                                value={diagEdit}
                                                                onChange={(e) => setDiagEdit(e.target.value)}
                                                                placeholder="Describe el diagnóstico, pruebas realizadas y trabajo ejecutado..."
                                                                className="min-h-[110px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                            />

                                                            <label className="text-[11px] font-medium text-slate-700">
                                                                Observaciones / recomendaciones
                                                            </label>
                                                            <textarea
                                                                value={obsRecEdit}
                                                                onChange={(e) => setObsRecEdit(e.target.value)}
                                                                placeholder="Notas finales para el cliente, recomendaciones, etc."
                                                                className="min-h-[110px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                            />
                                                        </div>

                                                        {/* ✅ BOTÓN FIRMA DE CONFORMIDAD */}
                                                        <div className={`mt-4 flex flex-col items-center gap-3 rounded-lg border-2 p-4 ${conformidadFirmada ? 'border-emerald-300 bg-emerald-50' : 'border-blue-300 bg-blue-50'}`}>
                                                            {conformidadFirmada ? (
                                                                <>
                                                                    <Check className="h-6 w-6 text-emerald-600" />
                                                                    <p className="text-center text-[12px] font-medium text-emerald-900">
                                                                        ✅ Conformidad de Procedimiento Firmada
                                                                    </p>
                                                                    <p className="text-center text-[11px] text-emerald-700">
                                                                        El cliente ya ha firmado la conformidad del procedimiento.
                                                                    </p>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => iniciarFirmaConformidad("conformidad")}
                                                                        className="flex items-center gap-2 border-emerald-400 text-emerald-700 hover:bg-emerald-100"
                                                                    >
                                                                        <PenTool className="h-4 w-4" />
                                                                        Firmar Nuevamente
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PenTool className="h-6 w-6 text-blue-600" />
                                                                    <p className="text-center text-[12px] font-medium text-blue-900">
                                                                        Obtener Firma de Conformidad del Procedimiento
                                                                    </p>
                                                                    <p className="text-center text-[11px] text-blue-700">
                                                                        El cliente debe firmar para confirmar que acepta el procedimiento técnico propuesto.
                                                                    </p>
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => iniciarFirmaConformidad("conformidad")}
                                                                        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                                                                    >
                                                                        <PenTool className="h-4 w-4" />
                                                                        Abrir Panel de Firma
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PASO 3 */}
                                                {pasoActivo === 3 && detalle && (
                                                    <CostosPanel
                                                        ordenId={detalle.ordenId}
                                                        estado={detalle.estado}
                                                    />
                                                )}

                                                {/* PASO 4 */}
                                                {pasoActivo === 4 && (
                                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                                Firma de Recibo de Entrega
                                                            </h3>
                                                            <span className="text-[10px] text-slate-400">Paso 4 de 4</span>
                                                        </div>

                                                        <p className="mt-2 text-[11px] text-slate-600">
                                                            El equipo está listo para ser entregado. El cliente debe firmar el recibo de conformidad.
                                                        </p>

                                                        <div className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 p-6 ${reciboFirmado ? 'border-emerald-400 bg-emerald-100' : 'border-dashed border-emerald-300 bg-emerald-50'}`}>
                                                            {reciboFirmado ? (
                                                                <>
                                                                    <Check className="mb-3 h-8 w-8 text-emerald-600" />
                                                                    <p className="mb-2 text-center text-[13px] font-medium text-emerald-900">
                                                                        ✅ Recibo de Entrega Firmado
                                                                    </p>
                                                                    <p className="text-center text-[11px] text-emerald-700">
                                                                        El cliente ya ha firmado el recibo de entrega del equipo.
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PenTool className="mb-3 h-8 w-8 text-emerald-600" />
                                                            <p className="mb-4 text-center text-[13px] font-medium text-emerald-900">
                                                                Compartir enlace de firma con el cliente
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    const ordenId = detalle.numeroOrden?.split('-')[1] || '0';
                                                                    window.open(`/firma?ordenId=${ordenId}&modo=recibo`, '_blank');
                                                                }}
                                                                className="flex items-center gap-2 bg-emerald-600 text-sm text-white hover:bg-emerald-700"
                                                            >
                                                                <PenTool className="h-4 w-4" />
                                                                Abrir Formulario de Firma
                                                            </Button>
                                                            <p className="mt-3 text-center text-[10px] text-slate-600">
                                                                Se abrirá en una nueva ventana donde el cliente podrá firmar digitalmente.
                                                            </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Nav */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                                                    <span>Pasos: {pasoActivo} / 4</span>
                                                    <div className="flex gap-2">
                                                        {pasoActivo > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 border-slate-300 text-[11px] text-slate-700"
                                                                onClick={irPasoAnterior}
                                                            >
                                                                Anterior
                                                            </Button>
                                                        )}
                                                        {pasoActivo < 4 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 border-slate-300 text-[11px] text-slate-700"
                                                                onClick={irSiguientePaso}
                                                            >
                                                                Siguiente
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Derecha */}
                                    <div className="space-y-4">
                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="py-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <CardTitle className="text-sm">Imágenes</CardTitle>
                                                        <CardDescription className="text-xs">
                                                            Clic para ampliar. Filtra por categoría.
                                                        </CardDescription>
                                                    </div>
                                                    <Input
                                                        placeholder="Filtro..."
                                                        value={imgFilterCategoria}
                                                        onChange={(e) => setImgFilterCategoria(e.target.value)}
                                                        className="h-9 w-40 text-xs"
                                                    />
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-3">
                                                <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                                                    {imagenesDetalle && imagenesDetalle.length > 0 ? (
                                                        (() => {
                                                            const term = imgFilterCategoria.trim().toUpperCase();
                                                            const categorias = Array.from(new Set(imagenesDetalle.map((img) => img.categoria)))
                                                                .sort()
                                                                .filter((cat) => (term ? cat.toUpperCase().includes(term) : true));

                                                            if (categorias.length === 0) {
                                                                return (
                                                                    <div className="flex h-[220px] items-center justify-center text-[11px] text-slate-400">
                                                                        No hay imágenes para ese filtro.
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="space-y-4">
                                                                    {categorias.map((cat) => {
                                                                        const imgsCat = imagenesDetalle.filter((img) => img.categoria === cat);
                                                                        if (imgsCat.length === 0) return null;

                                                                        return (
                                                                            <div key={cat} className="space-y-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="rounded-full bg-slate-900 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-white">
                                                                                        {cat}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-slate-500">
                                                                                        {imgsCat.length} imagen{imgsCat.length > 1 ? "es" : ""}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="mt-1 flex flex-wrap gap-2">
                                                                                    {imgsCat.map((img) => (
                                                                                        <div
                                                                                            key={img.id}
                                                                                            className="group relative h-24 w-28 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 cursor-pointer"
                                                                                            onClick={() => setSelectedImg(img.ruta)}
                                                                                        >
                                                                                            <SecureImage
                                                                                                src={img.ruta}
                                                                                                alt={img.descripcion || "Imagen OT"}
                                                                                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                                                                            />
                                                                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-1.5 pb-1.5 pt-3">
                                                                                                <p className="truncate text-[9px] text-slate-100">
                                                                                                    {new Date(img.fechaSubida).toLocaleString()}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <div className="flex h-[220px] items-center justify-center text-[11px] text-slate-400">
                                                            No hay imágenes registradas.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                                                    <p className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                                                        <Upload className="h-3 w-3" />
                                                        Subir nuevas imágenes
                                                    </p>

                                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                                        <Select value={categoriaImg} onValueChange={setCategoriaImg}>
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue placeholder="Categoría" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="INGRESO">INGRESO</SelectItem>
                                                                <SelectItem value="DIAGNOSTICO">DIAGNOSTICO</SelectItem>
                                                                <SelectItem value="REPARACION">REPARACION</SelectItem>
                                                                <SelectItem value="ENTREGA">ENTREGA</SelectItem>
                                                                <SelectItem value="OTRO">OTRO</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => setImagenesNuevas(Array.from(e.target.files || []))}
                                                            className="h-9 text-xs file:text-xs"
                                                        />
                                                    </div>

                                                    {imagenesNuevas.length > 0 && (
                                                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                            {imagenesNuevas.map((file, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="relative group aspect-square rounded-md border border-slate-200 overflow-hidden bg-slate-100"
                                                                >
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt="Previsualización"
                                                                        className="h-full w-full object-cover"
                                                                    />

                                                                    <button
                                                                        onClick={() => {
                                                                            setImagenesNuevas((prev) => prev.filter((_, i) => i !== index));
                                                                        }}
                                                                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-90 hover:bg-red-600 shadow-sm"
                                                                        title="Quitar imagen"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>

                                                                    <div className="absolute bottom-0 w-full bg-black/60 px-1 py-0.5">
                                                                        <p className="truncate text-[9px] text-white text-center">
                                                                            {(file.size / 1024).toFixed(0)} KB
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-2 flex justify-end">
                                                        <Button
                                                            onClick={subirImagenes}
                                                            disabled={imagenesNuevas.length === 0}
                                                            className="flex h-9 items-center gap-2 bg-slate-900 text-xs text-slate-50 hover:bg-slate-800"
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                            Subir imágenes
                                                        </Button>
                                                    </div>
                                                </div>


                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                                    <div>
                                        Usa <span className="font-semibold">Guardar</span> o{" "}
                                        <span className="font-semibold">Cerrar OT</span> cuando esté lista.
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={guardando}
                                            onClick={() => guardarCambiosOrden(false)}
                                            className="flex h-9 items-center gap-2 border-slate-300 text-[11px] text-slate-700"
                                        >
                                            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Guardar
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={guardando}
                                            onClick={cerrarOrden}
                                            className="flex h-9 items-center gap-2 bg-slate-900 text-[11px] text-slate-50 hover:bg-slate-800"
                                        >
                                            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Cerrar OT
                                        </Button>
                                    </div>
                                </div>
                            </footer>

                            {/* Overlay imagen */}
                            {selectedImg && (
                                <div
                                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
                                    onClick={() => setSelectedImg(null)}
                                >
                                    <div
                                        className="relative mx-4 max-h-[90vh] max-w-5xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => setSelectedImg(null)}
                                            className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black/90 z-50"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        <SecureImage
                                            src={selectedImg}
                                            alt="Vista ampliada"
                                            className="max-h-[90vh] w-full rounded-md object-contain shadow-2xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Modal notificación */}
                            {showNotifModal && notifOtId !== null && (
                                <ModalNotificacion
                                    otId={notifOtId}
                                    open={showNotifModal}
                                    onClose={() => setShowNotifModal(false)}
                                />
                            )}
                        </div>
                    </div>
                )}


                {/* Modal detalle ficha técnica */}
                <FichaTecnicaDetalleModal
                    open={showFichaDetalle}
                    onClose={closeFichaDetalle}
                    loading={fichaLoading}
                    error={fichaError}
                    data={fichaDetalle}
                />

                {/* Editor de fichas técnicas anexas (Mejorado) */}
                <FichaTecnicaEditorModal
                    open={showFichaEditor}
                    fichaId={editorFichaId}
                    onClose={() => {
                        setShowFichaEditor(false);
                        setEditorFichaId(null);
                    }}
                    onSaved={() => {
                        if (detalle) fetchFichasAnexasPorOT(detalle.ordenId, detalle.equipoId);
                    }}
                />

                {/* ✅ MODAL DE CREACIÓN DE FICHA INTEGRADO */}
                {detalle && (
                    <CrearFichaTecnicaModal
                        open={showCrearFichaTecnica}
                        clienteCedula={detalle.clienteCedula || ""}
                        tecnicoCedula={detalle.tecnicoCedula || ""}
                        ordenTrabajoId={detalle.ordenId}
                        onClose={() => setShowCrearFichaTecnica(false)}
                        onCreated={(newFichaId) => {
                            // Abrir el editor con la ficha creada
                            setShowCrearFichaTecnica(false);
                            setEditorFichaId(newFichaId);
                            setShowFichaEditor(true);

                            // Refrescar lista de fichas
                            if (detalle) {
                                fetchFichasAnexasPorOT(detalle.ordenId, detalle.equipoId);
                            }
                        }}
                    />
                )}

                {/* ✅ MODAL FIRMA CONFORMIDAD */}
                {showModalFirmaConformidad && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setShowModalFirmaConformidad(false);
                        }}
                    >
                        <div className="relative mx-3 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-blue-50 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <PenTool className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {modoFirma === "aceptacion" ? "Firma de Aceptación" : "Firma de Conformidad del Procedimiento"}
                                        </p>
                                        <p className="text-xs text-slate-500">Dibuja tu firma en el área de abajo</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModalFirmaConformidad(false)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    aria-label="Cerrar"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Canvas */}
                            <div className="p-6">
                                <p className="mb-3 text-sm text-slate-700 font-medium">Firma</p>
                                <canvas
                                    ref={setFirmaCanvasRef}
                                    width={600}
                                    height={200}
                                    onMouseDown={startDrawingFirma}
                                    onMouseMove={drawFirma}
                                    onMouseUp={stopDrawingFirma}
                                    onMouseLeave={stopDrawingFirma}
                                    onTouchStart={startDrawingFirma}
                                    onTouchMove={drawFirma}
                                    onTouchEnd={stopDrawingFirma}
                                    style={{
                                        border: "2px solid #e2e8f0",
                                        borderRadius: "8px",
                                        cursor: "crosshair",
                                        backgroundColor: "#fff",
                                        width: "100%",
                                        height: "200px",
                                    }}
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={limpiarFirmaConformidad}
                                    className="flex-1"
                                >
                                    Limpiar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModalFirmaConformidad(false)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={guardarFirmaConformidad}
                                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Guardar Firma
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}