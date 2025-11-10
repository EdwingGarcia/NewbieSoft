"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Loader2,
    Upload,
    Image,
    Plus,
    Trash2,
    X,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api/fichas";
const buildUrl = (p: string) => `${API_BASE}${p}`;

export default function FichaTecnicaModule() {
    const router = useRouter();

    const [equipoId, setEquipoId] = useState("");
    const [cedulaTecnico, setCedulaTecnico] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [fichaId, setFichaId] = useState<number | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    /** 🧱 Crear ficha técnica */
    const crearFicha = useCallback(async () => {
        if (!cedulaTecnico || !equipoId) {
            setError("Debe ingresar la cédula del técnico y el ID del equipo");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                cedulaTecnico,
                equipoId,
                observaciones,
            });

            const res = await fetch(buildUrl(""), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);

            // ✅ ya no hay JSON; solo confirmamos éxito
            animateSuccess("Ficha técnica creada correctamente ✅");

            // opcional: podrías refrescar para ver la lista actualizada
            // router.refresh();

            // ⚙️ como el backend ya no devuelve la ficha,
            // puedes obtener el ID más reciente con un GET (si lo necesitas)
            // o mostrar mensaje de que ahora puedes subir imágenes
            setFichaId(Number(equipoId)); // temporal si tu ID coincide, sino podrías consultarlo luego
        } catch (e: any) {
            setError(e.message || "Error creando ficha técnica");
        } finally {
            setLoading(false);
        }
    }, [cedulaTecnico, equipoId, observaciones, token]);

    /** 🖼️ Subir imágenes */
    const subirImagenes = useCallback(async () => {
        if (!fichaId) {
            setError("Primero crea una ficha técnica");
            return;
        }
        if (files.length === 0) {
            setError("Selecciona una o más imágenes");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            files.forEach((f) => formData.append("files", f));

            const res = await fetch(buildUrl(`/${fichaId}/uploadImg`), {
                method: "POST",
                body: formData,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);

            // ✅ ya no hay JSON
            setFiles([]);
            setPreviewUrls([]);
            animateSuccess("Imágenes subidas correctamente ✅");

            // 🔁 Refrescar lista o navegar
            setTimeout(() => router.refresh(), 2000);
        } catch (e: any) {
            setError(e.message || "Error subiendo imágenes");
        } finally {
            setLoading(false);
        }
    }, [files, fichaId, token, router]);

    /** 🎨 Mostrar previsualización local */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        setFiles(selected);
        const previews = selected.map((f) => URL.createObjectURL(f));
        setPreviewUrls(previews);
    };

    /** ✨ Animación de éxito */
    const animateSuccess = (message: string) => {
        setMsg(message);
        const el = document.createElement("div");
        el.className =
            "fixed inset-0 flex items-center justify-center bg-black/50 z-50 animate-fade";
        el.innerHTML = `
      <div class="bg-green-600 text-white px-6 py-4 rounded-lg flex items-center gap-3 shadow-lg animate-bounce-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="text-lg font-semibold">${message}</span>
      </div>
    `;
        document.body.appendChild(el);
        setTimeout(() => {
            el.remove();
            setMsg(null);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" /> Nueva Ficha Técnica
                    </CardTitle>
                    <CardDescription>
                        Completa los datos para crear una ficha técnica.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Input
                        placeholder="Cédula del técnico"
                        value={cedulaTecnico}
                        onChange={(e) => setCedulaTecnico(e.target.value)}
                    />
                    <Input
                        placeholder="ID del equipo"
                        value={equipoId}
                        onChange={(e) => setEquipoId(e.target.value)}
                    />
                    <Input
                        placeholder="Observaciones"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                    />
                    <Button onClick={crearFicha} disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        Crear ficha técnica
                    </Button>
                </CardContent>
            </Card>

            {fichaId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="h-5 w-5" /> Subir Imágenes
                        </CardTitle>
                        <CardDescription>
                            Adjunta imágenes relacionadas con la ficha.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="max-w-md"
                        />

                        {/* 🖼️ Previsualización local */}
                        {previewUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {previewUrls.map((url, i) => (
                                    <div key={i} className="relative">
                                        <img
                                            src={url}
                                            alt={`preview-${i}`}
                                            className="h-32 w-full object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setSelectedImg(url)}
                                        />
                                        <button
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                                            onClick={() => {
                                                setFiles((prev) => prev.filter((_, x) => x !== i));
                                                setPreviewUrls((prev) =>
                                                    prev.filter((_, x) => x !== i)
                                                );
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            onClick={subirImagenes}
                            className="mt-3"
                            disabled={loading || files.length === 0}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Upload className="h-4 w-4 mr-2" />
                            )}
                            Subir imágenes
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* 🪟 Modal de imagen ampliada */}
            {selectedImg && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedImg(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setSelectedImg(null)}
                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img
                            src={selectedImg}
                            alt="Vista ampliada"
                            className="rounded-xl shadow-lg max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
