"use client";

import React, {
    useEffect,
    useState,
    useCallback,
    type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    CalendarDays,
    FileUp,
} from "lucide-react";

// Asegúrate de que estos imports existan en tu proyecto, si no, coméntalos o ajústalos
import FichaTecnicaForm from "./FichaTecnicaForm";
import XmlUploader from "./XmlUploader";
import { API_BASE_URL } from "../lib/api"; // <-- Import

const API_BASE = `${API_BASE_URL}/api/fichas`; // <-- Use variable
const buildUrl = (p: string = "") => `${API_BASE}${p}`;

interface FichaTecnicaDTO {
    id: number;
    fechaCreacion: string;
    observaciones: string | null;

    equipoId: number | null;
    ordenTrabajoId: number | null;
    tecnicoId: string | null;

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

// ✅ CORRECCIÓN: El componente Section se define FUERA del componente principal
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
            {subtitle && (
                <span className="text-[10px] text-slate-400">{subtitle}</span>
            )}
        </div>
        {children}
    </section>
);

export default function FichasTecnicasPage() {
    const [fichas, setFichas] = useState<FichaTecnicaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [detalle, setDetalle] = useState<FichaTecnicaDTO | null>(null);
    const [detalleForm, setDetalleForm] = useState<FichaTecnicaDTO | null>(null);

    const [showXml, setShowXml] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // helpers para selects booleanos
    const fmtBoolSelect = (v: boolean | null): string =>
        v === null ? "" : v ? "true" : "false";

    const AUTO_FROM_XML_FIELDS: (keyof FichaTecnicaDTO)[] = [
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
    ];

    const descargarPdf = async () => {
        try {
            if (!token) {
                console.error("No hay token, usuario no autenticado");
                return;
            }

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
            a.download = "ficha.pdf";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        }
    };

    const isAutoFromXml = (field: keyof FichaTecnicaDTO) =>
        AUTO_FROM_XML_FIELDS.includes(field) &&
        !!detalle &&
        detalle[field] !== null;

    const parseBoolInput = (value: string): boolean | null => {
        if (value === "") return null;
        if (value === "true") return true;
        if (value === "false") return false;
        return null;
    };

    const updateField = <K extends keyof FichaTecnicaDTO>(
        field: K,
        value: FichaTecnicaDTO[K]
    ) => {
        setDetalleForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    // ===== fetch =====
    const fetchFichas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(buildUrl(""), {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) throw new Error("Error al cargar fichas técnicas");
            const data: FichaTecnicaDTO[] = await res.json();
            setFichas(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchFichas();
    }, [fetchFichas]);

    // ===== abrir detalle =====
    const abrirDetalle = async (id: number) => {
        try {
            const res = await fetch(buildUrl(`/${id}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) throw new Error("Error al cargar detalles");
            const data: FichaTecnicaDTO = await res.json();
            setDetalle(data);
            setDetalleForm(data);
            setShowForm(false);
            setShowXml(false);
            setShowUpload(false);
        } catch (e: any) {
            setError(e.message);
        }
    };

    // ===== guardar ficha completa =====
    const guardarFichaCompleta = async (e: FormEvent) => {
        e.preventDefault();
        if (!detalleForm) return;

        try {
            const res = await fetch(buildUrl(`/${detalleForm.id}`), {
                method: "PUT",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(detalleForm),
            });

            if (!res.ok) throw new Error("Error al guardar ficha técnica");

            const actualizada: FichaTecnicaDTO = await res.json();
            setDetalle(actualizada);
            setDetalleForm(actualizada);
            await fetchFichas();
            alert("✅ Ficha técnica guardada correctamente");
        } catch (e: any) {
            alert("❌ " + e.message);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Fichas Técnicas</h1>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Nueva Ficha Técnica
                </Button>
            </div>

            {/* === LISTA === */}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                </div>
            ) : fichas.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                    No hay fichas técnicas registradas.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fichas.map((ficha) => (
                        <Card
                            key={ficha.id}
                            onClick={() => abrirDetalle(ficha.id)}
                            className="transition hover:shadow-md cursor-pointer"
                        >
                            <CardHeader>
                                <CardTitle>Ficha #{ficha.id}</CardTitle>
                                <CardDescription>
                                    <div className="text-sm flex flex-col gap-1 mt-1 text-gray-700">
                                        <div>
                                            <span className="font-semibold">Técnico: </span>
                                            {ficha.tecnicoId ?? "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Equipo ID: </span>
                                            {ficha.equipoId ?? "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Orden de trabajo: </span>
                                            {ficha.ordenTrabajoId ?? "-"}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                            <CalendarDays className="h-4 w-4" />
                                            {ficha.fechaCreacion
                                                ? new Date(ficha.fechaCreacion).toLocaleString()
                                                : ""}
                                        </div>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-600 line-clamp-3">
                                    {ficha.observaciones || "Sin observaciones"}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* === MODAL CREAR === */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative shadow-xl">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ✕
                        </button>
                        <FichaTecnicaForm />
                    </div>
                </div>
            )}

            {/* === MODAL DETALLE === */}
            {detalle && detalleForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-[90vw] max-w-6xl max-h-[90vh] p-6 relative flex flex-col overflow-y-auto">
                        <button
                            onClick={() => setDetalle(null)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ✕
                        </button>

                        {/* ENCABEZADO */}
                        <div className="flex justify-between items-start mb-4 pr-10">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Ficha #{detalleForm.id} – Equipo {detalleForm.equipoId ?? "-"}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Técnico:{" "}
                                    <span className="font-semibold">
                                        {detalleForm.tecnicoId ?? "-"}
                                    </span>{" "}
                                    · OT: {detalleForm.ordenTrabajoId ?? "-"}
                                    <br />
                                    Creada el{" "}
                                    {detalleForm.fechaCreacion
                                        ? new Date(detalleForm.fechaCreacion).toLocaleString()
                                        : "-"}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowXml(true)}
                                    className="flex items-center gap-2"
                                >
                                    <FileUp className="h-4 w-4" /> Cargar XML del equipo
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={descargarPdf}
                                >
                                    <FileUp className="h-4 w-4" /> Descargar PDF
                                </Button>
                            </div>
                        </div>

                        <form
                            onSubmit={guardarFichaCompleta}
                            className="space-y-3 text-sm max-h-[75vh] overflow-y-auto pr-1"
                        >
                            {/* CABECERA ESTILIZADA */}
                            <div className="sticky top-0 z-10 mb-1 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs text-white">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold">
                                        HW
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">
                                            Ficha técnica de equipo
                                        </div>
                                        <div className="text-[11px] text-slate-200">
                                            Resumen técnico para diagnóstico y trazabilidad.
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                                        ID ficha:{" "}
                                        <span className="font-semibold">
                                            {detalleForm.id ?? "-"}
                                        </span>
                                    </span>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                                        Equipo:{" "}
                                        <span className="font-semibold">
                                            {detalleForm.equipoId ?? "-"}
                                        </span>
                                    </span>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                                        Técnico:{" "}
                                        <span className="font-semibold">
                                            {detalleForm.tecnicoId ?? "-"}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* METADATOS BÁSICOS */}
                            <Section title="Metadatos de ficha">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            ID ficha
                                        </label>
                                        <Input
                                            className="h-8 bg-slate-100 text-xs"
                                            value={detalleForm.id}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Fecha creación
                                        </label>
                                        <Input
                                            className="h-8 bg-slate-100 text-xs"
                                            value={
                                                detalleForm.fechaCreacion
                                                    ? new Date(detalleForm.fechaCreacion).toLocaleString()
                                                    : ""
                                            }
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Equipo ID
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoId ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "equipoId",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Orden Trabajo ID
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.ordenTrabajoId ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "ordenTrabajoId",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Técnico (cédula)
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.tecnicoId ?? ""}
                                            onChange={(e) => updateField("tecnicoId", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* OBSERVACIONES GENERALES */}
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Nombre
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.cpuNombre ?? ""}
                                            onChange={(e) => updateField("cpuNombre", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Núcleos
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.cpuNucleos ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "cpuNucleos",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Hilos lógicos
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.cpuLogicos ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "cpuLogicos",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Paquetes físicos
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.cpuPaquetesFisicos ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "cpuPaquetesFisicos",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Frecuencia original (MHz)
                                        </label>
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

                            {/* RAM (hardware) */}
                            <Section title="RAM (hardware)">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Capacidad (GB)
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.ramCapacidadGb ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "ramCapacidadGb",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Frecuencia (MHz)
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.ramFrecuenciaMhz ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "ramFrecuenciaMhz",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tecnología módulo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramTecnologiaModulo ?? ""}
                                            onChange={(e) =>
                                                updateField("ramTecnologiaModulo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tipo (DDR3/DDR4/DDR5)
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramTipo ?? ""}
                                            onChange={(e) => updateField("ramTipo", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Nº módulo
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.ramNumeroModulo ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "ramNumeroModulo",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Serie módulo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramSerieModulo ?? ""}
                                            onChange={(e) =>
                                                updateField("ramSerieModulo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Fecha fabricación
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramFechaFabricacion ?? ""}
                                            onChange={(e) =>
                                                updateField("ramFechaFabricacion", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Lugar fabricación
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramLugarFabricacion ?? ""}
                                            onChange={(e) =>
                                                updateField("ramLugarFabricacion", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* DISCO (hardware) */}
                            <Section title="Disco (hardware)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Modelo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoModelo ?? ""}
                                            onChange={(e) =>
                                                updateField("discoModelo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            N° serie
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoNumeroSerie ?? ""}
                                            onChange={(e) =>
                                                updateField("discoNumeroSerie", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tipo (SSD/HDD, SATA/NVMe)
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoTipo ?? ""}
                                            onChange={(e) => updateField("discoTipo", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Capacidad (MB)
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.discoCapacidadMb ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "discoCapacidadMb",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Capacidad (texto)
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoCapacidadStr ?? ""}
                                            onChange={(e) =>
                                                updateField("discoCapacidadStr", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            RPM
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.discoRpm ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "discoRpm",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Letras unidades
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoLetras ?? ""}
                                            onChange={(e) =>
                                                updateField("discoLetras", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            WWN
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoWwn ?? ""}
                                            onChange={(e) => updateField("discoWwn", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Temperatura
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoTemperatura ?? ""}
                                            onChange={(e) =>
                                                updateField("discoTemperatura", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Horas encendido
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoHorasEncendido ?? ""}
                                            onChange={(e) =>
                                                updateField("discoHorasEncendido", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Sectores reasignados
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoSectoresReasignados ?? ""}
                                            onChange={(e) =>
                                                updateField("discoSectoresReasignados", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Sectores pendientes
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoSectoresPendientes ?? ""}
                                            onChange={(e) =>
                                                updateField("discoSectoresPendientes", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Errores lectura
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoErroresLectura ?? ""}
                                            onChange={(e) =>
                                                updateField("discoErroresLectura", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Errores CRC
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoErrorCrc ?? ""}
                                            onChange={(e) =>
                                                updateField("discoErrorCrc", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* PLACA / GPU / BUS / TPM */}
                            <Section title="Placa base / GPU / Buses / TPM">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Mainboard modelo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.mainboardModelo ?? ""}
                                            onChange={(e) =>
                                                updateField("mainboardModelo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Chipset
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.chipset ?? ""}
                                            onChange={(e) => updateField("chipset", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            GPU nombre
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.gpuNombre ?? ""}
                                            onChange={(e) => updateField("gpuNombre", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Versión PCI Express
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.pciExpressVersion ?? ""}
                                            onChange={(e) =>
                                                updateField("pciExpressVersion", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Versión USB
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.usbVersion ?? ""}
                                            onChange={(e) =>
                                                updateField("usbVersion", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            TPM presente
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.tpmPresente)}
                                            onChange={(e) =>
                                                updateField(
                                                    "tpmPresente",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            TPM versión
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.tpmVersion ?? ""}
                                            onChange={(e) =>
                                                updateField("tpmVersion", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            HVCI estado
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.hvciEstado ?? ""}
                                            onChange={(e) =>
                                                updateField("hvciEstado", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* RED / WIFI */}
                            <Section title="Red / Wi-Fi">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Adaptador red
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.adaptadorRed ?? ""}
                                            onChange={(e) =>
                                                updateField("adaptadorRed", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            MAC Address
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.macAddress ?? ""}
                                            onChange={(e) => updateField("macAddress", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            WiFi velocidad actual
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.wifiLinkSpeedActual ?? ""}
                                            onChange={(e) =>
                                                updateField("wifiLinkSpeedActual", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            WiFi velocidad máx.
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.wifiLinkSpeedMax ?? ""}
                                            onChange={(e) =>
                                                updateField("wifiLinkSpeedMax", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            WiFi funciona
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.wifiFunciona)}
                                            onChange={(e) =>
                                                updateField("wifiFunciona", parseBoolInput(e.target.value))
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Wifi observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.wifiObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("wifiObservaciones", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* BIOS / UEFI / SO (hardware) */}
                            <Section title="BIOS / UEFI / Sistema Operativo (HW)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS fabricante
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.biosFabricante ?? ""}
                                            onChange={(e) =>
                                                updateField("biosFabricante", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS versión
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.biosVersion ?? ""}
                                            onChange={(e) =>
                                                updateField("biosVersion", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS fecha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.biosFechaStr ?? ""}
                                            onChange={(e) =>
                                                updateField("biosFechaStr", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS es UEFI capaz
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.biosEsUefiCapaz)}
                                            onChange={(e) =>
                                                updateField(
                                                    "biosEsUefiCapaz",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Arranque UEFI presente
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.arranqueUefiPresente)}
                                            onChange={(e) =>
                                                updateField(
                                                    "arranqueUefiPresente",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Secure Boot activo
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.secureBootActivo)}
                                            onChange={(e) =>
                                                updateField(
                                                    "secureBootActivo",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            SO descripción
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.soDescripcion ?? ""}
                                            onChange={(e) =>
                                                updateField("soDescripcion", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* EQUIPO FÍSICO */}
                            <Section title="Equipo (identificación física)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Nombre equipo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoNombre ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoNombre", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Marca
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoMarca ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoMarca", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Modelo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoModelo ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoModelo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Serie
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoSerie ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoSerie", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Otros
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoOtros ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoOtros", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Roturas
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoRoturas ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoRoturas", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Marcas de desgaste
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.equipoMarcasDesgaste ?? ""}
                                            onChange={(e) =>
                                                updateField("equipoMarcasDesgaste", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tornillos faltantes
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.tornillosFaltantes)}
                                            onChange={(e) =>
                                                updateField(
                                                    "tornillosFaltantes",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                            </Section>

                            {/* CARCASA / TECLADO / TOUCHPAD */}
                            <Section title="Carcasa / Teclado / Touchpad">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Carcasa estado
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.carcasaEstado ?? ""}
                                            onChange={(e) =>
                                                updateField("carcasaEstado", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Carcasa observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.carcasaObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("carcasaObservaciones", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Teclado estado
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.tecladoEstado ?? ""}
                                            onChange={(e) =>
                                                updateField("tecladoEstado", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Teclas dañadas
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.tecladoTeclasDanadas)}
                                            onChange={(e) =>
                                                updateField(
                                                    "tecladoTeclasDanadas",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Teclas faltantes
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.tecladoTeclasFaltantes)}
                                            onChange={(e) =>
                                                updateField(
                                                    "tecladoTeclasFaltantes",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Retroiluminación
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.tecladoRetroiluminacion)}
                                            onChange={(e) =>
                                                updateField(
                                                    "tecladoRetroiluminacion",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Teclado observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.tecladoObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("tecladoObservaciones", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Touchpad estado
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.touchpadEstado ?? ""}
                                            onChange={(e) =>
                                                updateField("touchpadEstado", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Touchpad funciona
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.touchpadFunciona)}
                                            onChange={(e) =>
                                                updateField(
                                                    "touchpadFunciona",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Botón izquierdo
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.touchpadBotonIzq)}
                                            onChange={(e) =>
                                                updateField(
                                                    "touchpadBotonIzq",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Botón derecho
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.touchpadBotonDer)}
                                            onChange={(e) =>
                                                updateField(
                                                    "touchpadBotonDer",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Touchpad táctil
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.touchpadTactil)}
                                            onChange={(e) =>
                                                updateField(
                                                    "touchpadTactil",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Touchpad observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.touchpadObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("touchpadObservaciones", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* PANTALLA / MONITOR / CÁMARA */}
                            <Section title="Pantalla / Monitor / Cámara">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Monitor nombre
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.monitorNombre ?? ""}
                                            onChange={(e) =>
                                                updateField("monitorNombre", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Monitor modelo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.monitorModelo ?? ""}
                                            onChange={(e) =>
                                                updateField("monitorModelo", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Rayones
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.pantallaRayones)}
                                            onChange={(e) =>
                                                updateField(
                                                    "pantallaRayones",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Trizaduras
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.pantallaTrizaduras)}
                                            onChange={(e) =>
                                                updateField(
                                                    "pantallaTrizaduras",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Pixeles muertos
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.pantallaPixelesMuertos)}
                                            onChange={(e) =>
                                                updateField(
                                                    "pantallaPixelesMuertos",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Manchas
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.pantallaManchas)}
                                            onChange={(e) =>
                                                updateField(
                                                    "pantallaManchas",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Pantalla táctil
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.pantallaTactil)}
                                            onChange={(e) =>
                                                updateField(
                                                    "pantallaTactil",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Observaciones pantalla
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.pantallaObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("pantallaObservaciones", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Cámara funciona
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.camaraFunciona)}
                                            onChange={(e) =>
                                                updateField(
                                                    "camaraFunciona",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Observaciones cámara
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.camaraObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("camaraObservaciones", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* PUERTOS */}
                            <Section title="Puertos">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    {[
                                        ["puertoUsb", "USB"],
                                        ["puertoVga", "VGA"],
                                        ["puertoEthernet", "Ethernet"],
                                        ["puertoHdmi", "HDMI"],
                                        ["puertoEntradaAudio", "Entrada audio"],
                                        ["puertoSalidaAudio", "Salida audio"],
                                        ["puertoMicroSd", "MicroSD"],
                                        ["puertoDvd", "DVD"],
                                    ].map(([field, label]) => (
                                        <div key={field}>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                {label}
                                            </label>
                                            <select
                                                className="border rounded-md px-2 h-8 w-full text-[11px]"
                                                value={fmtBoolSelect(
                                                    detalleForm[field as keyof FichaTecnicaDTO] as
                                                    | boolean
                                                    | null
                                                )}
                                                onChange={(e) =>
                                                    updateField(
                                                        field as keyof FichaTecnicaDTO,
                                                        parseBoolInput(e.target.value) as any
                                                    )
                                                }
                                            >
                                                <option value="">-</option>
                                                <option value="true">Sí</option>
                                                <option value="false">No</option>
                                            </select>
                                        </div>
                                    ))}
                                    <div className="md:col-span-4">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Observaciones puertos
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.puertosObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("puertosObservaciones", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* AUDIO / FUNCIONAL */}
                            <Section title="Audio / Hardware multimedia">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Audio adaptador
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.audioAdaptador ?? ""}
                                            onChange={(e) =>
                                                updateField("audioAdaptador", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Audio codec
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.audioCodec ?? ""}
                                            onChange={(e) =>
                                                updateField("audioCodec", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Audio hardware ID
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.audioHardwareId ?? ""}
                                            onChange={(e) =>
                                                updateField("audioHardwareId", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* DISCO (FICHA FÍSICA) */}
                            <Section title="Disco (ficha física)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Estado
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoEstado ?? ""}
                                            onChange={(e) =>
                                                updateField("discoEstado", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tipo ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoTipoFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("discoTipoFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Marca ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoMarcaFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("discoMarcaFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Capacidad ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoCapacidadFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("discoCapacidadFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Serie ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoSerieFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("discoSerieFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Observaciones ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.discoObservacionesFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("discoObservacionesFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* RAM (FICHA FÍSICA) */}
                            <Section title="RAM (ficha física)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tipo equipo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramTipoEquipo ?? ""}
                                            onChange={(e) =>
                                                updateField("ramTipoEquipo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Cantidad módulos
                                        </label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={detalleForm.ramCantidadModulos ?? ""}
                                            onChange={(e) =>
                                                updateField(
                                                    "ramCantidadModulos",
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Marca ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramMarcaFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("ramMarcaFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tecnología ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramTecnologiaFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("ramTecnologiaFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Capacidad ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramCapacidadFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("ramCapacidadFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Frecuencia ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramFrecuenciaFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("ramFrecuenciaFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Observaciones RAM
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ramObservacionesFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("ramObservacionesFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* MAINBOARD / CPU / GPU / FUENTE */}
                            <Section title="Mainboard / CPU / GPU / Fuente">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Mainboard modelo ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.mainboardModeloFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("mainboardModeloFicha", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Mainboard observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.mainboardObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("mainboardObservaciones", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Procesador marca
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.procesadorMarca ?? ""}
                                            onChange={(e) =>
                                                updateField("procesadorMarca", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Procesador modelo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.procesadorModelo ?? ""}
                                            onChange={(e) =>
                                                updateField("procesadorModelo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Tipo gráfica (integrada/dedicada)
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.graficaTipo ?? ""}
                                            onChange={(e) =>
                                                updateField("graficaTipo", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Fuente ventilador estado
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.fuenteVentiladorEstado ?? ""}
                                            onChange={(e) =>
                                                updateField("fuenteVentiladorEstado", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Fuente ruido
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.fuenteRuido ?? ""}
                                            onChange={(e) =>
                                                updateField("fuenteRuido", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Fuente medición voltaje
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.fuenteMedicionVoltaje ?? ""}
                                            onChange={(e) =>
                                                updateField("fuenteMedicionVoltaje", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Fuente observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.fuenteObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("fuenteObservaciones", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Ventilador CPU observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.ventiladorCpuObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("ventiladorCpuObservaciones", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* BATERÍA / CARGADOR */}
                            <Section title="Batería / Cargador">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Batería código
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.bateriaCodigo ?? ""}
                                            onChange={(e) =>
                                                updateField("bateriaCodigo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Batería observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.bateriaObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("bateriaObservaciones", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Cargador código
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.cargadorCodigo ?? ""}
                                            onChange={(e) =>
                                                updateField("cargadorCodigo", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Cargador estado cable
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.cargadorEstadoCable ?? ""}
                                            onChange={(e) =>
                                                updateField("cargadorEstadoCable", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Cargador voltajes
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.cargadorVoltajes ?? ""}
                                            onChange={(e) =>
                                                updateField("cargadorVoltajes", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* BIOS / SEGURIDAD (FICHA) / SO / SOFTWARE */}
                            <Section title="BIOS (ficha) / SO / Software">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS contraseña
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.biosContrasena)}
                                            onChange={(e) =>
                                                updateField(
                                                    "biosContrasena",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS tipo arranque
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.biosTipoArranque ?? ""}
                                            onChange={(e) =>
                                                updateField("biosTipoArranque", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS Secure Boot
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.biosSecureBoot)}
                                            onChange={(e) =>
                                                updateField(
                                                    "biosSecureBoot",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            BIOS observaciones ficha
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.biosObservacionesFicha ?? ""}
                                            onChange={(e) =>
                                                updateField("biosObservacionesFicha", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            SO tipo
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.soTipo ?? ""}
                                            onChange={(e) => updateField("soTipo", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            SO versión
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.soVersion ?? ""}
                                            onChange={(e) => updateField("soVersion", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            SO proveedor
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.soProveedor ?? ""}
                                            onChange={(e) =>
                                                updateField("soProveedor", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            SO licencia activa
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.soLicenciaActiva)}
                                            onChange={(e) =>
                                                updateField(
                                                    "soLicenciaActiva",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Antivirus marca
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.antivirusMarca ?? ""}
                                            onChange={(e) =>
                                                updateField("antivirusMarca", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Antivirus licencia activa
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.antivirusLicenciaActiva)}
                                            onChange={(e) =>
                                                updateField(
                                                    "antivirusLicenciaActiva",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Antivirus observaciones
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.antivirusObservaciones ?? ""}
                                            onChange={(e) =>
                                                updateField("antivirusObservaciones", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Office licencia activa
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(detalleForm.officeLicenciaActiva)}
                                            onChange={(e) =>
                                                updateField(
                                                    "officeLicenciaActiva",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Office versión
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.officeVersion ?? ""}
                                            onChange={(e) =>
                                                updateField("officeVersion", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* INFORMACIÓN / RESPALDO */}
                            <Section title="Información / Respaldo">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Cantidad información
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.informacionCantidad ?? ""}
                                            onChange={(e) =>
                                                updateField("informacionCantidad", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Requiere respaldo
                                        </label>
                                        <select
                                            className="border rounded-md px-2 h-8 w-full text-[11px]"
                                            value={fmtBoolSelect(
                                                detalleForm.informacionRequiereRespaldo
                                            )}
                                            onChange={(e) =>
                                                updateField(
                                                    "informacionRequiereRespaldo",
                                                    parseBoolInput(e.target.value)
                                                )
                                            }
                                        >
                                            <option value="">-</option>
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-slate-600">
                                            Otros programas
                                        </label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={detalleForm.informacionOtrosProgramas ?? ""}
                                            onChange={(e) =>
                                                updateField("informacionOtrosProgramas", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* TRABAJO REALIZADO */}
                            <Section title="Trabajo realizado">
                                <textarea
                                    className="w-full border rounded-md px-2 py-1 text-xs min-h-[70px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                                    value={detalleForm.trabajoRealizado ?? ""}
                                    onChange={(e) =>
                                        updateField("trabajoRealizado", e.target.value)
                                    }
                                    placeholder="Describe las acciones realizadas, repuestos cambiados, diagnósticos finales, etc."
                                />
                            </Section>

                            {/* BOTONES */}
                            <div className="flex justify-end gap-2 pb-1 pt-2 border-t mt-2 bg-gradient-to-t from-slate-50 to-transparent">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDetalle(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" size="sm">
                                    💾 Guardar ficha completa
                                </Button>
                            </div>
                        </form>

                        {/* MODAL XML */}
                        {showXml && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-3xl relative shadow-xl">
                                    <button
                                        onClick={() => setShowXml(false)}
                                        className="absolute top-2 right-3 text-gray-600 hover:text-black text-2xl z-10"
                                    >
                                        ✕
                                    </button>
                                    <XmlUploader
                                        equipoId={detalleForm.equipoId ?? detalleForm.id}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}