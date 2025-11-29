"use client";

import React, { useEffect, useState, useCallback, ChangeEvent } from "react";
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
} from "lucide-react";

import FichasTecnicasPage from "./FichasTecnicasPage"; // 👈 IMPORTAMOS TU PÁGINA
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
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

const FICHAS_API_BASE = "http://localhost:8080/api/fichas";
const API_BASE = "http://localhost:8080/api/ordenes";
const OTP_API_BASE = "http://localhost:8080/api/otp";
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

    // correo del cliente para envío de OTP
    clienteCorreo?: string | null;

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

/* ===== Util: qué paso mostrar según estado actual ===== */
const mapEstadoToPaso = (estado: string | null): Paso => {
    const e = (estado || "").toUpperCase();

    if (e === "INGRESO" || e === "PENDIENTE") return 1;
    if (e === "EN_DIAGNOSTICO") return 2;
    if (e === "EN_REPARACION") return 3;
    if (e === "LISTA_ENTREGA" || e === "CERRADA") return 4;

    return 1;
};

const estadoBadgeClasses = (estado: string | null) => {
    const e = (estado || "").toUpperCase();
    if (e === "EN_DIAGNOSTICO" || e === "EN_REPARACION")
        return "bg-blue-50 text-blue-700 border border-blue-200";
    if (e === "INGRESO" || e === "PENDIENTE")
        return "bg-amber-50 text-amber-700 border border-amber-200";
    if (e === "CERRADA" || e === "LISTA_ENTREGA")
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
};

/* ===== MODAL FICHA TÉCNICA RENDERIZANDO LA PAGE DIRECTAMENTE ===== */

interface FichaTecnicaModalProps {
    open: boolean;
    onClose: () => void;
    ordenTrabajoId: number;
    equipoId: number;
}

/**
 * Wrapper que simula los searchParams que espera FichasTecnicasPage.
 * Así no tienes que tocar esa página.
 */
const FichaTecnicaWrapper: React.FC<{
    ordenTrabajoId: number;
    equipoId: number;
}> = ({ ordenTrabajoId, equipoId }) => {
    const searchParams = {
        ordenTrabajoId: String(ordenTrabajoId),
        equipoId: String(equipoId),
    };

    // @ts-ignore – FichasTecnicasPage está tipada como página de Next con searchParams
    return <FichasTecnicasPage searchParams={searchParams} />;
};

function FichaTecnicaModal({
    open,
    onClose,
    ordenTrabajoId,
    equipoId,
}: FichaTecnicaModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70">
            <div className="relative mx-4 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-slate-50 hover:bg-black/60"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Aquí se muestra FichasTecnicasPage tal cual, pero solo para esa OT/equipo */}
                <div className="h-full w-full overflow-y-auto pt-10 px-4 pb-4">
                    <FichaTecnicaWrapper
                        ordenTrabajoId={ordenTrabajoId}
                        equipoId={equipoId}
                    />
                </div>
            </div>
        </div>
    );
}

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

    // === CREAR OT ===
    const [showCrear, setShowCrear] = useState(false);
    // === Listas para los combos ===
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

    // === MODAL FICHA TÉCNICA DESDE OT ===
    const [showFichaModal, setShowFichaModal] = useState(false);
    const [fichaOrdenId, setFichaOrdenId] = useState<number | null>(null);
    const [fichaEquipoId, setFichaEquipoId] = useState<number | null>(null);

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
        fetchCombos();
    }, [fetchOrdenes]);

    const fetchCombos = async () => {
        if (!token) return;

        try {
            // === Usuarios (clientes y técnicos) ===
            const resUsers = await fetch("http://localhost:8080/api/usuarios", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const usuarios: Usuario[] = await resUsers.json();

            setListaClientes(usuarios.filter(u => u.rol?.nombre === "ROLE_CLIENTE"));
            setListaTecnicos(usuarios.filter(u => u.rol?.nombre === "ROLE_TECNICO"));
        } catch (err) {
            console.error("Error cargando combos:", err);
        }
    };


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
        setOtpMensaje(null);
        setOtpEnviando(false);
        setOtpVerificando(false);

        // Paso inicial alineado con el estado actual
        setPasoActivo(mapEstadoToPaso(data.estado ?? "INGRESO"));
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

    /* ===== Cambio de paso: SOLO secuencial con botones ===== */
    const irSiguientePaso = () => {
        setPasoActivo((prev) => (prev < 4 ? ((prev + 1) as Paso) : prev));
    };

    const irPasoAnterior = () => {
        setPasoActivo((prev) => (prev > 1 ? ((prev - 1) as Paso) : prev));
    };

    /* ===== PUT /{id}/entrega – guardar todo lo editable ===== */
    const guardarCambiosOrden = async (esCierre: boolean = false) => {
        if (!detalle) return;
        if (!token) {
            alert("No hay token de autenticación");
            return;
        }

        const payload = {
            tipoServicio: tipoServicioEdit,
            prioridad: prioridadEdit,
            estado: esCierre ? "CERRADA" : estadoEdit,
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
            const seguir = window.confirm(
                "La OTP no está validada. ¿Cerrar de todas formas?"
            );
            if (!seguir) return;
        }

        await guardarCambiosOrden(true);
    };

    /* ===== OTP: enviar y validar ===== */

    const handleEnviarOtp = async () => {
        if (!detalle) return;

        const cedula = detalle.clienteCedula;
        const correo = detalle.clienteCorreo;

        if (!cedula || !correo) {
            setOtpMensaje(
                "No se encontró la cédula o el correo del cliente para enviar el OTP."
            );
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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cedula: Number(cedula),
                    correo: correo,
                }),
            });

            if (!response.ok) {
                throw new Error("No se pudo enviar el OTP.");
            }

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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cedula: Number(cedula),
                    codigo: otpCodigo,
                }),
            });

            if (!response.ok) {
                throw new Error("OTP inválido o expirado.");
            }

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

    /* ===== Navegar a Fichas Técnicas (sigue disponible si lo usas en otro lado) ===== */
    const irAFichaTecnica = async (ordenId: number, equipoId: number) => {
        if (!token) {
            alert("Sesión inválida. Inicia sesión nuevamente.");
            return;
        }

        try {
            const res = await fetch(
                `${FICHAS_API_BASE}/orden-trabajo/${ordenId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const ficha = await res.json();
                router.push(`/dashboard/fichas/${ficha.id}`);
                return;
            }

            if (res.status === 404) {
                router.push(
                    `/dashboard/fichas/nueva?ordenTrabajoId=${ordenId}&equipoId=${equipoId}`
                );
                return;
            }

            throw new Error(
                `Error buscando ficha técnica (HTTP ${res.status})`
            );
        } catch (e: any) {
            console.error("Error al abrir ficha técnica:", e);
            alert(e?.message ?? "Error al abrir la ficha técnica.");
        }
    };

    const irAAprobacionProcedimiento = (ordenId: number) => {
        router.push(`/firma?ordenId=${ordenId}&modo=aceptacion`);
    };

    /* ===== Handlers formulario crear OT ===== */
    const handleCrearChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* HEADER PÁGINA */}
                <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                            Órdenes de Trabajo
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Gestiona los ingresos, diagnósticos, costos y cierres de cada equipo.
                        </p>
                    </div>

                    <Button
                        size="sm"
                        className="flex items-center gap-2 bg-slate-900 text-slate-50 hover:bg-slate-800"
                        onClick={() => setShowCrear((prev) => !prev)}
                    >
                        <Plus className="h-4 w-4" />
                        {showCrear ? "Cerrar formulario" : "Nueva OT"}
                    </Button>
                </div>

                {/* FORMULARIO CREAR OT */}
                {showCrear && (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900">
                                Crear nueva Orden de Trabajo
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Completa los datos de ingreso y clasificación del servicio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {/* Primera fila: cliente / técnico / equipo */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">
                                        Cédula cliente *
                                    </label>
                                    <select
                                        name="clienteCedula"
                                        value={formCrear.clienteCedula}
                                        onChange={(e) =>
                                            setFormCrear((prev) => ({ ...prev, clienteCedula: e.target.value }))
                                        }
                                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                    >
                                        <option value="">-- Selecciona Cliente --</option>

                                        {listaClientes.map((c) => (
                                            <option key={c.cedula} value={c.cedula}>
                                                {c.nombre} — {c.cedula}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">
                                        Cédula técnico
                                    </label>
                                        <select
                                            name="tecnicoCedula"
                                            value={formCrear.tecnicoCedula}
                                            onChange={(e) =>
                                                setFormCrear((prev) => ({ ...prev, tecnicoCedula: e.target.value }))
                                            }
                                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                        >
                                            <option value="">-- Selecciona Técnico --</option>

                                            {listaTecnicos.map((t) => (
                                                <option key={t.cedula} value={t.cedula}>
                                                    {t.nombre} — {t.cedula}
                                                </option>
                                            ))}
                                        </select>
                                </div>
                                <div className="space-y-1.5">
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
                                <div className="space-y-1.5">
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

                                <div className="space-y-1.5">
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
                                            <SelectItem value="INGRESO">INGRESO</SelectItem>
                                            <SelectItem value="EN_DIAGNOSTICO">EN_DIAGNOSTICO</SelectItem>
                                            <SelectItem value="EN_REPARACION">EN_REPARACION</SelectItem>
                                            <SelectItem value="LISTA_ENTREGA">LISTA_ENTREGA</SelectItem>
                                            {/* CERRADA solo se pone desde el botón "Cerrar OT" */}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
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
                                <div className="space-y-1.5">
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
                                <div className="md:col-span-2 space-y-1.5">
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
                                <div className="space-y-1.5">
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
                                <div className="space-y-1.5">
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
                                    {crearLoading && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
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

                {/* LISTA DE ÓRDENES */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                    </div>
                ) : ordenes.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-100 px-4 py-8 text-center text-sm text-slate-500">
                        No hay órdenes de trabajo registradas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ordenes.map((ot) => (
                            <Card
                                key={ot.id}
                                onDoubleClick={() => abrirDetalle(ot.id)}
                                className="cursor-pointer border border-slate-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-start justify-between gap-2 text-sm">
                                        <div className="space-y-1">
                                            <span className="block font-semibold text-slate-900">
                                                {ot.numeroOrden}
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                {fmt(ot.equipoModelo)}{" "}
                                                {ot.equipoHostname
                                                    ? `(${ot.equipoHostname})`
                                                    : ""}
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
                                                <span className="font-semibold text-slate-700">
                                                    Cliente:{" "}
                                                </span>
                                                {fmt(ot.clienteNombre)}{" "}
                                                {ot.clienteCedula
                                                    ? `(${ot.clienteCedula})`
                                                    : ""}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">
                                                    Técnico:{" "}
                                                </span>
                                                {fmt(ot.tecnicoNombre) ||
                                                    fmt(ot.tecnicoCedula)}
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
                                        <span className="font-semibold text-slate-700">
                                            Problema:{" "}
                                        </span>
                                        {fmt(ot.problemaReportado)}
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[11px] text-slate-500">
                                            Doble clic para ver detalle
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 border-slate-300 text-xs"
                                            onClick={() => {
                                                setFichaOrdenId(ot.id);
                                                setFichaEquipoId(ot.equipoId);
                                                setShowFichaModal(true);
                                            }}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        {/* Contenedor principal del modal */}
                        <div className="relative mx-4 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-2xl">
                            {/* Botón cerrar */}
                            <button
                                onClick={() => {
                                    setDetalle(null);
                                    setImagenesDetalle([]);
                                    setSelectedImg(null);
                                }}
                                className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-slate-50 hover:bg-black/60"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* HEADER */}
                            <header className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 pr-12">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <h2 className="text-base font-semibold leading-tight text-white">
                                            Orden #{detalle.numeroOrden} · Equipo{" "}
                                            <span className="font-bold">
                                                {detalle.equipoModelo ??
                                                    detalle.equipoId}
                                            </span>
                                        </h2>
                                        <p className="text-[11px] text-slate-200">
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
                                            <SelectTrigger className="h-8 min-w-[130px] border-slate-500 bg-slate-800/70 text-[11px] text-slate-100">
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
                                            <SelectTrigger className="h-8 min-w-[120px] border-emerald-400 bg-emerald-800/60 text-[11px] text-emerald-50">
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

                                        {/* Select estado */}
                                        <Select
                                            value={estadoEdit}
                                            onValueChange={(value) => {
                                                setEstadoEdit(value);
                                                setPasoActivo(mapEstadoToPaso(value));
                                            }}
                                        >
                                            <SelectTrigger className="h-8 min-w-[140px] border-blue-400 bg-blue-800/60 text-[11px] text-blue-50">
                                                <SelectValue placeholder="Estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INGRESO">INGRESO</SelectItem>
                                                <SelectItem value="EN_DIAGNOSTICO">EN_DIAGNOSTICO</SelectItem>
                                                <SelectItem value="EN_REPARACION">EN_REPARACION</SelectItem>
                                                <SelectItem value="LISTA_ENTREGA">LISTA_ENTREGA</SelectItem>
                                                {/* CERRADA solo se pone desde el botón "Cerrar OT" */}
                                            </SelectContent>
                                        </Select>

                                        {esEnGarantia && (
                                            <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-500/25 px-3 py-1 text-[11px] font-semibold text-amber-50">
                                                Garantía
                                            </span>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-2 border border-white/40 bg-white/10 px-3 text-[11px] text-white hover:bg-white/20"
                                            onClick={() => {
                                                setFichaOrdenId(detalle.ordenId);
                                                setFichaEquipoId(detalle.equipoId);
                                                setShowFichaModal(true);
                                            }}
                                        >
                                            <FileText className="h-4 w-4" /> Ficha Técnica
                                        </Button>


                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                irAAprobacionProcedimiento(
                                                    detalle.ordenId
                                                )
                                            }
                                            className="flex items-center gap-2 border border-white/40 bg-white/10 px-3 text-[11px] text-white hover:bg-white/20"
                                        >
                                            <Signature className="h-4 w-4" />
                                            Firma de Aprobación
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
                                            Enviar notificación
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-200">
                                    <span>
                                        <span className="font-semibold text-white">
                                            Ingreso:
                                        </span>{" "}
                                        {fmtFecha(detalle.fechaHoraIngreso)}
                                    </span>
                                    <span className="hidden sm:inline text-slate-500">
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
                                            <span className="hidden sm:inline text-slate-500">
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

                                {/* STEPPER DE PASOS (solo visual, sin onClick) */}
                                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
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
                                    ].map((p) => {
                                        const isActive = pasoActivo === p.paso;
                                        return (
                                            <div
                                                key={p.paso}
                                                className={`flex items-center gap-2 rounded-full border px-3 py-1 transition ${isActive
                                                    ? "border-white bg-white/20 text-white"
                                                    : "border-white/30 bg-slate-800/40 text-slate-200"
                                                    }`}
                                            >
                                                <span className="text-[10px] font-semibold">
                                                    {p.label}
                                                </span>
                                                <span className="hidden sm:inline text-[10px] opacity-80">
                                                    {p.desc}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </header>

                            {/* CONTENIDO SCROLLABLE */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                    {/* IZQUIERDA: Pasos del flujo */}
                                    <div className="flex flex-col gap-4">
                                        {/* PASO 1: CONTEXTO / INGRESO */}
                                        {pasoActivo === 1 && (
                                            <div className="border border-slate-400 bg-white p-3 text-xs transition">
                                                <h3 className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    <span>Datos de ingreso</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Paso 1 de 4
                                                    </span>
                                                </h3>
                                                <p className="mt-2 text-[11px] text-slate-600">
                                                    Revisa la información de entrada antes de
                                                    continuar con el diagnóstico.
                                                </p>

                                                <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] md:grid-cols-2">
                                                    <div>
                                                        <span className="font-semibold text-slate-700">
                                                            Problema reportado:
                                                        </span>
                                                        <p className="mt-1 whitespace-pre-wrap text-slate-800">
                                                            {fmt(
                                                                detalle.problemaReportado
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-700">
                                                            Observaciones de ingreso:
                                                        </span>
                                                        <p className="mt-1 whitespace-pre-wrap text-slate-800">
                                                            {fmt(
                                                                detalle.observacionesIngreso
                                                            )}
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
                                        )}

                                        {/* PASO 2: DIAGNÓSTICO */}
                                        {pasoActivo === 2 && (
                                            <div className="border border-slate-400 bg-white p-3 text-xs transition">
                                                <h3 className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    <span>
                                                        Diagnóstico y trabajo realizado
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Paso 2 de 4
                                                    </span>
                                                </h3>
                                                <p className="mt-2 text-[11px] text-slate-600">
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
                                                        className="min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
                                                        className="min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* PASO 3: COSTOS */}
                                        {pasoActivo === 3 && (
                                            <div className="border border-slate-400 bg-white p-3 text-xs transition">
                                                <h3 className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    <span>Costos de la orden</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Paso 3 de 4
                                                    </span>
                                                </h3>
                                                <p className="mt-2 text-[11px] text-slate-600">
                                                    Ingresa los valores de mano de obra,
                                                    repuestos y otros conceptos.
                                                </p>

                                                <div className="mt-3 grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
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
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
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
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
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
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
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
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
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

                                                <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">
                                                            Subtotal:
                                                        </span>
                                                        <span className="font-semibold text-slate-900">
                                                            {fmtMoney(subtotalCalculado)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">
                                                            IVA:
                                                        </span>
                                                        <span className="font-semibold text-slate-900">
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
                                        )}

                                        {/* PASO 4: CIERRE / GARANTÍA / OTP */}
                                        {pasoActivo === 4 && (
                                            <div className="border border-slate-400 bg-white p-3 text-xs transition">
                                                <h3 className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    <span>Cierre de la orden / OTP</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Paso 4 de 4
                                                    </span>
                                                </h3>
                                                <p className="mt-2 text-[11px] text-slate-600">
                                                    Define si aplica garantía, gestiona el OTP
                                                    con el cliente y registra el motivo de
                                                    cierre.
                                                </p>

                                                <div className="mt-3 space-y-3">
                                                    {/* GARANTÍA */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setEsEnGarantia(
                                                                    (prev) => !prev
                                                                )
                                                            }
                                                            className={`flex h-4 w-4 items-center justify-center rounded border ${esEnGarantia
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
                                                        <span className="text-xs font-medium text-slate-700">
                                                            Orden en garantía
                                                        </span>
                                                    </div>

                                                    {esEnGarantia && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-medium text-slate-700">
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

                                                    {/* OTP: ENVÍO Y VALIDACIÓN */}
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        {/* Columna 1: Código + validar */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-medium text-slate-700">
                                                                Código OTP recibido del cliente
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={otpCodigo}
                                                                    onChange={(e) =>
                                                                        setOtpCodigo(
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder="Código enviado al correo del cliente"
                                                                    className="h-8 text-xs"
                                                                    disabled={
                                                                        otpValidado ||
                                                                        otpVerificando
                                                                    }
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    onClick={handleValidarOtp}
                                                                    disabled={
                                                                        otpValidado ||
                                                                        otpVerificando ||
                                                                        !otpCodigo
                                                                    }
                                                                    className="flex h-8 items-center gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-500"
                                                                >
                                                                    {otpVerificando && (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    )}
                                                                    Validar
                                                                </Button>
                                                            </div>
                                                            {detalle.otpFechaValidacion &&
                                                                otpValidado && (
                                                                    <p className="text-[10px] text-emerald-700">
                                                                        Validado el{" "}
                                                                        {fmtFecha(
                                                                            detalle.otpFechaValidacion
                                                                        )}
                                                                    </p>
                                                                )}
                                                        </div>

                                                        {/* Columna 2: Enviar OTP */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-medium text-slate-700">
                                                                Envío de OTP al cliente
                                                            </label>
                                                            <Button
                                                                type="button"
                                                                onClick={handleEnviarOtp}
                                                                disabled={
                                                                    otpEnviando || otpValidado
                                                                }
                                                                className="flex h-8 items-center gap-2 bg-slate-900 text-[11px] text-white hover:bg-slate-800"
                                                            >
                                                                {otpEnviando && (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                )}
                                                                Enviar OTP
                                                            </Button>
                                                            <p className="text-[10px] text-slate-500">
                                                                Se enviará al correo:{" "}
                                                                <span className="font-medium">
                                                                    {detalle.clienteCorreo ??
                                                                        "—"}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Mensaje de estado OTP */}
                                                    {otpMensaje && (
                                                        <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700">
                                                            {otpMensaje}
                                                        </div>
                                                    )}

                                                    {/* MOTIVO DE CIERRE */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
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
                                                            className="min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                        />
                                                    </div>

                                                    {/* CERRADA POR */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-medium text-slate-700">
                                                            Cerrada por
                                                        </label>
                                                        <Input
                                                            value={cerradaPor}
                                                            onChange={(e) =>
                                                                setCerradaPor(
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Usuario / técnico que cierra la orden"
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Navegación entre pasos */}
                                        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
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
                                                        className="h-7 border-slate-300 text-[11px] text-slate-700"
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
                                                        className="h-7 border-slate-300 text-[11px] text-slate-700"
                                                        onClick={irSiguientePaso}
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
                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    Imágenes registradas
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    Haz clic en una miniatura para
                                                    ampliarla.
                                                </p>
                                            </div>

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

                                        {/* LISTA DE IMÁGENES */}
                                        <div className="max-h-[320px] flex-1 overflow-y-auto border border-slate-200 bg-white p-2 text-xs">
                                            {imagenesDetalle &&
                                                imagenesDetalle.length > 0 ? (
                                                (() => {
                                                    const term = imgFilterCategoria
                                                        .trim()
                                                        .toUpperCase();

                                                    const categorias = Array.from(
                                                        new Set(
                                                            imagenesDetalle.map(
                                                                (img) =>
                                                                    img.categoria
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
                                                            <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
                                                                No hay imágenes para ese
                                                                filtro.
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
                                                                if (
                                                                    imgsCat.length ===
                                                                    0
                                                                )
                                                                    return null;

                                                                return (
                                                                    <div
                                                                        key={cat}
                                                                        className="space-y-1"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="rounded-full bg-slate-900 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-white">
                                                                                {cat}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-500">
                                                                                {
                                                                                    imgsCat.length
                                                                                }{" "}
                                                                                imagen
                                                                                {imgsCat.length >
                                                                                    1
                                                                                    ? "es"
                                                                                    : ""}
                                                                            </span>
                                                                        </div>

                                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                                            {imgsCat.map(
                                                                                (
                                                                                    img
                                                                                ) => (
                                                                                    <button
                                                                                        key={
                                                                                            img.id
                                                                                        }
                                                                                        type="button"
                                                                                        className="group relative h-24 w-28 overflow-hidden border border-slate-200 bg-slate-100"
                                                                                        onClick={() =>
                                                                                            setSelectedImg(
                                                                                                `http://localhost:8080${img.ruta}`
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <img
                                                                                            src={`http://localhost:8080${img.ruta}`}
                                                                                            alt={img.descripcion ||
                                                                                                "Imagen OT"}
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
                                                <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
                                                    No hay imágenes registradas.
                                                </div>
                                            )}
                                        </div>

                                        {/* PANEL SUBIR IMÁGENES */}
                                        <div className="space-y-2 border border-dashed border-slate-300 bg-slate-100 px-3 py-3 text-xs">
                                            <p className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
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
                                                            Array.from(
                                                                e.target.files || []
                                                            )
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
                                                    className="flex h-9 items-center gap-2 bg-slate-900 text-xs text-slate-50 hover:bg-slate-800"
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
                            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3 text-[11px] text-slate-600">
                                <div>
                                    Completa los 4 pasos y usa{" "}
                                    <span className="font-semibold">
                                        Guardar sin cerrar
                                    </span>{" "}
                                    o{" "}
                                    <span className="font-semibold">Cerrar OT</span> cuando
                                    esté lista.
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={guardando}
                                        onClick={() => guardarCambiosOrden(false)}
                                        className="flex h-8 items-center gap-2 border-slate-300 text-[11px] text-slate-700"
                                    >
                                        {guardando && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                        Guardar sin cerrar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={guardando}
                                        onClick={cerrarOrden}
                                        className="flex h-8 items-center gap-2 bg-slate-900 text-[11px] text-slate-50 hover:bg-slate-800"
                                    >
                                        {guardando && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                        Cerrar OT
                                    </Button>
                                </div>
                            </footer>

                            {/* OVERLAY IMAGEN SELECCIONADA */}
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
                                            className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black/90"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        <img
                                            src={selectedImg}
                                            alt="Vista ampliada"
                                            className="max-h-[90vh] w-full rounded-md object-contain shadow-2xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* MODAL NOTIFICACIÓN */}
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

                {/* MODAL FICHA TÉCNICA (UNA FICHA ESPECÍFICA) */}
                {showFichaModal &&
                    fichaOrdenId !== null &&
                    fichaEquipoId !== null && (
                        <FichaTecnicaModal
                            open={showFichaModal}
                            onClose={() => setShowFichaModal(false)}
                            ordenTrabajoId={fichaOrdenId}
                            equipoId={fichaEquipoId}
                        />
                    )}
            </div>
        </div>
    );
}
