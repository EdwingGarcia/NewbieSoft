"use client";

import { useEffect, useState, useCallback } from "react";
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
    Upload,
    X,
    FileUp,
} from "lucide-react";
import FichaTecnicaForm from "./FichaTecnicaForm";
import XmlUploader from "./XmlUploader";

const API_BASE = "http://localhost:8080/api/fichas";
const buildUrl = (p: string = "") => `${API_BASE}${p}`;

/** === DTO QUE VIENE DEL BACKEND === */
interface FichaTecnicaDTO {
    id: number;
    fechaCreacion: string; // ISO string
    observaciones: string | null;

    equipoId: number;
    ordenTrabajoId: number;
    tecnicoId: string;

    adaptadorRed: string | null;
    arranqueUefiPresente: boolean | null;
    biosEsUefiCapaz: boolean | null;
    biosFabricante: string | null;
    biosFechaStr: string | null;
    biosVersion: string | null;
    chipset: string | null;

    cpuLogicos: number | null;
    cpuNombre: string | null;
    cpuNucleos: number | null;

    discoCapacidadMb: number | null;
    discoCapacidadStr: string | null;
    discoModelo: string | null;
    discoNumeroSerie: string | null;
    discoRpm: number | null;
    discoTipo: string | null;

    gpuNombre: string | null;
    macAddress: string | null;
    mainboardModelo: string | null;

    ramCapacidadGb: number | null;
    ramFrecuenciaMhz: number | null;
    ramTecnologiaModulo: string | null;
    ramTipo: string | null;

    secureBootActivo: boolean | null;
    soDescripcion: string | null;

    wifiLinkSpeedActual: string | null;
    wifiLinkSpeedMax: string | null;
}

export default function FichasTecnicasPage() {
    const [fichas, setFichas] = useState<FichaTecnicaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [detalle, setDetalle] = useState<FichaTecnicaDTO | null>(null);
    const [editObservaciones, setEditObservaciones] = useState("");
    const [hardwareSearch, setHardwareSearch] = useState("");
    const [showXml, setShowXml] = useState(false);
    const [showUpload, setShowUpload] = useState(false); // lo dejamos para futuro uso
    const [newFiles] = useState<File[]>([]); // placeholder para no romper UI
    const [selectedImg, setSelectedImg] = useState<string | null>(null); // igual, placeholder

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // ===== tiny helper: formatea booleanos / null =====
    const fmtBool = (v: boolean | null): string =>
        v === null ? "-" : v ? "Sí" : "No";

    const fmtVal = (v: unknown): string =>
        v === null || v === undefined || v === "" ? "-" : String(v);

    // ===== fetch =====
    const fetchFichas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(buildUrl(""), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error al cargar fichas técnicas");
            const data = await res.json();
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

    // ===== detalle =====
    const abrirDetalle = async (id: number) => {
        try {
            const res = await fetch(buildUrl(`/${id}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error al cargar detalles");
            const data: FichaTecnicaDTO = await res.json();
            setDetalle(data);
            setEditObservaciones(data.observaciones || "");
            setShowForm(false);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const guardarObservaciones = async () => {
        if (!detalle) return;
        try {
            const res = await fetch(buildUrl(`/${detalle.id}/observaciones`), {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "text/plain",
                },
                body: editObservaciones,
            });
            if (!res.ok) throw new Error("Error al actualizar observaciones");
            await fetchFichas();
            alert("✅ Observaciones actualizadas correctamente");
        } catch (e: any) {
            alert("❌ " + e.message);
        }
    };

    // ===== Render de specs técnicas desde el DTO =====
    const renderSpecsFromDTO = (f: FichaTecnicaDTO) => {
        const term = hardwareSearch.trim().toLowerCase();

        const rows: { label: string; value: string }[] = [
            { label: "Adaptador de red", value: fmtVal(f.adaptadorRed) },
            { label: "Chipset", value: fmtVal(f.chipset) },
            { label: "CPU nombre", value: fmtVal(f.cpuNombre) },
            { label: "CPU núcleos", value: fmtVal(f.cpuNucleos) },
            { label: "CPU lógicos", value: fmtVal(f.cpuLogicos) },
            { label: "GPU nombre", value: fmtVal(f.gpuNombre) },
            { label: "RAM capacidad (GB)", value: fmtVal(f.ramCapacidadGb) },
            { label: "RAM frecuencia (MHz)", value: fmtVal(f.ramFrecuenciaMhz) },
            { label: "RAM tecnología", value: fmtVal(f.ramTecnologiaModulo) },
            { label: "RAM tipo", value: fmtVal(f.ramTipo) },
            { label: "Disco modelo", value: fmtVal(f.discoModelo) },
            { label: "Disco N° serie", value: fmtVal(f.discoNumeroSerie) },
            { label: "Disco tipo", value: fmtVal(f.discoTipo) },
            { label: "Disco capacidad (MB)", value: fmtVal(f.discoCapacidadMb) },
            { label: "Disco capacidad (str)", value: fmtVal(f.discoCapacidadStr) },
            { label: "Disco RPM", value: fmtVal(f.discoRpm) },
            { label: "Placa madre", value: fmtVal(f.mainboardModelo) },
            { label: "MAC Address", value: fmtVal(f.macAddress) },
            { label: "SO descripción", value: fmtVal(f.soDescripcion) },
            { label: "BIOS fabricante", value: fmtVal(f.biosFabricante) },
            { label: "BIOS versión", value: fmtVal(f.biosVersion) },
            { label: "BIOS fecha", value: fmtVal(f.biosFechaStr) },
            { label: "UEFI capaz", value: fmtBool(f.biosEsUefiCapaz) },
            { label: "Arranque UEFI", value: fmtBool(f.arranqueUefiPresente) },
            { label: "Secure Boot activo", value: fmtBool(f.secureBootActivo) },
            { label: "WiFi link actual", value: fmtVal(f.wifiLinkSpeedActual) },
            { label: "WiFi link máx.", value: fmtVal(f.wifiLinkSpeedMax) },
        ];

        const filtered = rows.filter(
            (r) =>
                r.label.toLowerCase().includes(term) ||
                r.value.toLowerCase().includes(term)
        );

        if (filtered.length === 0) {
            return (
                <div className="text-gray-500 text-sm">
                    No se encontraron coincidencias con el filtro.
                </div>
            );
        }

        return (
            <div className="border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left w-2/5">Campo</th>
                            <th className="px-3 py-2 text-left">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, idx) => (
                            <tr key={idx} className="border-t">
                                <td className="px-3 py-2 font-medium">{row.label}</td>
                                <td className="px-3 py-2 break-words">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
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
                            onDoubleClick={() => abrirDetalle(ficha.id)}
                            className="transition hover:shadow-md cursor-pointer"
                        >
                            <CardHeader>
                                <CardTitle>Ficha #{ficha.id}</CardTitle>
                                <CardDescription>
                                    <div className="text-sm flex flex-col gap-1 mt-1 text-gray-700">
                                        <div>
                                            <span className="font-semibold">Técnico: </span>
                                            {ficha.tecnicoId}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Equipo ID: </span>
                                            {ficha.equipoId}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Orden de trabajo: </span>
                                            {ficha.ordenTrabajoId}
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
            {detalle && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-[90vw] max-w-6xl max-h-[90vh] p-6 relative flex flex-col overflow-y-auto">
                        <button
                            onClick={() => setDetalle(null)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ✕
                        </button>

                        <div className="flex justify-between items-center mb-2 pr-10">
                            <h2 className="text-xl font-bold">
                                Ficha #{detalle.id} – Equipo {detalle.equipoId}
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowXml(true)}
                                    className="flex items-center gap-2"
                                >
                                    <FileUp className="h-4 w-4" /> Cargar XML del equipo
                                </Button>

                                {/* Dejamos este botón para futuras imágenes, aunque el DTO no las devuelve */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowUpload((p) => !p)}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />{" "}
                                    {showUpload ? "Cerrar carga" : "Cargar nuevas imágenes"}
                                </Button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Técnico: <span className="font-semibold">{detalle.tecnicoId}</span>
                            <br />
                            Equipo ID: {detalle.equipoId} <br />
                            Orden de trabajo ID: {detalle.ordenTrabajoId}
                        </p>

                        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                            {/* izquierda: specs */}
                            <div className="lg:basis-3/5 flex flex-col gap-3 min-h-[320px]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">Especificaciones:</h3>
                                    <Input
                                        placeholder="Buscar en especificaciones..."
                                        value={hardwareSearch}
                                        onChange={(e) => setHardwareSearch(e.target.value)}
                                        className="w-60 h-8 text-sm"
                                    />
                                </div>
                                {renderSpecsFromDTO(detalle)}
                            </div>

                            {/* derecha: placeholder para imágenes / futuro */}
                            <div className="lg:basis-2/5 flex flex-col gap-3 min-h-[320px]">
                                <h3 className="text-sm font-semibold">Imágenes registradas:</h3>
                                <div className="flex-1 max-h-[320px] overflow-y-auto">
                                    <div className="text-gray-400 text-sm">
                                        La visualización de imágenes se implementará cuando el
                                        backend exponga las rutas en el DTO.
                                    </div>
                                </div>

                                {showUpload && (
                                    <div className="border-t pt-3">
                                        <div className="text-xs text-gray-500 mb-1">
                                            Panel de carga de imágenes pendiente de integración con
                                            backend.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="text-sm font-medium">Observaciones:</label>
                            <textarea
                                value={editObservaciones}
                                onChange={(e) => setEditObservaciones(e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1 min-h-[120px]"
                            />
                            <Button
                                onClick={guardarObservaciones}
                                className="mt-2 flex items-center gap-2"
                            >
                                💾 Guardar observaciones
                            </Button>
                        </div>
                    </div>

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
                                <XmlUploader equipoId={detalle.equipoId ?? detalle.id} />
                            </div>
                        </div>
                    )}

                    {/* Modal imagen ampliada (placeholder, por si luego se usa) */}
                    {selectedImg && (
                        <div
                            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm"
                            onClick={() => setSelectedImg(null)}
                        >
                            <div className="relative max-w-5xl max-h-[90vh]">
                                <button
                                    onClick={() => setSelectedImg(null)}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <img
                                    src={selectedImg}
                                    alt="Vista ampliada"
                                    className="rounded-lg shadow-lg max-h-[90vh] object-contain"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
