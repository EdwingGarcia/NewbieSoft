"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
    CalendarDays,
    Upload,
    X,
    FileText,
    Plus,
} from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
const API_BASE = "http://localhost:8080/api/ordenes";
const buildUrl = (p: string = "") => `${API_BASE}${p}`;

/* ===== DTOs ===== */

interface ImagenDTO {
    id: number;
    ruta: string;
    categoria: string;
    descripcion: string | null;
    fechaSubida: string;
}

/** DTO que devuelve GET /api/ordenes (lista) */
interface OrdenTrabajoListaDTO {
    id: number;
    numeroOrden: string;
    estado: string | null;

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

/** DTO que devuelve GET /api/ordenes/{id}/detalle */
interface OrdenTrabajoDetalleDTO extends OrdenTrabajoListaDTO {
    ordenId: number;
    diagnosticoTrabajo?: string | null;
    observacionesRecomendaciones?: string | null;
    imagenes?: ImagenDTO[];
}

/** Payload para crear OT */
interface CrearOrdenPayload {
    clienteCedula: string;
    tecnicoCedula: string;
    equipoId: number;
    medioContacto: string;
    contrasenaEquipo: string;
    accesorios: string;
    problemaReportado: string;
    observacionesIngreso: string;
}

/** Estado del form (equipoId como string para el input) */
interface CrearOrdenFormState {
    clienteCedula: string;
    tecnicoCedula: string;
    equipoId: string;
    medioContacto: string;
    contrasenaEquipo: string;
    accesorios: string;
    problemaReportado: string;
    observacionesIngreso: string;
}

export default function OrdenesTrabajoPage() {
    const router = useRouter();

    const [ordenes, setOrdenes] = useState<OrdenTrabajoListaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [detalle, setDetalle] = useState<OrdenTrabajoDetalleDTO | null>(null);
    const [imagenesDetalle, setImagenesDetalle] = useState<ImagenDTO[]>([]);

    const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
    const [categoriaImg, setCategoriaImg] = useState<string>("INGRESO");

    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const [imgFilterCategoria, setImgFilterCategoria] = useState<string>("");

    // === CREAR OT ===
    const [showCrear, setShowCrear] = useState(false);
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
    });

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fmt = (v: unknown) =>
        v === null || v === undefined || v === "" ? "-" : String(v);

    const fmtFecha = (iso?: string | null) => {
        if (!iso) return "-";
        return new Date(iso).toLocaleString();
    };

    /* ===== GET lista de órdenes ===== */
    const fetchOrdenes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(buildUrl(""), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(
                    `Error al cargar órdenes de trabajo (HTTP ${res.status})`
                );
            }
            const data: OrdenTrabajoListaDTO[] = await res.json();
            setOrdenes(data);
        } catch (e: any) {
            setError(e.message ?? "Error al cargar órdenes de trabajo");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrdenes();
    }, [fetchOrdenes]);

    /* ===== GET imágenes por orden ===== */
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

                if (!res.ok) {
                    throw new Error(
                        `Error al cargar imágenes de la orden (HTTP ${res.status})`
                    );
                }

                const data: ImagenDTO[] = await res.json();
                setImagenesDetalle(data);
            } catch (e) {
                console.error(e);
                setImagenesDetalle([]);
            }
        },
        [token]
    );

    /* ===== GET detalle ===== */
    const abrirDetalle = async (id: number) => {
        try {
            setError(null);
            const res = await fetch(buildUrl(`/${id}/detalle`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(
                    `Error al cargar detalles de la orden (HTTP ${res.status})`
                );
            }
            const data: OrdenTrabajoDetalleDTO = await res.json();
            setDetalle(data);
            setImagenesNuevas([]);
            setSelectedImg(null);
            setImgFilterCategoria("");

            await fetchImagenes(id);
        } catch (e: any) {
            setError(e.message ?? "Error al cargar detalles de la orden");
        }
    };

    /* ===== Subir imágenes a la OT ===== */
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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error(
                    `Error ${res.status} subiendo imágenes de la orden`
                );
            }

            alert("📸 Imágenes subidas correctamente");
            setImagenesNuevas([]);

            await fetchImagenes(detalle.ordenId);
        } catch (e: any) {
            alert("❌ " + (e.message ?? "Error subiendo imágenes"));
        }
    };

    /* ===== Navegar a Fichas Técnicas ===== */
    const irAFichaTecnica = (ordenId: number, equipoId: number) => {
        router.push(
            `/dashboard/fichas?ordenTrabajoId=${ordenId}&equipoId=${equipoId}`
        );
    };

    /* ===== Handlers formulario crear OT ===== */
    const handleCrearChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormCrear((prev) => ({
            ...prev,
            [name]: value,
        }));
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
        });
    };

    const crearOrden = async () => {
        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        // Validaciones mínimas
        if (!formCrear.clienteCedula.trim()) {
            alert("La cédula del cliente es obligatoria");
            return;
        }
        if (!formCrear.equipoId.trim() || isNaN(Number(formCrear.equipoId))) {
            alert("El equipoId debe ser un número válido");
            return;
        }
        if (!formCrear.problemaReportado.trim()) {
            alert("El problema reportado es obligatorio");
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
        };

        try {
            setCrearLoading(true);
            const res = await fetch(buildUrl(""), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(
                    `Error creando la orden de trabajo (HTTP ${res.status})`
                );
            }

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

    /* ===== RENDER ===== */
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>

                <Button
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setShowCrear((prev) => !prev)}
                >
                    <Plus className="h-4 w-4" />
                    {showCrear ? "Cerrar formulario" : "Nueva OT"}
                </Button>
            </div>

            {/* FORMULARIO CREAR OT */}
            {showCrear && (
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Crear nueva Orden de Trabajo</CardTitle>
                        <CardDescription>
                            Completa los datos de ingreso del equipo para generar la OT.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Cédula cliente *
                                </label>
                                <Input
                                    name="clienteCedula"
                                    value={formCrear.clienteCedula}
                                    onChange={handleCrearChange}
                                    placeholder="1723..."
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Cédula técnico
                                </label>
                                <Input
                                    name="tecnicoCedula"
                                    value={formCrear.tecnicoCedula}
                                    onChange={handleCrearChange}
                                    placeholder="1723..."
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    ID equipo *
                                </label>
                                <Input
                                    name="equipoId"
                                    value={formCrear.equipoId}
                                    onChange={handleCrearChange}
                                    placeholder="1"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Medio de contacto
                                </label>
                                <Input
                                    name="medioContacto"
                                    value={formCrear.medioContacto}
                                    onChange={handleCrearChange}
                                    placeholder="WhatsApp, llamada, correo..."
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Contraseña equipo
                                </label>
                                <Input
                                    name="contrasenaEquipo"
                                    value={formCrear.contrasenaEquipo}
                                    onChange={handleCrearChange}
                                    placeholder="***"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Accesorios
                                </label>
                                <Input
                                    name="accesorios"
                                    value={formCrear.accesorios}
                                    onChange={handleCrearChange}
                                    placeholder="Cargador, mouse..."
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Problema reportado *
                                </label>
                                <textarea
                                    name="problemaReportado"
                                    value={formCrear.problemaReportado}
                                    onChange={handleCrearChange}
                                    placeholder="Descripción del problema..."
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Observaciones de ingreso
                                </label>
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

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
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
                                className="flex items-center gap-2"
                            >
                                {crearLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Guardar OT
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                </div>
            ) : ordenes.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                    No hay órdenes de trabajo registradas.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ordenes.map((ot) => (
                        <Card
                            key={ot.id}
                            onDoubleClick={() => abrirDetalle(ot.id)}
                            className="transition hover:shadow-md cursor-pointer"
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{ot.numeroOrden}</span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                        {fmt(ot.estado)}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    <div className="text-sm flex flex-col gap-1 mt-1 text-gray-700">
                                        <div>
                                            <span className="font-semibold">Cliente: </span>
                                            {fmt(ot.clienteNombre)}{" "}
                                            {ot.clienteCedula
                                                ? `(${ot.clienteCedula})`
                                                : ""}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Técnico: </span>
                                            {fmt(ot.tecnicoNombre) ||
                                                fmt(ot.tecnicoCedula)}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Equipo: </span>
                                            {fmt(ot.equipoModelo)}{" "}
                                            {ot.equipoHostname
                                                ? `(${ot.equipoHostname})`
                                                : ""}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                            <CalendarDays className="h-4 w-4" />
                                            {fmtFecha(ot.fechaHoraIngreso)}
                                        </div>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-xs text_gray-600 line-clamp-3">
                                    <span className="font-semibold">Problema: </span>
                                    {fmt(ot.problemaReportado)}
                                </div>
                                <div className="flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            irAFichaTecnica(ot.id, ot.equipoId)
                                        }
                                    >
                                        <FileText className="h-4 w-4" /> Ficha técnica
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* MODAL DETALLE */}
            {detalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    {/* Contenedor principal del modal */}
                    <div className="relative mx-4 w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        {/* Botón cerrar */}
                        <button
                            onClick={() => {
                                setDetalle(null);
                                setImagenesDetalle([]);
                                setSelectedImg(null);
                            }}
                            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* HEADER */}
                        <header className="flex flex-col gap-3 border-b border-white/20 px-6 py-4 pr-12 bg-slate-900/90">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-white leading-tight">
                                        Orden #{detalle.numeroOrden} · Equipo{" "}
                                        <span className="font-bold">
                                            {detalle.equipoModelo ?? detalle.equipoId}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-white/80">
                                        Cliente:{" "}
                                        <span className="font-medium text-white">
                                            {fmt(detalle.clienteNombre)}
                                        </span>{" "}
                                        {detalle.clienteCedula ? `(${detalle.clienteCedula})` : ""}{" "}
                                        · Técnico:{" "}
                                        <span className="font-medium text-white">
                                            {fmt(detalle.tecnicoNombre) ||
                                                fmt(detalle.tecnicoCedula)}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                                        Estado: {fmt(detalle.estado)}
                                    </span>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 text-white border border-white/40 bg-transparent hover:bg-white/20 shadow-none"
                                        onClick={() =>
                                            irAFichaTecnica(detalle.ordenId, detalle.equipoId)
                                        }
                                    >
                                        <FileText className="h-4 w-4 text-white" /> Ir a Ficha Técnica
                                    </Button>

                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 text-[11px] text-white/70">
                                <span>
                                    <span className="font-semibold text-white">Ingreso:</span>{" "}
                                    {fmtFecha(detalle.fechaHoraIngreso)}
                                </span>
                                <span className="hidden sm:inline text-white/40">·</span>
                                <span>
                                    <span className="font-semibold text-white">Entrega:</span>{" "}
                                    {fmtFecha(detalle.fechaHoraEntrega)}
                                </span>
                            </div>
                        </header>


                        {/* CONTENIDO SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                {/* IZQUIERDA: Info & observaciones */}
                                <div className="flex flex-col gap-4">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                            Problema reportado
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                                            {fmt(detalle.problemaReportado)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                            Observaciones de ingreso
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                                            {fmt(detalle.observacionesIngreso)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                            Diagnóstico / trabajo realizado
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                                            {fmt(detalle.diagnosticoTrabajo)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                            Observaciones / recomendaciones
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                                            {fmt(detalle.observacionesRecomendaciones)}
                                        </p>
                                    </div>
                                </div>

                                {/* DERECHA: Imágenes + subida */}
                                <div className="flex flex-col gap-4">
                                    {/* Título y pequeño filtro por categoría (si lo usas) */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                                Imágenes registradas
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Haz clic en una miniatura para ampliarla.
                                            </p>
                                        </div>
                                    </div>

                                    {/* LISTA DE IMÁGENES */}
                                    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/60 p-2 max-h-[320px] overflow-y-auto">
                                        {imagenesDetalle && imagenesDetalle.length > 0 ? (
                                            (() => {
                                                const term = imgFilterCategoria.trim();

                                                const categorias = Array.from(
                                                    new Set(
                                                        imagenesDetalle.map(
                                                            (img) => img.categoria
                                                        )
                                                    )
                                                )
                                                    .sort()
                                                    .filter((cat) =>
                                                        term
                                                            ? cat
                                                                .toUpperCase()
                                                                .includes(term)
                                                            : true
                                                    );

                                                if (categorias.length === 0) {
                                                    return (
                                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                            No hay imágenes para ese filtro.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="space-y-4">
                                                        {categorias.map((cat) => {
                                                            const imgsCat =
                                                                imagenesDetalle.filter(
                                                                    (img) =>
                                                                        img.categoria === cat
                                                                );
                                                            if (imgsCat.length === 0)
                                                                return null;

                                                            return (
                                                                <div
                                                                    key={cat}
                                                                    className="space-y-1"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="rounded-full bg-slate-900 text-[10px] font-semibold uppercase tracking-wide text-white px-2 py-0.5">
                                                                            {cat}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {imgsCat.length}{" "}
                                                                            imagen
                                                                            {imgsCat.length >
                                                                                1
                                                                                ? "es"
                                                                                : ""}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                                        {imgsCat.map(
                                                                            (img) => (
                                                                                <button
                                                                                    key={
                                                                                        img.id
                                                                                    }
                                                                                    type="button"
                                                                                    className="group relative w-28 h-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                                                                    onClick={() =>
                                                                                        setSelectedImg(
                                                                                            `http://localhost:8080${img.ruta}`
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <img
                                                                                        src={`http://localhost:8080${img.ruta}`}
                                                                                        alt={
                                                                                            img.descripcion ||
                                                                                            "Imagen OT"
                                                                                        }
                                                                                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                                                                        onError={(
                                                                                            e
                                                                                        ) => {
                                                                                            e.currentTarget.style.display =
                                                                                                "none";
                                                                                        }}
                                                                                    />
                                                                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-1.5 pb-1.5 pt-3">
                                                                                        <p className="truncate text-[9px] text-slate-100">
                                                                                            {new Date(
                                                                                                img.fechaSubida
                                                                                            ).toLocaleString()}
                                                                                        </p>
                                                                                    </div>
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                No hay imágenes registradas.
                                            </div>
                                        )}
                                    </div>

                                    {/* PANEL SUBIR IMÁGENES */}
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 space-y-2">
                                        <p className="text-[11px] font-medium text-slate-700 flex items-center gap-2">
                                            <Upload className="h-3 w-3" />
                                            Subir nuevas imágenes
                                        </p>

                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Select
                                                value={categoriaImg}
                                                onValueChange={(value) => setCategoriaImg(value)}
                                            >
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
                                                onChange={(e) =>
                                                    setImagenesNuevas(
                                                        Array.from(e.target.files || [])
                                                    )
                                                }
                                                className="h-9 text-xs file:text-xs"
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={subirImagenes}
                                                disabled={imagenesNuevas.length === 0}
                                                className="flex items-center gap-2 h-9 text-xs"
                                            >
                                                <Upload className="h-4 w-4" /> Subir
                                                imágenes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODAL IMAGEN AMPLIADA */}
                        {selectedImg && (
                            <div
                                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                                onClick={() => setSelectedImg(null)}
                            >
                                <div
                                    className="relative mx-4 max-w-5xl max-h-[90vh]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => setSelectedImg(null)}
                                        className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black/90 transition"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <img
                                        src={selectedImg}
                                        alt="Vista ampliada"
                                        className="max-h-[90vh] w-full rounded-xl object-contain shadow-2xl"
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
