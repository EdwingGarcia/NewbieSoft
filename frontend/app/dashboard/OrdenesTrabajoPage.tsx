"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Signature } from "lucide-react";
import { FileUp, MessageCircle, X } from "lucide-react"
import ModalNotificacion from "../components/ModalNotificacion";
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

/** DTO que devuelve GET /api/ordenes/{id}/detalle */
interface OrdenTrabajoDetalleDTO extends OrdenTrabajoListaDTO {
    ordenId: number;

    diagnosticoTrabajo?: string | null;
    observacionesRecomendaciones?: string | null;
    imagenes?: ImagenDTO[];

    // 🧮 Campos económicos
    costoManoObra?: number | null;
    costoRepuestos?: number | null;
    costoOtros?: number | null;
    descuento?: number | null;
    subtotal?: number | null;
    iva?: number | null;
    total?: number | null;

    // 🛠️ Tiempos de diagnóstico / reparación
    fechaHoraInicioDiagnostico?: string | null;
    fechaHoraFinDiagnostico?: string | null;
    fechaHoraInicioReparacion?: string | null;
    fechaHoraFinReparacion?: string | null;

    // 🧾 Garantía y cierre
    esEnGarantia?: boolean | null;
    referenciaOrdenGarantia?: number | null;
    motivoCierre?: string | null;
    cerradaPor?: string | null;

    // 🔐 OTP
    otpCodigo?: string | null;
    otpValidado?: boolean | null;
    otpFechaValidacion?: string | null;
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
    tipoServicio: string;
    prioridad: string;
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
    tipoServicio: string;
    prioridad: string;
}

type Paso = 1 | 2 | 3 | 4;

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

    // === PASOS DEL FLUJO ===
    const [pasoActivo, setPasoActivo] = useState<Paso>(1);

    // === CAMPOS EDITABLES EN DETALLE ===
    const [tipoServicioEdit, setTipoServicioEdit] = useState<string>("DIAGNOSTICO");
    const [prioridadEdit, setPrioridadEdit] = useState<string>("MEDIA");
    const [estadoEdit, setEstadoEdit] = useState<string>("INGRESO");

    const [diagEdit, setDiagEdit] = useState<string>("");
    const [obsRecEdit, setObsRecEdit] = useState<string>("");

    const [costoManoObra, setCostoManoObra] = useState<number>(0);
    const [costoRepuestos, setCostoRepuestos] = useState<number>(0);
    const [costoOtros, setCostoOtros] = useState<number>(0);
    const [descuento, setDescuento] = useState<number>(0);
    const [iva, setIva] = useState<number>(0); // puedes dejar que el técnico lo ajuste o calcularlo

    const [esEnGarantia, setEsEnGarantia] = useState<boolean>(false);
    const [referenciaGarantia, setReferenciaGarantia] = useState<string>("");
    const [motivoCierre, setMotivoCierre] = useState<string>("");
    const [cerradaPor, setCerradaPor] = useState<string>("");

    const [otpCodigo, setOtpCodigo] = useState<string>("");
    const [otpValidado, setOtpValidado] = useState<boolean>(false);

    const [guardando, setGuardando] = useState(false);

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
        tipoServicio: "DIAGNOSTICO",
        prioridad: "MEDIA",
    });

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fmt = (v: unknown) =>
        v === null || v === undefined || v === "" ? "-" : String(v);

    const fmtFecha = (iso?: string | null) => {
        if (!iso) return "-";
        return new Date(iso).toLocaleString();
    };

    const fmtMoney = (n?: number | null) => {
        if (n === null || n === undefined) return "-";
        return n.toFixed(2);
    };

    const toNumber = (value: string): number =>
        value.trim() === "" || isNaN(Number(value)) ? 0 : Number(value);

    const subtotalCalculado =
        costoManoObra + costoRepuestos + costoOtros - descuento;
    const totalCalculado = subtotalCalculado + iva;

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

    /* ===== Sincronizar estados editables con detalle ===== */
    const sincronizarDetalleEditable = (data: OrdenTrabajoDetalleDTO) => {
        setTipoServicioEdit(data.tipoServicio ?? "DIAGNOSTICO");
        setPrioridadEdit(data.prioridad ?? "MEDIA");
        setEstadoEdit(data.estado ?? "INGRESO");

        setDiagEdit(data.diagnosticoTrabajo ?? "");
        setObsRecEdit(data.observacionesRecomendaciones ?? "");

        setCostoManoObra(data.costoManoObra ?? 0);
        setCostoRepuestos(data.costoRepuestos ?? 0);
        setCostoOtros(data.costoOtros ?? 0);
        setDescuento(data.descuento ?? 0);
        setIva(data.iva ?? 0);

        setEsEnGarantia(!!data.esEnGarantia);
        setReferenciaGarantia(
            data.referenciaOrdenGarantia != null
                ? String(data.referenciaOrdenGarantia)
                : ""
        );
        setMotivoCierre(data.motivoCierre ?? "");
        setCerradaPor(data.cerradaPor ?? "");

        setOtpCodigo(data.otpCodigo ?? "");
        setOtpValidado(!!data.otpValidado);

        setPasoActivo(1);
    };

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

            sincronizarDetalleEditable(data);
            await fetchImagenes(id);
        } catch (e: any) {
            setError(e.message ?? "Error al cargar detalles de la orden");
        }
    };

    /* ===== PUT /{id}/entrega – guardar todo lo editable ===== */
    const guardarCambiosOrden = async (esCierre: boolean = false) => {
        if (!detalle) return;
        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        const payload = {
            // info de servicio / estado
            tipoServicio: tipoServicioEdit,
            prioridad: prioridadEdit,
            estado: estadoEdit,

            // diagnóstico y recomendaciones
            diagnosticoTrabajo: diagEdit.trim(),
            observacionesRecomendaciones: obsRecEdit.trim(),

            // costos
            costoManoObra,
            costoRepuestos,
            costoOtros,
            descuento,
            subtotal: subtotalCalculado,
            iva,
            total: totalCalculado,

            // garantía / cierre
            esEnGarantia,
            referenciaOrdenGarantia: referenciaGarantia
                ? Number(referenciaGarantia)
                : null,
            motivoCierre: motivoCierre.trim() || null,
            cerradaPor: cerradaPor.trim() || null,

            // OTP
            otpCodigo: otpCodigo.trim() || null,
            otpValidado,
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

            if (!res.ok) {
                throw new Error(
                    `Error guardando datos de la orden (HTTP ${res.status})`
                );
            }

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

    /* ===== Cerrar OT (flujo guiado) ===== */
    const cerrarOrden = async () => {
        if (!detalle) return;

        if (!diagEdit.trim()) {
            alert("Debes registrar un diagnóstico antes de cerrar la orden.");
            setPasoActivo(2);
            return;
        }

        if (totalCalculado <= 0 && !esEnGarantia) {
            const seguir = window.confirm(
                "El total es 0 y la orden no está marcada como garantía. ¿Cerrar igualmente?"
            );
            if (!seguir) {
                setPasoActivo(3);
                return;
            }
        }

        if (!motivoCierre.trim()) {
            alert("Debes indicar un motivo de cierre.");
            setPasoActivo(4);
            return;
        }

        if (!otpValidado) {
            const seguir = window.confirm(
                "La OTP no está marcada como validada. ¿Cerrar de todas formas?"
            );
            if (!seguir) {
                setPasoActivo(4);
                return;
            }
        }

        setEstadoEdit("CERRADA");
        await guardarCambiosOrden(true);
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

    const irAAprobacionProcedimiento = (ordenId: number) => {
        router.push(`/firma?ordenId=${ordenId}&modo=aceptacion`);
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
            tipoServicio: "DIAGNOSTICO",
            prioridad: "MEDIA",
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
            {/* HEADER PÁGINA */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Órdenes de Trabajo
                    </h1>
                    <p className="text-sm text-slate-500">
                        Gestiona los ingresos, diagnósticos, costos y cierres de cada equipo.
                    </p>
                </div>

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
                        <CardTitle className="text-lg">
                            Crear nueva Orden de Trabajo
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500">
                            Completa los datos de ingreso y clasificación del servicio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Primera fila: cliente / técnico / equipo */}
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

                        {/* Segunda fila: medio / tipo / prioridad */}
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
                                    Tipo de servicio *
                                </label>
                                <Select
                                    value={formCrear.tipoServicio}
                                    onValueChange={(value) =>
                                        setFormCrear((prev) => ({
                                            ...prev,
                                            tipoServicio: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Selecciona tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DIAGNOSTICO">
                                            Diagnóstico
                                        </SelectItem>
                                        <SelectItem value="REPARACION">
                                            Reparación
                                        </SelectItem>
                                        <SelectItem value="MANTENIMIENTO">
                                            Mantenimiento
                                        </SelectItem>
                                        <SelectItem value="FORMATEO">
                                            Formateo / SO
                                        </SelectItem>
                                        <SelectItem value="INSTALACION_SO">
                                            Instalación de SO
                                        </SelectItem>
                                        <SelectItem value="OTRO">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Prioridad *
                                </label>
                                <Select
                                    value={formCrear.prioridad}
                                    onValueChange={(value) =>
                                        setFormCrear((prev) => ({
                                            ...prev,
                                            prioridad: value,
                                        }))
                                    }
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

                        {/* Tercera fila: credenciales / accesorios */}
                        <div className="grid gap-4 md:grid-cols-3">
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
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    Accesorios
                                </label>
                                <Input
                                    name="accesorios"
                                    value={formCrear.accesorios}
                                    onChange={handleCrearChange}
                                    placeholder="Cargador, mouse, base, etc."
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Descripción problema & observaciones */}
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

                        <div className="flex justify-end gap-2 pt-2">
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

            {/* LISTA DE ÓRDENES */}
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
                                <CardTitle className="flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {ot.numeroOrden}
                                    </span>
                                    <div className="flex gap-1">
                                        {ot.tipoServicio && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 uppercase">
                                                {ot.tipoServicio}
                                            </span>
                                        )}
                                        {ot.prioridad && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase">
                                                {ot.prioridad}
                                            </span>
                                        )}
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    <div className="text-sm flex flex-col gap-1 mt-1 text-gray-700">
                                        <div>
                                            <span className="font-semibold">
                                                Cliente:{" "}
                                            </span>
                                            {fmt(ot.clienteNombre)}{" "}
                                            {ot.clienteCedula
                                                ? `(${ot.clienteCedula})`
                                                : ""}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Técnico:{" "}
                                            </span>
                                            {fmt(ot.tecnicoNombre) ||
                                                fmt(ot.tecnicoCedula)}
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                Equipo:{" "}
                                            </span>
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
                                <div className="text-xs text-gray-600 line-clamp-3">
                                    <span className="font-semibold">
                                        Problema:{" "}
                                    </span>
                                    {fmt(ot.problemaReportado)}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-slate-500">
                                        Estado:{" "}
                                        <span className="font-medium">
                                            {fmt(ot.estado)}
                                        </span>
                                    </span>
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

            {/* MODAL DETALLE – PANEL COMPLETO TÉCNICO */}
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
                                            {detalle.equipoModelo ??
                                                detalle.equipoId}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-white/80">
                                        Cliente:{" "}
                                        <span className="font-medium text-white">
                                            {fmt(detalle.clienteNombre)}
                                        </span>{" "}
                                        {detalle.clienteCedula
                                            ? `(${detalle.clienteCedula})`
                                            : ""}{" "}
                                        · Técnico:{" "}
                                        <span className="font-medium text-white">
                                            {fmt(detalle.tecnicoNombre) ||
                                                fmt(detalle.tecnicoCedula)}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={tipoServicioEdit}
                                        onValueChange={setTipoServicioEdit}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-slate-800/60 border-slate-500 text-slate-100">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DIAGNOSTICO">
                                                DIAGNOSTICO
                                            </SelectItem>
                                            <SelectItem value="REPARACION">
                                                REPARACION
                                            </SelectItem>
                                            <SelectItem value="MANTENIMIENTO">
                                                MANTENIMIENTO
                                            </SelectItem>
                                            <SelectItem value="FORMATEO">
                                                FORMATEO
                                            </SelectItem>
                                            <SelectItem value="INSTALACION_SO">
                                                INSTALACION_SO
                                            </SelectItem>
                                            <SelectItem value="OTRO">
                                                OTRO
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={prioridadEdit}
                                        onValueChange={setPrioridadEdit}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-emerald-700/40 border-emerald-400 text-emerald-50">
                                            <SelectValue placeholder="Prioridad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BAJA">BAJA</SelectItem>
                                            <SelectItem value="MEDIA">MEDIA</SelectItem>
                                            <SelectItem value="ALTA">ALTA</SelectItem>
                                            <SelectItem value="URGENTE">
                                                URGENTE
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={estadoEdit}
                                        onValueChange={setEstadoEdit}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] bg-blue-700/40 border-blue-400 text-blue-50">
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INGRESO">
                                                INGRESO
                                            </SelectItem>
                                            <SelectItem value="EN_DIAGNOSTICO">
                                                EN_DIAGNOSTICO
                                            </SelectItem>
                                            <SelectItem value="EN_REPARACION">
                                                EN_REPARACION
                                            </SelectItem>
                                            <SelectItem value="LISTA_ENTREGA">
                                                LISTA_ENTREGA
                                            </SelectItem>
                                            <SelectItem value="CERRADA">
                                                CERRADA
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {esEnGarantia && (
                                        <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-100 border border-yellow-400/60">
                                            Garantía
                                        </span>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 text-white border border-white/40 bg-transparent hover:bg-white/20 shadow-none"
                                        onClick={() =>
                                            irAFichaTecnica(
                                                detalle.ordenId,
                                                detalle.equipoId
                                            )
                                        }
                                    >
                                        <FileText className="h-4 w-4 text-white" />{" "}
                                        Ir a Ficha Técnica
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        console.log("CLICK EN APROBACION", detalle.ordenId);
                                        router.push(`/firma?ordenId=${detalle.ordenId}&modo=aceptacion`);
                                      }}
                                      className="flex items-center gap-2 border border-gray-400 text-white hover:bg-gray-700 hover:border-gray-500 active:bg-gray-500 active:text-white active:border-gray-600

                                        transition-all
                                      "
                                    >
                                    <Signature className="h-4 w-4" />
                                      Firma de Aprobación
                                    </Button>
                                    {ordenes.map((ot) => (
                                        <div key={ot.id} className="...">

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setNotifOtId(ot.id);   // ✔ AHORA SÍ EXISTE
                                                    setShowNotifModal(true);
                                                }}
                                                className="flex items-center gap-2 border border-gray-400 text-white hover:bg-gray-700 hover:border-gray-500 active:bg-gray-500 active:text-white active:border-gray-600"

                                            >
                                            <MessageCircle className="h-4 w-4" />
                                                Enviar Notificación
                                            </Button>

                                        </div>
                                    ))}


                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 text-[11px] text-white/70">
                                <span>
                                    <span className="font-semibold text-white">
                                        Ingreso:
                                    </span>{" "}
                                    {fmtFecha(detalle.fechaHoraIngreso)}
                                </span>
                                <span className="hidden sm:inline text-white/40">
                                    ·
                                </span>
                                <span>
                                    <span className="font-semibold text-white">
                                        Entrega:
                                    </span>{" "}
                                    {fmtFecha(detalle.fechaHoraEntrega)}
                                </span>
                                {detalle.medioContacto && (
                                    <>
                                        <span className="hidden sm:inline text-white/40">
                                            ·
                                        </span>
                                        <span>
                                            <span className="font-semibold text-white">
                                                Medio:
                                            </span>{" "}
                                            {detalle.medioContacto}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* STEPPER DE PASOS */}
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                {[
                                    {
                                        paso: 1,
                                        label: "1. Contexto",
                                        desc: "Datos de ingreso",
                                    },
                                    {
                                        paso: 2,
                                        label: "2. Diagnóstico",
                                        desc: "Trabajo realizado",
                                    },
                                    {
                                        paso: 3,
                                        label: "3. Costos",
                                        desc: "Valores económicos",
                                    },
                                    {
                                        paso: 4,
                                        label: "4. Cierre / OTP",
                                        desc: "Motivo y firma",
                                    },
                                ].map((p) => (
                                    <button
                                        key={p.paso}
                                        type="button"
                                        onClick={() =>
                                            setPasoActivo(p.paso as Paso)
                                        }
                                        className={`flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                                            pasoActivo === p.paso
                                                ? "border-white bg-white/20 text-white"
                                                : "border-white/30 bg-slate-800/40 text-white/70 hover:bg-white/10"
                                        }`}
                                    >
                                        <span className="text-[10px] font-semibold">
                                            {p.label}
                                        </span>
                                        <span className="hidden sm:inline text-[10px] opacity-80">
                                            {p.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </header>

                        {/* CONTENIDO SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                {/* IZQUIERDA: Pasos del flujo */}
                                <div className="flex flex-col gap-4">
                                    {/* PASO 1: CONTEXTO / INGRESO */}
                                    <div
                                        className={`rounded-xl border p-3 transition ${
                                            pasoActivo === 1
                                                ? "border-slate-400 bg-slate-50"
                                                : "border-slate-100 bg-slate-50/60"
                                        }`}
                                    >
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                                            <span>Datos de ingreso</span>
                                            <span className="text-[10px] text-slate-400">
                                                Paso 1 de 4
                                            </span>
                                        </h3>
                                        <p className="mt-2 text-xs text-slate-600">
                                            Revisa la información de entrada antes de
                                            continuar con el diagnóstico.
                                        </p>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="font-semibold text-slate-700">
                                                    Problema reportado:
                                                </span>
                                                <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                                                    {fmt(detalle.problemaReportado)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">
                                                    Observaciones de ingreso:
                                                </span>
                                                <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                                                    {fmt(detalle.observacionesIngreso)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">
                                                    Equipo:
                                                </span>
                                                <p className="mt-1 text-slate-800">
                                                    {fmt(detalle.equipoModelo)}{" "}
                                                    {detalle.equipoHostname &&
                                                        `(${detalle.equipoHostname})`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PASO 2: DIAGNÓSTICO */}
                                    <div
                                        className={`rounded-xl border p-3 transition ${
                                            pasoActivo === 2
                                                ? "border-slate-400 bg-white"
                                                : "border-slate-100 bg-white"
                                        }`}
                                    >
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                                            <span>Diagnóstico y trabajo realizado</span>
                                            <span className="text-[10px] text-slate-400">
                                                Paso 2 de 4
                                            </span>
                                        </h3>
                                        <p className="mt-2 text-xs text-slate-600">
                                            Registra tus pruebas, hallazgos y acciones
                                            realizadas.
                                        </p>

                                        <div className="mt-3 space-y-2">
                                            <label className="text-[11px] font-medium text-slate-700">
                                                Diagnóstico / trabajo realizado *
                                            </label>
                                            <textarea
                                                value={diagEdit}
                                                onChange={(e) =>
                                                    setDiagEdit(e.target.value)
                                                }
                                                placeholder="Describe el diagnóstico, pruebas realizadas y trabajo ejecutado..."
                                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[80px]"
                                            />

                                            <label className="text-[11px] font-medium text-slate-700">
                                                Observaciones / recomendaciones
                                            </label>
                                            <textarea
                                                value={obsRecEdit}
                                                onChange={(e) =>
                                                    setObsRecEdit(e.target.value)
                                                }
                                                placeholder="Notas finales para el cliente, recomendaciones de uso, próximos mantenimientos, etc."
                                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[80px]"
                                            />
                                        </div>
                                    </div>

                                    {/* PASO 3: COSTOS */}
                                    <div
                                        className={`rounded-xl border p-3 transition ${
                                            pasoActivo === 3
                                                ? "border-slate-400 bg-slate-50"
                                                : "border-slate-100 bg-slate-50/80"
                                        }`}
                                    >
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                                            <span>Costos de la orden</span>
                                            <span className="text-[10px] text-slate-400">
                                                Paso 3 de 4
                                            </span>
                                        </h3>
                                        <p className="mt-2 text-xs text-slate-600">
                                            Ingresa los valores de mano de obra,
                                            repuestos y otros conceptos.
                                        </p>

                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    Mano de obra
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={costoManoObra}
                                                    onChange={(e) =>
                                                        setCostoManoObra(
                                                            toNumber(e.target.value)
                                                        )
                                                    }
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    Repuestos
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={costoRepuestos}
                                                    onChange={(e) =>
                                                        setCostoRepuestos(
                                                            toNumber(e.target.value)
                                                        )
                                                    }
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    Otros costos
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={costoOtros}
                                                    onChange={(e) =>
                                                        setCostoOtros(
                                                            toNumber(e.target.value)
                                                        )
                                                    }
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    Descuento
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={descuento}
                                                    onChange={(e) =>
                                                        setDescuento(
                                                            toNumber(e.target.value)
                                                        )
                                                    }
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    IVA
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={iva}
                                                    onChange={(e) =>
                                                        setIva(
                                                            toNumber(e.target.value)
                                                        )
                                                    }
                                                    className="h-8 text-xs"
                                                />
                                                <p className="text-[10px] text-slate-400">
                                                    Puedes calcularlo según la tasa
                                                    vigente.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 border-t border-slate-200 pt-2 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">
                                                    Subtotal:
                                                </span>
                                                <span className="font-semibold text-slate-800">
                                                    {fmtMoney(subtotalCalculado)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">
                                                    IVA:
                                                </span>
                                                <span className="font-semibold text-slate-800">
                                                    {fmtMoney(iva)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-700">
                                                    Total:
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {fmtMoney(totalCalculado)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PASO 4: CIERRE / GARANTÍA / OTP */}
                                    <div
                                        className={`rounded-xl border p-3 transition ${
                                            pasoActivo === 4
                                                ? "border-slate-400 bg-white"
                                                : "border-slate-100 bg-white/90"
                                        }`}
                                    >
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                                            <span>Cierre de la orden / OTP</span>
                                            <span className="text-[10px] text-slate-400">
                                                Paso 4 de 4
                                            </span>
                                        </h3>
                                        <p className="mt-2 text-xs text-slate-600">
                                            Define si aplica garantía, registra OTP y
                                            motivo de cierre.
                                        </p>

                                        <div className="mt-3 space-y-3 text-xs">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEsEnGarantia(
                                                            (prev) => !prev
                                                        )
                                                    }
                                                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                                                        esEnGarantia
                                                            ? "border-emerald-500 bg-emerald-500"
                                                            : "border-slate-400 bg-white"
                                                    }`}
                                                >
                                                    {esEnGarantia && (
                                                        <span className="text-[10px] text-white">
                                                            ✓
                                                        </span>
                                                    )}
                                                </button>
                                                <span className="font-medium text-slate-700">
                                                    Orden en garantía
                                                </span>
                                            </div>

                                            {esEnGarantia && (
                                                <div className="space-y-1">
                                                    <label className="font-medium text-slate-700">
                                                        Referencia orden de garantía
                                                    </label>
                                                    <Input
                                                        value={referenciaGarantia}
                                                        onChange={(e) =>
                                                            setReferenciaGarantia(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="ID de la orden original"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="font-medium text-slate-700">
                                                        Código OTP
                                                    </label>
                                                    <Input
                                                        value={otpCodigo}
                                                        onChange={(e) =>
                                                            setOtpCodigo(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="OTP validada con el cliente"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="font-medium text-slate-700">
                                                        OTP validada
                                                    </label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setOtpValidado(
                                                                    (prev) => !prev
                                                                )
                                                            }
                                                            className={`h-4 w-4 rounded border flex items-center justify-center ${
                                                                otpValidado
                                                                    ? "border-emerald-500 bg-emerald-500"
                                                                    : "border-slate-400 bg-white"
                                                            }`}
                                                        >
                                                            {otpValidado && (
                                                                <span className="text-[10px] text-white">
                                                                    ✓
                                                                </span>
                                                            )}
                                                        </button>
                                                        <span className="text-xs text-slate-700">
                                                            Confirmado con el cliente
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    Motivo de cierre *
                                                </label>
                                                <textarea
                                                    value={motivoCierre}
                                                    onChange={(e) =>
                                                        setMotivoCierre(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Ej: Equipo entregado conforme, cliente aprueba trabajo y costos."
                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[60px]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-medium text-slate-700">
                                                    Cerrada por
                                                </label>
                                                <Input
                                                    value={cerradaPor}
                                                    onChange={(e) =>
                                                        setCerradaPor(e.target.value)
                                                    }
                                                    placeholder="Usuario / técnico que cierra la orden"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 text-[11px] text-slate-500">
                                        <span>
                                            Paso actual: {pasoActivo} / 4 — sigue el
                                            orden para no olvidar nada.
                                        </span>
                                        <div className="flex gap-2">
                                            {pasoActivo > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[11px]"
                                                    onClick={() =>
                                                        setPasoActivo(
                                                            (prev) =>
                                                                ((prev - 1) as Paso)
                                                        )
                                                    }
                                                >
                                                    Anterior
                                                </Button>
                                            )}
                                            {pasoActivo < 4 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[11px]"
                                                    onClick={() =>
                                                        setPasoActivo(
                                                            (prev) =>
                                                                ((prev + 1) as Paso)
                                                        )
                                                    }
                                                >
                                                    Siguiente
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* DERECHA: Imágenes + subida */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                                Imágenes registradas
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Haz clic en una miniatura para ampliarla.
                                            </p>
                                        </div>

                                        {/* Pequeño filtro por texto (categoría) */}
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="Filtrar por categoría..."
                                                value={imgFilterCategoria}
                                                onChange={(e) =>
                                                    setImgFilterCategoria(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-8 w-40 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* LISTA DE IMÁGENES */}
                                    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/60 p-2 max-h-[320px] overflow-y-auto">
                                        {imagenesDetalle &&
                                        imagenesDetalle.length > 0 ? (
                                            (() => {
                                                const term = imgFilterCategoria
                                                    .trim()
                                                    .toUpperCase();

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
                                                                        img.categoria ===
                                                                        cat
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
                                                onValueChange={(value) =>
                                                    setCategoriaImg(value)
                                                }
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="INGRESO">
                                                        INGRESO
                                                    </SelectItem>
                                                    <SelectItem value="DIAGNOSTICO">
                                                        DIAGNOSTICO
                                                    </SelectItem>
                                                    <SelectItem value="REPARACION">
                                                        REPARACION
                                                    </SelectItem>
                                                    <SelectItem value="ENTREGA">
                                                        ENTREGA
                                                    </SelectItem>
                                                    <SelectItem value="OTRO">
                                                        OTRO
                                                    </SelectItem>
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
                                                disabled={
                                                    imagenesNuevas.length === 0
                                                }
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

                        {/* FOOTER ACCIONES PRINCIPALES */}
                        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[11px] text-slate-500">
                                Completa los 4 pasos y usa <b>Guardar borrador</b> o{" "}
                                <b>Cerrar OT</b> cuando esté lista.
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={guardando}
                                    onClick={() => guardarCambiosOrden(false)}
                                    className="flex items-center gap-2 h-8 text-[11px]"
                                >
                                    {guardando && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Guardar borrador
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={guardando}
                                    onClick={cerrarOrden}
                                    className="flex items-center gap-2 h-8 text-[11px]"
                                >
                                    {guardando && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Cerrar OT
                                </Button>
                            </div>
                        </footer>

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


                        {showNotifModal && notifOtId !== null && (
                            <ModalNotificacion
                                otId={notifOtId ?? 0}
                                open={showNotifModal}
                                onClose={() => setShowNotifModal(false)}
                            />
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
