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
    User2,
    Laptop2,
    Upload,
    X,
    FileUp,
} from "lucide-react";
import FichaTecnicaForm from "./FichaTecnicaForm";
import XmlUploader from "./XmlUploader";

const API_BASE = "http://localhost:8080/api/fichas";
const buildUrl = (p: string = "") => `${API_BASE}${p}`;

export default function FichasTecnicasPage() {
    const [fichas, setFichas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [detalle, setDetalle] = useState<any | null>(null);
    const [editObservaciones, setEditObservaciones] = useState("");
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const [hardwareSearch, setHardwareSearch] = useState("");
    const [showXml, setShowXml] = useState(false);
    const [brokenImgs, setBrokenImgs] = useState<string[]>([]);
    const [showUpload, setShowUpload] = useState(false);

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // ===== helper tabla de hardware =====
    const renderHardwareTable = (data: any, searchTerm: string = "") => {
        if (!data) {
            return <div className="text-sm text-gray-400">Sin datos de hardware.</div>;
        }

        const term = searchTerm.trim().toLowerCase();

        if (Array.isArray(data)) {
            const filtered = data.filter((item) =>
                JSON.stringify(item).toLowerCase().includes(term)
            );

            return (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left">#</th>
                                <th className="px-3 py-2 text-left">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="text-center text-gray-500 py-2">
                                        No se encontraron coincidencias.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="px-3 py-2">{idx + 1}</td>
                                        <td className="px-3 py-2 break-words">
                                            {typeof item === "object"
                                                ? JSON.stringify(item)
                                                : String(item)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (typeof data === "object") {
            const entries = Object.entries(data).filter(([key, value]) => {
                const valStr =
                    typeof value === "object" ? JSON.stringify(value) : String(value);
                return (
                    key.toLowerCase().includes(term) ||
                    valStr.toLowerCase().includes(term)
                );
            });

            return (
                <div className="border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left w-2/5">Clave</th>
                                <th className="px-3 py-2 text-left">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="text-center text-gray-500 py-2">
                                        No se encontraron coincidencias.
                                    </td>
                                </tr>
                            ) : (
                                entries.map(([key, value]) => (
                                    <tr key={key} className="border-t">
                                        <td className="px-3 py-2 font-medium">{key}</td>
                                        <td className="px-3 py-2 break-words">
                                            {typeof value === "object"
                                                ? JSON.stringify(value)
                                                : String(value)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            );
        }

        return <div className="text-sm">{String(data)}</div>;
    };

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
            const data = await res.json();
            setDetalle(data);
            setEditObservaciones(data.observaciones || "");
            setShowForm(false);
            setNewFiles([]);
            setBrokenImgs([]); // limpiar errores previos
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

    const subirMasImagenes = async () => {
        if (!detalle || newFiles.length === 0) return;
        try {
            const formData = new FormData();
            newFiles.forEach((f) => formData.append("files", f));
            const res = await fetch(buildUrl(`/${detalle.id}/uploadImg`), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Error subiendo imágenes");
            setNewFiles([]);
            await fetchFichas();
            setDetalle(null);
            alert("📸 Imágenes agregadas correctamente");
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
                    {fichas.map((ficha) => {
                        // 🆕 filtramos las imágenes vacías/espacios
                        const thumbs =
                            (ficha.imagenes || []).filter(
                                (img: string) => img && img.trim() !== ""
                            ) || [];

                        return (
                            <Card
                                key={ficha.id}
                                onDoubleClick={() => abrirDetalle(ficha.id)}
                                className="transition hover:shadow-md cursor-pointer"
                            >
                                <CardHeader>
                                    <CardTitle>Ficha #{ficha.id}</CardTitle>
                                    <CardDescription>
                                        <div className="text-sm flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <User2 className="h-4 w-4" />{" "}
                                                {ficha.tecnicoNombre || "Técnico desconocido"}
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Laptop2 className="h-4 w-4" />{" "}
                                                {ficha.modelo || "Equipo desconocido"}
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                <CalendarDays className="h-4 w-4" />{" "}
                                                {ficha.fechaCreacion
                                                    ? new Date(ficha.fechaCreacion).toLocaleString()
                                                    : ""}
                                            </div>
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {thumbs.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-1">
                                            {thumbs.slice(0, 3).map((img: string, idx: number) => (
                                                <img
                                                    key={idx}
                                                    src={`http://localhost:8080${img}`}
                                                    alt="img"
                                                    className="h-20 w-full object-cover rounded"
                                                    onError={(e) => {
                                                        // si una en la lista principal falla, la quitamos visualmente
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm italic">
                                            Imágenes aún no cargadas
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
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
                            <h2 className="text-xl font-bold">Ficha #{detalle.id}</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowXml(true)}
                                    className="flex items-center gap-2"
                                >
                                    <FileUp className="h-4 w-4" /> Cargar XML del equipo
                                </Button>
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
                            Técnico: {detalle.tecnicoNombre || "Desconocido"} <br />
                            Equipo: {detalle.modelo || "Desconocido"}{" "}
                            {detalle.numeroSerie ? `(${detalle.numeroSerie})` : ""}
                            <br />
                            Cliente: {detalle.clienteNombre || "Desconocido"} ({detalle.clienteCedula})
                        </p>

                        {/* 🔽 las dos columnas alineadas en altura */}
                        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                            {/* izquierda */}
                            <div className="lg:basis-3/5 flex flex-col gap-3 min-h-[320px]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">Especificaciones detectadas:</h3>
                                    <Input
                                        placeholder="Buscar en hardware..."
                                        value={hardwareSearch}
                                        onChange={(e) => setHardwareSearch(e.target.value)}
                                        className="w-60 h-8 text-sm"
                                    />
                                </div>
                                {/* tu tabla ya tiene max-h */}
                                {renderHardwareTable(detalle.hardwareJson, hardwareSearch)}
                            </div>

                            {/* derecha */}
                            <div className="lg:basis-2/5 flex flex-col gap-3 min-h-[320px]">
                                <h3 className="text-sm font-semibold">Imágenes registradas:</h3>

                                {/* 🟣 contenedor que iguala la altura y hace scroll */}
                                <div className="flex-1 max-h-[320px] overflow-y-auto">
                                    {detalle.imagenes?.length > 0 ? (
                                        (() => {
                                            const validImgs = detalle.imagenes.filter(
                                                (img: string) => !brokenImgs.includes(img)
                                            );
                                            return validImgs.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {validImgs.map((img: any, idx: number) => (
                                                        <img
                                                            key={idx}
                                                            src={`http://localhost:8080${img}`}
                                                            alt="img"
                                                            className="h-28 w-full object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() =>
                                                                setSelectedImg(`http://localhost:8080${img}`)
                                                            }
                                                            onError={() =>
                                                                setBrokenImgs((prev) =>
                                                                    prev.includes(img) ? prev : [...prev, img]
                                                                )
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 text-sm">
                                                    Imágenes no encontradas.
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="text-gray-400 text-sm">Sin imágenes</div>
                                    )}
                                </div>

                                {/* panel de subida ocultable */}
                                {showUpload && (
                                    <div className="border-t pt-3">
                                        {newFiles.length > 0 && (
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-500 mb-1">
                                                    Imágenes nuevas (previsualización):
                                                </p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {newFiles.map((file, i) => (
                                                        <img
                                                            key={i}
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="h-20 w-full object-cover rounded border"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) =>
                                                setNewFiles(Array.from(e.target.files || []))
                                            }
                                        />
                                        <Button
                                            onClick={subirMasImagenes}
                                            disabled={newFiles.length === 0}
                                            className="flex items-center gap-2 mt-2"
                                        >
                                            <Upload className="h-4 w-4" /> Subir imágenes seleccionadas
                                        </Button>
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
                    {/* === MODAL DE XML === */}
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

