"use client";
import { useState, useCallback, useEffect } from "react";
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
    Image as ImageIcon, // <--- Renombrado para evitar conflicto
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { MessageCircle } from "lucide-react";

import { API_BASE_URL } from "@/app/lib/api"; // <--- Importar configuración centralizada

// Usar la variable centralizada
const API_BASE = `${API_BASE_URL}/api/fichas`;
const buildUrl = (p: string) => `${API_BASE}${p}`;


export default function FichaTecnicaForm() {
    const router = useRouter();

    const [equipoId, setEquipoId] = useState("");
    const [cedulaTecnico, setCedulaTecnico] = useState("");
    const [ordenTrabajoId, setOrdenTrabajoId] = useState(""); // 🆕 OT
    const [observaciones, setObservaciones] = useState("");

    const [fichaId, setFichaId] = useState<number | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    // Listas para los combobox
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [ordenes, setOrdenes] = useState<any[]>([]);


    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Cargar técnicos, clientes y órdenes de trabajo
    const loadCombos = async () => {
        if (!token) return;

        try {
            const [resUsuarios, resOrdenes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/usuarios`, { // <--- Usar variable centralizada
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/ordenes`, { // <--- Usar variable centralizada
                    headers: { Authorization: `Bearer ${token}` }
                }),
            ]);

            const usuarios = resUsuarios.ok ? await resUsuarios.json() : [];
            const ordenes = resOrdenes.ok ? await resOrdenes.json() : [];

            // Filtrar clientes y técnicos
            setTecnicos(usuarios.filter((u: any) => u.rol?.nombre === "ROLE_TECNICO"));
            setClientes(usuarios.filter((u: any) => u.rol?.nombre === "ROLE_CLIENTE"));

            setOrdenes(ordenes);
        } catch (err) {
            console.error("Error cargando combos:", err);
        }
    };

    useEffect(() => {
        loadCombos();
    }, []);

    /** ✨ animación de éxito */
    const animateSuccess = (message: string) => {
        setMsg(message);
        const el = document.createElement("div");
        el.className =
            "fixed inset-0 flex items-center justify-center bg-black/50 z-50";
        el.innerHTML = `
      <div class="bg-green-600 text-white px-6 py-4 rounded-lg flex items-center gap-3 shadow-lg">
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

    /** 🧱 Crear ficha técnica */
    const crearFicha = useCallback(async () => {
        if (!cedulaTecnico || !equipoId || !ordenTrabajoId) {
            setError(
                "Debe ingresar la cédula del técnico, el ID del equipo y el ID de la orden de trabajo"
            );
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                cedulaTecnico,
                equipoId,
                ordenTrabajoId, // 🆕 lo enviamos al backend
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

            if (!res.ok) {
                // si el backend devuelve texto de error, lo leemos
                const text = await res.text().catch(() => null);
                throw new Error(text || `Error ${res.status}`);
            }

            // ✅ creada correctamente
            animateSuccess("Ficha técnica creada correctamente ✅");

            // 🆕 obtenemos la última ficha para recuperar el ID real
            try {
                const listRes = await fetch(buildUrl(""), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (listRes.ok) {
                    const list = await listRes.json();
                    if (Array.isArray(list) && list.length > 0) {
                        const last = list[list.length - 1];
                        if (last?.id) {
                            setFichaId(last.id);
                        }
                    }
                }
            } catch {
                // si falla, solo no seteamos fichaId
            }
        } catch (e: any) {
            setError(e.message || "Error creando ficha técnica");
        } finally {
            setLoading(false);
        }
    }, [cedulaTecnico, equipoId, ordenTrabajoId, observaciones, token]);

    /** 🖼️ Subir imágenes */
    const subirImagenes = useCallback(async () => {
        if (!fichaId) {
            setError("Primero crea una ficha técnica (o no se pudo obtener el ID)");
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

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                throw new Error(text || `Error ${res.status}`);
            }

            setFiles([]);
            setPreviewUrls([]);
            animateSuccess("Imágenes subidas correctamente ✅");

            setTimeout(() => router.refresh(), 2000);
        } catch (e: any) {
            setError(e.message || "Error subiendo imágenes");
        } finally {
            setLoading(false);
        }
    }, [files, fichaId, token, router]);

    /** 🎨 Previsualización local */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        setFiles(selected);
        const previews = selected.map((f) => URL.createObjectURL(f));
        setPreviewUrls(previews);
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

                    <select
                        value={cedulaTecnico}
                        onChange={(e) => setCedulaTecnico(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white"
                    >
                        <option value="">Seleccione técnico</option>
                        {tecnicos.map((t) => (
                            <option key={t.cedula} value={t.cedula}>
                                {t.nombre} — {t.cedula}
                            </option>
                        ))}
                    </select>

                    <Input
                        placeholder="ID del equipo"
                        value={equipoId}
                        onChange={(e) => setEquipoId(e.target.value)}
                    />
                    <select
                        value={ordenTrabajoId}
                        onChange={(e) => setOrdenTrabajoId(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white"
                    >
                        <option value="">Seleccione orden de trabajo</option>
                        {ordenes.map((o) => (
                            <option key={o.id} value={o.id}>
                                OT #{o.id} — {o.descripcion ?? ""}
                            </option>
                        ))}
                    </select>

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

                    {msg && (
                        <p className="text-sm text-green-600 mt-2">
                            {msg}
                        </p>
                    )}
                </CardContent>
            </Card>

            {fichaId && (
                <Card>


                </Card>
            )}

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
