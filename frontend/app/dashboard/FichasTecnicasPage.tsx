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
} from "lucide-react";
import FichaTecnicaForm from "./FichaTecnicaForm";

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
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // ===== helper para tabla de hardware =====
    const renderHardwareTable = (data: any) => {
        if (!data) {
            return <div className="text-sm text-gray-400">Sin datos de hardware.</div>;
        }

        if (Array.isArray(data)) {
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
                            {data.map((item, idx) => (
                                <tr key={idx} className="border-t">
                                    <td className="px-3 py-2 align-top">{idx + 1}</td>
                                    <td className="px-3 py-2 align-top break-words">
                                        {typeof item === "object" ? JSON.stringify(item) : String(item)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (typeof data === "object") {
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
                            {Object.entries(data).map(([key, value]) => (
                                <tr key={key} className="border-t">
                                    <td className="px-3 py-2 align-top font-medium break-words">
                                        {key}
                                    </td>
                                    <td className="px-3 py-2 align-top break-words">
                                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                    </td>
                                </tr>
                            ))}
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
            setNewFiles([]); // limpiar previews por si vienen de otra ficha
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

    // ===== subir imágenes nuevas =====
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
            // si quieres ver lo que devolvió el back:
            // const data = await res.json();
            setNewFiles([]);
            await fetchFichas();
            // 👇 cerrar modal al terminar
            setDetalle(null);
            alert("📸 Imágenes agregadas correctamente");
        } catch (e: any) {
            alert("❌ " + e.message);
        }
    };

    // ===== render =====
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Fichas Técnicas</h1>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Nueva Ficha Técnica
                </Button>
            </div>

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
                                <CardTitle className="flex items-center justify-between">
                                    <span>Ficha #{ficha.id}</span>
                                </CardTitle>
                                <CardDescription>
                                    <div className="text-sm flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <User2 className="h-4 w-4" />{" "}
                                            {ficha.tecnicoNombre ||
                                                ficha.tecnico?.nombre ||
                                                "Técnico desconocido"}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Laptop2 className="h-4 w-4" />{" "}
                                            {ficha.modelo || ficha.equipo?.modelo || "Equipo desconocido"}
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
                                {ficha.imagenes && ficha.imagenes.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-1">
                                        {ficha.imagenes.slice(0, 3).map((img: any, idx: number) => (
                                            <img
                                                key={idx}
                                                src={`http://localhost:8080${img}`}
                                                alt="img"
                                                className="h-20 w-full object-cover rounded"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm italic">Sin imágenes</div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* modal crear */}
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

            {/* modal detalle grande */}
            {detalle && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-[90vw] h-[90vh] max-w-6xl p-6 relative flex flex-col overflow-y-auto">
                        <button
                            onClick={() => setDetalle(null)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold mb-2">Ficha #{detalle.id}</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Técnico: {detalle.tecnicoNombre || "Desconocido"} <br />
                            Equipo: {detalle.modelo || "Desconocido"}{" "}
                            {detalle.numeroSerie ? `(${detalle.numeroSerie})` : ""}
                        </p>

                        {/* fila superior: tabla (más ancha) + imágenes */}
                        <div className="flex flex-col lg:flex-row gap-5">
                            {/* tabla más ancha */}
                            <div className="lg:basis-3/5 flex flex-col gap-3">
                                <h3 className="text-sm font-semibold">Hardware detectado (JSON):</h3>
                                {renderHardwareTable(detalle.hardwareJson)}
                            </div>

                            {/* imágenes arriba de observaciones */}
                            <div className="lg:basis-2/5 flex flex-col gap-3">
                                <h3 className="text-sm font-semibold">Imágenes registradas:</h3>
                                {detalle.imagenes?.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
                                        {detalle.imagenes.map((img: any, idx: number) => (
                                            <img
                                                key={idx}
                                                src={`http://localhost:8080${img}`}
                                                alt="img"
                                                className="h-28 w-full object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => setSelectedImg(`http://localhost:8080${img}`)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm">Sin imágenes</div>
                                )}

                                {/* PREVIEW de las nuevas imágenes seleccionadas */}
                                {newFiles.length > 0 && (
                                    <div>
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
                                    onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                                />
                                <Button
                                    onClick={subirMasImagenes}
                                    disabled={newFiles.length === 0}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" /> Subir nuevas imágenes
                                </Button>
                            </div>
                        </div>

                        {/* observaciones abajo, a todo el ancho */}
                        <div className="mt-5">
                            <label className="text-sm font-medium">Observaciones:</label>
                            <textarea
                                value={editObservaciones}
                                onChange={(e) => setEditObservaciones(e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1 min-h-[120px]"
                            />
                            <Button onClick={guardarObservaciones} className="mt-2 flex items-center gap-2">
                                💾 Guardar observaciones
                            </Button>
                        </div>
                    </div>

                    {/* modal imagen ampliada */}
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
