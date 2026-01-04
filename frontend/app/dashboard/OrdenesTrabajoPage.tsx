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
    Laptop,
    User,
    Wrench,
    CheckCircle2,
    AlertCircle,
    Save,
    ArrowLeft,
    FileUp,
    Monitor,
    Cpu,
    HardDrive,
    Battery,
    Wifi,
    Shield,
    Keyboard,
    Box,
    Download
} from "lucide-react";

import ModalNotificacion from "../components/ModalNotificacion";
// Asegúrate de tener este componente o quítalo si no lo usas
import XmlUploader from "./XmlUploader";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
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

/* ===== CONFIGURACIÓN API ===== */
const API_BASE = "http://localhost:8080/api/ordenes";
const OTP_API_BASE = "http://localhost:8080/api/otp";
const EQUIPOS_API_BASE = "http://localhost:8080/api/equipo";
const FICHAS_API_BASE = "http://localhost:8080/api/fichas";

const buildUrl = (p: string = "") => `${API_BASE}${p}`;

/* ===== DTOs ===== */
interface FichaTecnicaDTO {
    id: number;
    fechaCreacion: string;
    observaciones: string | null;
    equipoId: number | null;
    ordenTrabajoId: number | null;
    tecnicoId: string | null;
    // Hardware Automático
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
    // Ficha Física
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

interface ImagenDTO {
    id: number;
    ruta: string;
    categoria: string;
    descripcion: string | null;
    fechaSubida: string;
}

interface EquipoSimpleDTO {
    id: number;
    nombre: string;
    marca: string;
    modelo: string;
    codigo: string;
}

interface Usuario {
    cedula: string;
    nombre: string;
    email: string;
    rol?: { nombre: string };
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

interface FichaTecnicaResumenDTO {
    id: number;
    fechaCreacion: string;
    tecnicoNombre?: string;
    observaciones?: string;
    equipoModelo?: string;
}

type Paso = 1 | 2 | 3 | 4;

/* ===== ÚTILES DE UI ===== */
const mapEstadoToPaso = (estado: string | null): Paso => {
    const e = (estado || "").toUpperCase();
    if (e === "INGRESO" || e === "PENDIENTE") return 1;
    if (e === "EN_DIAGNOSTICO") return 2;
    if (e === "EN_REPARACION") return 3;
    if (e === "LISTA_ENTREGA" || e === "CERRADA") return 4;
    return 1;
};

const getBadgeColor = (type: 'estado' | 'prioridad' | 'servicio', value: string | null) => {
    const v = (value || "").toUpperCase();
    if (type === 'estado') {
        if (v === "EN_DIAGNOSTICO" || v === "EN_REPARACION") return "bg-blue-100 text-blue-800 border-blue-200";
        if (v === "INGRESO" || v === "PENDIENTE") return "bg-amber-100 text-amber-800 border-amber-200";
        if (v === "CERRADA" || v === "LISTA_ENTREGA") return "bg-emerald-100 text-emerald-800 border-emerald-200";
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
    if (type === 'prioridad') {
        if (v === "ALTA" || v === "URGENTE") return "bg-rose-100 text-rose-800 border-rose-200";
        if (v === "MEDIA") return "bg-orange-100 text-orange-800 border-orange-200";
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
};

/* ===== COMPONENTE INTERNO: SECCIONES DE SOLO LECTURA ===== */
const ReadOnlySection: React.FC<{
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, children }) => (
    <section className="rounded-xl border bg-slate-50/50 shadow-sm overflow-hidden mb-4 break-inside-avoid">
        <div className="flex items-center gap-2 border-b bg-slate-100/80 px-4 py-2">
            {icon && <span className="text-slate-500">{icon}</span>}
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                {title}
            </h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            {children}
        </div>
    </section>
);

const Field: React.FC<{ label: string; value: string | number | null | boolean; className?: string }> = ({ label, value, className = "" }) => {
    let displayValue = "-";
    if (typeof value === 'boolean') {
        displayValue = value ? "Sí" : "No";
    } else if (value !== null && value !== undefined && value !== "") {
        displayValue = String(value);
    }
    return (
        <div className={`flex flex-col ${className}`}>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">{label}</span>
            <span className="text-xs text-slate-800 font-medium break-words leading-tight">{displayValue}</span>
        </div>
    );
};

/* =========================================================
   COMPONENTE: VISTA DETALLADA DE UNA FICHA (SOLO LECTURA)
   ========================================================= */
interface DetalleFichaProps {
    fichaId: number;
    onBack: () => void;
}

const DetalleFichaVista: React.FC<DetalleFichaProps> = ({ fichaId, onBack }) => {
    const [detalleForm, setDetalleForm] = useState<FichaTecnicaDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [showXml, setShowXml] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        setLoading(true);
        fetch(`${FICHAS_API_BASE}/${fichaId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Error cargando ficha");
                return res.json();
            })
            .then(data => setDetalleForm(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [fichaId]);

    const descargarPdf = () => {
        window.open(`http://localhost:8080/api/pdf/ficha/${fichaId}`, '_blank');
    };

    if (loading) return <div className="p-12 flex justify-center h-full items-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    if (!detalleForm) return <div className="p-12 text-center text-red-500">No se pudo cargar la información de la ficha.</div>;

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* ENCABEZADO FIJO */}
            <div className="flex-none flex justify-between items-start border-b border-slate-100 p-6 bg-white z-10 shadow-sm">
                <div>
                    <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 p-0 h-auto text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver al historial
                    </Button>
                    <h2 className="text-xl font-bold text-slate-800">
                        Ficha #{detalleForm.id} – Equipo {detalleForm.equipoId ?? "-"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Técnico: <span className="font-semibold">{detalleForm.tecnicoId ?? "-"}</span>
                        {" "}· OT: {detalleForm.ordenTrabajoId ?? "-"}
                        <br />
                        Creada el {detalleForm.fechaCreacion ? new Date(detalleForm.fechaCreacion).toLocaleString() : "-"}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowXml(true)} className="flex items-center gap-2">
                        <Upload className="h-4 w-4" /> XML
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/firma?fichaId=${fichaId}`)} className="flex items-center gap-2">
                        <Signature className="h-4 w-4" /> Firmar
                    </Button>
                    <Button variant="outline" size="sm" onClick={descargarPdf} className="flex items-center gap-2">
                        <FileUp className="h-4 w-4" /> PDF
                    </Button>
                </div>
            </div>

            {/* CONTENIDO DE LA FICHA (SCROLL INTERNO) */}
            <div className="flex-1 w-full overflow-y-auto p-6 space-y-6 text-sm bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

                {/* Observaciones Principales */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">Diagnóstico / Observaciones Generales</h3>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                        {detalleForm.observaciones || "Sin observaciones registradas."}
                    </p>
                </div>

                {/* --- SECCIÓN 1: HARDWARE PRINCIPAL --- */}
                <ReadOnlySection title="Procesador & Memoria" icon={<Cpu className="h-4 w-4" />}>
                    <Field label="Procesador (CPU)" value={detalleForm.cpuNombre} />
                    <Field label="Núcleos / Hilos" value={`${detalleForm.cpuNucleos || '?'} / ${detalleForm.cpuLogicos || '?'}`} />
                    <Field label="Frecuencia Base" value={detalleForm.cpuFrecuenciaOriginalMhz} />
                    <Field label="Paquetes Físicos" value={detalleForm.cpuPaquetesFisicos} />
                    <Field label="Memoria RAM Total" value={detalleForm.ramCapacidadGb ? `${detalleForm.ramCapacidadGb} GB` : null} />
                    <Field label="Tipo RAM" value={detalleForm.ramTipo} />
                    <Field label="Frecuencia RAM" value={detalleForm.ramFrecuenciaMhz ? `${detalleForm.ramFrecuenciaMhz} MHz` : null} />
                    <Field label="Slots Usados" value={detalleForm.ramCantidadModulos} />
                </ReadOnlySection>

                {/* --- SECCIÓN 2: ALMACENAMIENTO --- */}
                <ReadOnlySection title="Almacenamiento (Disco Principal)" icon={<HardDrive className="h-4 w-4" />}>
                    <Field label="Modelo" value={detalleForm.discoModelo} />
                    <Field label="N° Serie" value={detalleForm.discoNumeroSerie} />
                    <Field label="Tipo" value={detalleForm.discoTipo} />
                    <Field label="Capacidad" value={detalleForm.discoCapacidadStr} />
                    <Field label="Salud (Temp)" value={detalleForm.discoTemperatura} />
                    <Field label="Horas Encendido" value={detalleForm.discoHorasEncendido} />
                    <Field label="Estado SMART" value={detalleForm.discoEstado} />
                    <Field label="Errores Lectura" value={detalleForm.discoErroresLectura} />
                </ReadOnlySection>

                {/* --- SECCIÓN 3: SISTEMA & BIOS --- */}
                <ReadOnlySection title="Software & BIOS" icon={<Monitor className="h-4 w-4" />}>
                    <Field label="Sistema Operativo" value={detalleForm.soDescripcion} />
                    <Field label="Proveedor SO" value={detalleForm.soProveedor} />
                    <Field label="Licencia Activa" value={detalleForm.soLicenciaActiva} />
                    <Field label="BIOS Fabricante" value={detalleForm.biosFabricante} />
                    <Field label="BIOS Versión" value={detalleForm.biosVersion} />
                    <Field label="BIOS Fecha" value={detalleForm.biosFechaStr} />
                    <Field label="Modo UEFI" value={detalleForm.arranqueUefiPresente} />
                    <Field label="Secure Boot" value={detalleForm.secureBootActivo} />
                    <Field label="TPM Presente" value={detalleForm.tpmPresente} />
                </ReadOnlySection>

                {/* --- SECCIÓN 4: PLACA & GRÁFICOS --- */}
                <ReadOnlySection title="Placa Base & Gráficos" icon={<Box className="h-4 w-4" />}>
                    <Field label="Mainboard" value={detalleForm.mainboardModelo} />
                    <Field label="Chipset" value={detalleForm.chipset} />
                    <Field label="GPU / Gráfica" value={detalleForm.gpuNombre} />
                    <Field label="Tipo Gráfica" value={detalleForm.graficaTipo} />
                    <Field label="Versión PCI-E" value={detalleForm.pciExpressVersion} />
                    <Field label="Versión USB" value={detalleForm.usbVersion} />
                </ReadOnlySection>

                {/* --- SECCIÓN 5: RED & CONECTIVIDAD --- */}
                <ReadOnlySection title="Red & Conectividad" icon={<Wifi className="h-4 w-4" />}>
                    <Field label="Adaptador Red" value={detalleForm.adaptadorRed} />
                    <Field label="MAC Address" value={detalleForm.macAddress} />
                    <Field label="Velocidad Actual" value={detalleForm.wifiLinkSpeedActual} />
                    <Field label="WiFi Funcional" value={detalleForm.wifiFunciona} />
                    <Field label="Obs. WiFi" value={detalleForm.wifiObservaciones} />
                </ReadOnlySection>

                {/* --- SECCIÓN 6: ESTADO FÍSICO --- */}
                <ReadOnlySection title="Inspección Física" icon={<Shield className="h-4 w-4" />}>
                    <Field label="Marca/Modelo (Físico)" value={`${detalleForm.equipoMarca || ''} ${detalleForm.equipoModelo || ''}`} />
                    <Field label="N° Serie Chasis" value={detalleForm.equipoSerie} />
                    <Field label="Estado Carcasa" value={detalleForm.carcasaEstado} />
                    <Field label="Roturas" value={detalleForm.equipoRoturas} />
                    <Field label="Desgaste" value={detalleForm.equipoMarcasDesgaste} />
                    <Field label="Tornillos Faltantes" value={detalleForm.tornillosFaltantes} />
                    <div className="col-span-full mt-2 bg-white p-2 rounded border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Observaciones Carcasa</span>
                        <p className="text-xs text-slate-700">{detalleForm.carcasaObservaciones || "-"}</p>
                    </div>
                </ReadOnlySection>

                {/* --- SECCIÓN 7: PERIFÉRICOS --- */}
                <ReadOnlySection title="Periféricos (Teclado/Touchpad/Pantalla)" icon={<Keyboard className="h-4 w-4" />}>
                    <Field label="Estado Teclado" value={detalleForm.tecladoEstado} />
                    <Field label="Teclas Dañadas" value={detalleForm.tecladoTeclasDanadas} />
                    <Field label="Retroiluminación" value={detalleForm.tecladoRetroiluminacion} />

                    <Field label="Estado Pantalla" value={detalleForm.pantallaObservaciones ? "Ver obs." : "Normal"} />
                    <Field label="Rayones" value={detalleForm.pantallaRayones} />
                    <Field label="Pixeles Muertos" value={detalleForm.pantallaPixelesMuertos} />

                    <Field label="Estado Touchpad" value={detalleForm.touchpadEstado} />
                    <Field label="Funciona" value={detalleForm.touchpadFunciona} />
                </ReadOnlySection>

                {/* --- SECCIÓN 8: ENERGÍA --- */}
                <ReadOnlySection title="Energía (Batería/Cargador)" icon={<Battery className="h-4 w-4" />}>
                    <Field label="Cargador Código" value={detalleForm.cargadorCodigo} />
                    <Field label="Estado Cable" value={detalleForm.cargadorEstadoCable} />
                    <Field label="Voltaje Medido" value={detalleForm.cargadorVoltajes} />
                    <Field label="Batería Código" value={detalleForm.bateriaCodigo} />
                    <div className="col-span-full">
                        <Field label="Obs. Batería" value={detalleForm.bateriaObservaciones} />
                    </div>
                </ReadOnlySection>

                {/* --- SECCIÓN 9: TRABAJO REALIZADO --- */}
                <div className="bg-slate-800 text-white rounded-xl p-5 shadow-md break-inside-avoid">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-3 border-b border-slate-600 pb-2">Resumen del Trabajo Realizado</h3>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-90">
                        {detalleForm.trabajoRealizado || "No se ha registrado detalle del trabajo realizado."}
                    </p>
                </div>
            </div>

            {/* MODAL XML */}
            {showXml && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-xl">
                        <button
                            onClick={() => setShowXml(false)}
                            className="absolute top-2 right-3 text-gray-500 hover:text-black text-2xl z-10"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-bold mb-4">Actualizar Hardware desde XML</h3>
                        <XmlUploader
                            equipoId={detalleForm.equipoId ?? detalleForm.id}
                        />
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Al subir un XML, se actualizarán los datos de hardware de esta ficha automáticamente.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ===== COMPONENTE: LISTA DE FICHAS POR CLIENTE ===== */
const ListaFichasPorCliente: React.FC<{ clienteCedula: string; onSelectFicha: (id: number) => void }> = ({ clienteCedula, onSelectFicha }) => {
    const [fichas, setFichas] = useState<FichaTecnicaResumenDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFichas = useCallback(async () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            const res = await fetch(`${FICHAS_API_BASE}/cliente/${clienteCedula}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 404 || res.status === 204) {
                setFichas([]);
                return;
            }

            if (!res.ok) throw new Error("Error al cargar el historial.");
            const data = await res.json();
            const lista = Array.isArray(data) ? data : [data];
            setFichas(lista.sort((a: any, b: any) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));

        } catch (err: any) {
            console.error(err);
            setFichas([]);
        } finally {
            setLoading(false);
        }
    }, [clienteCedula]);

    useEffect(() => {
        if (clienteCedula) fetchFichas();
    }, [fetchFichas, clienteCedula]);

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
                <p className="text-xs text-slate-500">Cédula: {clienteCedula} • Fichas encontradas: {fichas.length}</p>
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
                                    {new Date(ficha.fechaCreacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
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

/* ===== MODAL FICHA TÉCNICA (WRAPPER) ===== */
interface FichaModalProps {
    open: boolean;
    onClose: () => void;
    clienteCedula: string;
}

function FichaTecnicaModal({ open, onClose, clienteCedula }: FichaModalProps) {
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null);

    useEffect(() => {
        if (open) {
            setViewMode('list');
            setSelectedFichaId(null);
        }
    }, [open]);

    if (!open) return null;

    const handleSelectFicha = (id: number) => {
        setSelectedFichaId(id);
        setViewMode('detail');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedFichaId(null);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">

                {viewMode === 'list' && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-500 hover:bg-rose-100 hover:text-rose-600 backdrop-blur shadow-sm transition-colors border border-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}

                <div className="h-full w-full overflow-hidden bg-slate-50/50 flex flex-col">
                    {viewMode === 'list' && (
                        <div className="h-full overflow-y-auto p-6 pt-16 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                            <ListaFichasPorCliente
                                clienteCedula={clienteCedula}
                                onSelectFicha={handleSelectFicha}
                            />
                        </div>
                    )}

                    {viewMode === 'detail' && selectedFichaId && (
                        /* CORRECCIÓN: Quitamos el scroll de este contenedor para que lo maneje el componente DetalleFichaVista internamente */
                        <div className="h-full w-full overflow-hidden bg-white">
                            <DetalleFichaVista
                                fichaId={selectedFichaId}
                                onBack={handleBack}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ===== COMPONENTE PRINCIPAL DE LA PÁGINA ===== */
export default function OrdenesTrabajoPage() {
    const router = useRouter();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const [ordenes, setOrdenes] = useState<OrdenTrabajoListaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [detalle, setDetalle] = useState<OrdenTrabajoDetalleDTO | null>(null);
    const [imagenesDetalle, setImagenesDetalle] = useState<ImagenDTO[]>([]);
    const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
    const [categoriaImg, setCategoriaImg] = useState<string>("INGRESO");
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    const [pasoActivo, setPasoActivo] = useState<Paso>(1);
    const [guardando, setGuardando] = useState(false);

    // Campos editables
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

    // Crear OT
    const [showCrear, setShowCrear] = useState(false);
    const [crearLoading, setCrearLoading] = useState(false);
    const [listaClientes, setListaClientes] = useState<Usuario[]>([]);
    const [listaTecnicos, setListaTecnicos] = useState<Usuario[]>([]);
    const [equiposDelCliente, setEquiposDelCliente] = useState<EquipoSimpleDTO[]>([]);
    const [loadingEquipos, setLoadingEquipos] = useState(false);

    const [formCrear, setFormCrear] = useState<CrearOrdenFormState>({
        clienteCedula: "", tecnicoCedula: "", equipoId: "", medioContacto: "",
        contrasenaEquipo: "", accesorios: "", problemaReportado: "", observacionesIngreso: "",
        tipoServicio: "DIAGNOSTICO", prioridad: "MEDIA",
    });

    const [showNotifModal, setShowNotifModal] = useState(false);
    const [notifOtId, setNotifOtId] = useState<number | null>(null);
    const [showFichaModal, setShowFichaModal] = useState(false);

    // ✅ Solo necesitamos la cédula para el historial
    const [fichaClienteCedula, setFichaClienteCedula] = useState<string>("");

    const subtotalCalculado = costoManoObra + costoRepuestos + costoOtros - descuento;
    const totalCalculado = subtotalCalculado + iva;

    const fmt = (v: unknown) => (v === null || v === undefined || v === "") ? "-" : String(v);
    const fmtFecha = (iso?: string | null) => iso ? new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) : "-";
    const fmtMoney = (n?: number | null) => (n === null || n === undefined) ? "$0.00" : `$${n.toFixed(2)}`;
    const toNumber = (value: string): number => (value.trim() === "" || isNaN(Number(value))) ? 0 : Number(value);

    const fetchOrdenes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(buildUrl(""), { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Error cargando órdenes");
            const data: OrdenTrabajoListaDTO[] = await res.json();
            setOrdenes(data.sort((a, b) => b.id - a.id));
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    }, [token]);

    const fetchCombos = async () => {
        if (!token) return;
        try {
            const resUsers = await fetch("http://localhost:8080/api/usuarios", { headers: { Authorization: `Bearer ${token}` } });
            const usuarios: Usuario[] = await resUsers.json();
            setListaClientes(usuarios.filter(u => u.rol?.nombre === "ROLE_CLIENTE"));
            setListaTecnicos(usuarios.filter(u => u.rol?.nombre === "ROLE_TECNICO"));
        } catch (err) { console.error("Error combos:", err); }
    };

    useEffect(() => { fetchOrdenes(); fetchCombos(); }, [fetchOrdenes]);

    useEffect(() => {
        if (formCrear.clienteCedula) {
            setLoadingEquipos(true);
            setEquiposDelCliente([]);
            setFormCrear(prev => ({ ...prev, equipoId: "" }));
            fetch(`${EQUIPOS_API_BASE}/cliente/${formCrear.clienteCedula}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : [])
                .then(data => setEquiposDelCliente(data))
                .catch(() => setEquiposDelCliente([]))
                .finally(() => setLoadingEquipos(false));
        } else {
            setEquiposDelCliente([]);
            setFormCrear(prev => ({ ...prev, equipoId: "" }));
        }
    }, [formCrear.clienteCedula, token]);

    const abrirDetalle = async (id: number) => {
        try {
            const res = await fetch(buildUrl(`/${id}/detalle`), { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Error cargando detalle");
            const data: OrdenTrabajoDetalleDTO = await res.json();
            setDetalle(data);
            sincronizarDetalleEditable(data);
            await fetchImagenes(id);
        } catch (e: any) { alert(e.message); }
    };

    const fetchImagenes = async (ordenId: number) => {
        try {
            const res = await fetch(buildUrl(`/${ordenId}/imagenes`), { headers: { Authorization: `Bearer ${token}` } });
            if (res.status === 204) { setImagenesDetalle([]); return; }
            if (!res.ok) throw new Error("Error img");
            const data: ImagenDTO[] = await res.json();
            setImagenesDetalle(data);
        } catch (e) { setImagenesDetalle([]); }
    };

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
        setReferenciaGarantia(data.referenciaOrdenGarantia != null ? String(data.referenciaOrdenGarantia) : "");
        setMotivoCierre(data.motivoCierre ?? "");
        setCerradaPor(data.cerradaPor ?? "");
        setOtpCodigo(data.otpCodigo ?? "");
        setOtpValidado(!!data.otpValidado);
        setOtpMensaje(null);
        setOtpEnviando(false);
        setOtpVerificando(false);
        setPasoActivo(mapEstadoToPaso(data.estado ?? "INGRESO"));
    };

    const guardarCambiosOrden = async (esCierre: boolean = false) => {
        if (!detalle || !token) return;
        setGuardando(true);
        const payload = {
            tipoServicio: tipoServicioEdit,
            prioridad: prioridadEdit,
            estado: esCierre ? "CERRADA" : estadoEdit,
            diagnosticoTrabajo: diagEdit.trim(),
            observacionesRecomendaciones: obsRecEdit.trim(),
            costoManoObra, costoRepuestos, costoOtros, descuento,
            subtotal: subtotalCalculado, iva, total: totalCalculado,
            esEnGarantia, referenciaOrdenGarantia: referenciaGarantia ? Number(referenciaGarantia) : null,
            motivoCierre: motivoCierre.trim() || null, cerradaPor: cerradaPor.trim() || null,
            otpCodigo: otpCodigo.trim() || null, otpValidado,
            cerrarOrden: esCierre,
        };

        try {
            const res = await fetch(buildUrl(`/${detalle.ordenId}/entrega`), {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Error guardando");
            alert(esCierre ? "✅ Orden cerrada" : "✅ Guardado");
            await abrirDetalle(detalle.ordenId);
            await fetchOrdenes();
        } catch (e: any) { alert("Error: " + e.message); } finally { setGuardando(false); }
    };

    const cerrarOrden = async () => {
        if (!detalle) return;
        if (pasoActivo !== 4) { alert("Ve al paso 4 para cerrar."); return; }
        if (!diagEdit.trim()) { alert("Falta diagnóstico."); return; }
        if (totalCalculado <= 0 && !esEnGarantia && !confirm("Total $0. ¿Cerrar?")) return;
        if (!motivoCierre.trim()) { alert("Indica motivo cierre."); return; }
        if (!otpValidado && !confirm("OTP no validado. ¿Cerrar?")) return;
        await guardarCambiosOrden(true);
    };

    const handleEnviarOtp = async () => {
        if (!detalle || !token) return;
        setOtpEnviando(true); setOtpMensaje(null);
        try {
            const res = await fetch(`${OTP_API_BASE}/generar`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ cedula: Number(detalle.clienteCedula), correo: detalle.clienteCorreo }),
            });
            if (!res.ok) throw new Error("Error enviando OTP");
            setOtpMensaje("✅ OTP enviado.");
        } catch (e: any) { setOtpMensaje("❌ " + e.message); } finally { setOtpEnviando(false); }
    };

    const handleValidarOtp = async () => {
        if (!detalle || !token) return;
        setOtpVerificando(true); setOtpMensaje(null);
        try {
            const res = await fetch(`${OTP_API_BASE}/validar`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ cedula: Number(detalle.clienteCedula), codigo: otpCodigo }),
            });
            if (!res.ok) throw new Error("OTP Inválido");
            setOtpValidado(true); setOtpMensaje("✅ Validado.");
        } catch (e: any) { setOtpValidado(false); setOtpMensaje("❌ " + e.message); } finally { setOtpVerificando(false); }
    };

    const subirImagenes = async () => {
        if (!detalle || imagenesNuevas.length === 0) return;
        try {
            const formData = new FormData();
            imagenesNuevas.forEach((f) => formData.append("files", f));
            formData.append("categoria", categoriaImg);
            const res = await fetch(buildUrl(`/${detalle.ordenId}/imagenes`), {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
            });
            if (!res.ok) throw new Error("Error subiendo");
            alert("📸 Imágenes subidas");
            setImagenesNuevas([]);
            await fetchImagenes(detalle.ordenId);
        } catch (e) { alert("Error al subir imagen"); }
    };

    const crearOrden = async () => {
        if (!token) return;
        if (!formCrear.clienteCedula || !formCrear.equipoId || !formCrear.tipoServicio) {
            alert("Completa Cliente, Equipo y Tipo Servicio."); return;
        }
        setCrearLoading(true);
        try {
            const payload = { ...formCrear, equipoId: Number(formCrear.equipoId) };
            const res = await fetch(buildUrl(""), {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Error creando orden");
            alert("✅ Orden creada");
            setShowCrear(false);
            setFormCrear({ clienteCedula: "", tecnicoCedula: "", equipoId: "", medioContacto: "", contrasenaEquipo: "", accesorios: "", problemaReportado: "", observacionesIngreso: "", tipoServicio: "DIAGNOSTICO", prioridad: "MEDIA" });
            await fetchOrdenes();
        } catch (e: any) { alert(e.message); } finally { setCrearLoading(false); }
    };

    const handleCrearChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormCrear({ ...formCrear, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 font-sans">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Laptop className="h-6 w-6 text-slate-700" /> Órdenes de Trabajo</h1>
                        <p className="mt-1 text-sm text-slate-500">Gestión integral de servicio técnico.</p>
                    </div>
                    <Button onClick={() => setShowCrear(true)} className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                    </Button>
                </div>

                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

                {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div> :
                    ordenes.length === 0 ? <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500"><Wrench className="h-8 w-8 mb-2 opacity-20" /><p>No hay órdenes registradas.</p></div> :
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {ordenes.map((ot) => (
                                <Card key={ot.id} className="group cursor-pointer border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99]" onDoubleClick={() => abrirDetalle(ot.id)}>
                                    <CardHeader className="pb-3 pt-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orden #{ot.numeroOrden}</span><CardTitle className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">{ot.equipoModelo || "Equipo Desconocido"}</CardTitle></div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getBadgeColor('estado', ot.estado)}`}>{ot.estado}</div>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getBadgeColor('prioridad', ot.prioridad)}`}>{ot.prioridad}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getBadgeColor('servicio', ot.tipoServicio)}`}>{ot.tipoServicio}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-slate-600"><User className="h-3.5 w-3.5 text-slate-400" /><span className="truncate font-medium">{ot.clienteNombre}</span></div>
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100"><p className="text-xs text-slate-500 line-clamp-2 italic">"{ot.problemaReportado}"</p></div>
                                            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                                                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{fmtFecha(ot.fechaHoraIngreso)}</span>
                                                <Button variant="outline" size="sm" className="h-7 border-slate-300 text-[10px] px-2 flex gap-1 items-center" onClick={(e) => { e.stopPropagation(); setFichaClienteCedula(ot.clienteCedula || ""); setShowFichaModal(true); }}>
                                                    <FileText className="h-3 w-3" /> Historial
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                }
            </div>

            {/* Modal Crear */}
            {showCrear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
                            <div><h2 className="text-lg font-bold">Nueva Orden</h2><p className="text-xs text-slate-400">Datos de recepción.</p></div>
                            <button onClick={() => setShowCrear(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Cliente *</label>
                                    <Select onValueChange={(val) => setFormCrear(prev => ({ ...prev, clienteCedula: val }))} value={formCrear.clienteCedula}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Buscar cliente..." /></SelectTrigger>
                                        <SelectContent>{listaClientes.map(c => <SelectItem key={c.cedula} value={c.cedula}>{c.nombre} ({c.cedula})</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Técnico</label>
                                    <Select onValueChange={(val) => setFormCrear(prev => ({ ...prev, tecnicoCedula: val }))} value={formCrear.tecnicoCedula}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Seleccionar técnico..." /></SelectTrigger>
                                        <SelectContent>{listaTecnicos.map(t => <SelectItem key={t.cedula} value={t.cedula}>{t.nombre}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500 flex justify-between">Equipo * {loadingEquipos && <Loader2 className="h-3 w-3 animate-spin" />}</label>
                                    <Select onValueChange={(val) => setFormCrear(prev => ({ ...prev, equipoId: val }))} value={formCrear.equipoId} disabled={!formCrear.clienteCedula}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder={formCrear.clienteCedula ? "Seleccionar equipo..." : "Primero elige un cliente"} /></SelectTrigger>
                                        <SelectContent>{equiposDelCliente.length > 0 ? equiposDelCliente.map(eq => <SelectItem key={eq.id} value={String(eq.id)}>{eq.nombre} - <span className="text-slate-400 text-xs">{eq.marca} ({eq.codigo})</span></SelectItem>) : <div className="p-2 text-xs text-slate-500 text-center">Sin equipos</div>}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 w-full" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Tipo Servicio *</label>
                                    <Select value={formCrear.tipoServicio} onValueChange={(v) => setFormCrear(p => ({ ...p, tipoServicio: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{["INGRESO", "DIAGNOSTICO", "MANTENIMIENTO", "REPARACION", "FORMATEO", "OTRO"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Prioridad *</label>
                                    <Select value={formCrear.prioridad} onValueChange={(v) => setFormCrear(p => ({ ...p, prioridad: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="BAJA">Baja</SelectItem><SelectItem value="MEDIA">Media</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="URGENTE">Urgente</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Medio Contacto</label><Input name="medioContacto" value={formCrear.medioContacto} onChange={handleCrearChange} /></div>
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Contraseña</label><Input name="contrasenaEquipo" value={formCrear.contrasenaEquipo} onChange={handleCrearChange} placeholder="****" /></div>
                            </div>
                            <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Accesorios</label><Input name="accesorios" value={formCrear.accesorios} onChange={handleCrearChange} /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Problema *</label><textarea name="problemaReportado" value={formCrear.problemaReportado} onChange={handleCrearChange} rows={3} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none" /></div>
                                <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Observaciones</label><textarea name="observacionesIngreso" value={formCrear.observacionesIngreso} onChange={handleCrearChange} rows={3} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none" /></div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 shrink-0 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setShowCrear(false)}>Cancelar</Button>
                            <Button className="bg-slate-900 text-white" onClick={crearOrden} disabled={crearLoading}>{crearLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal Detalle OT */}
            {detalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
                    <div className="relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl border border-slate-200">
                        <header className="flex flex-col gap-4 bg-slate-900 px-6 py-4 text-white shrink-0 z-10">
                            <div className="flex justify-between items-start">
                                <div><h2 className="text-xl font-bold flex items-center gap-2"><span className="text-slate-400 font-normal text-base">#{detalle.numeroOrden}</span> {detalle.equipoModelo}</h2><p className="text-xs text-slate-400 mt-1">Cliente: {detalle.clienteNombre}</p></div>
                                <button onClick={() => setDetalle(null)} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></button>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <Select value={estadoEdit} onValueChange={(v) => { setEstadoEdit(v); setPasoActivo(mapEstadoToPaso(v)); }}><SelectTrigger className="h-8 border-slate-600 bg-slate-800 text-xs text-white w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{["INGRESO", "EN_DIAGNOSTICO", "EN_REPARACION", "LISTA_ENTREGA"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    <Select value={prioridadEdit} onValueChange={setPrioridadEdit}><SelectTrigger className="h-8 border-slate-600 bg-slate-800 text-xs text-white w-[110px]"><SelectValue /></SelectTrigger><SelectContent>{["BAJA", "MEDIA", "ALTA", "URGENTE"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="h-8 text-xs bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700" onClick={() => { setFichaClienteCedula(detalle.clienteCedula || ""); setShowFichaModal(true); }}><FileText className="mr-2 h-3 w-3" /> Fichas</Button>
                                    <Button variant="secondary" size="sm" className="h-8 text-xs bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700" onClick={() => router.push(`/firma?ordenId=${detalle.ordenId}&modo=aceptacion`)}><Signature className="mr-2 h-3 w-3" /> Firmas</Button>
                                </div>
                            </div>
                            <div className="flex w-full gap-1 mt-2">
                                {[1, 2, 3, 4].map((step) => <div key={step} className={`h-1 flex-1 rounded-full transition-all duration-300 ${pasoActivo >= step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />)}
                            </div>
                        </header>

                        {/* CUERPO DEL MODAL CON SCROLL */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-full">
                                <div className="p-6 space-y-6">
                                    {pasoActivo === 1 && (
                                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300"><h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-2">Paso 1: Revisión de Ingreso</h3><div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4"><div><span className="text-xs font-bold text-slate-500 uppercase">Problema Reportado</span><p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{detalle.problemaReportado}</p></div><div className="grid grid-cols-2 gap-4"><div><span className="text-xs font-bold text-slate-500 uppercase">Accesorios</span><p className="text-sm text-slate-800">{detalle.modalidad || "Ninguno"}</p></div><div><span className="text-xs font-bold text-slate-500 uppercase">Observaciones Físicas</span><p className="text-sm text-slate-800">{detalle.observacionesIngreso || "Ninguna"}</p></div></div></div><div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => setPasoActivo(2)}>Continuar al Diagnóstico</Button></div></div>
                                    )}
                                    {pasoActivo === 2 && (
                                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300"><h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-2">Paso 2: Diagnóstico Técnico</h3><div className="space-y-4"><div><label className="text-xs font-semibold text-slate-600 mb-1 block">Diagnóstico y Trabajo Realizado</label><textarea value={diagEdit} onChange={e => setDiagEdit(e.target.value)} className="w-full min-h-[120px] p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe detalladamente el trabajo técnico..." /></div><div><label className="text-xs font-semibold text-slate-600 mb-1 block">Recomendaciones Finales</label><textarea value={obsRecEdit} onChange={e => setObsRecEdit(e.target.value)} className="w-full min-h-[80px] p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Notas para el cliente..." /></div></div><div className="flex justify-between"><Button size="sm" variant="ghost" onClick={() => setPasoActivo(1)}>Atrás</Button><Button size="sm" variant="outline" onClick={() => setPasoActivo(3)}>Ir a Costos</Button></div></div>
                                    )}
                                    {pasoActivo === 3 && (
                                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300"><h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-2">Paso 3: Costos y Facturación</h3><div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto"><div className="space-y-3"><div className="flex items-center justify-between"><label className="text-xs font-medium text-slate-600">Mano de Obra</label><div className="flex items-center gap-2"><span className="text-slate-400">$</span><Input type="number" className="h-8 w-24 text-right" value={costoManoObra} onChange={e => setCostoManoObra(toNumber(e.target.value))} /></div></div><div className="flex items-center justify-between"><label className="text-xs font-medium text-slate-600">Repuestos</label><div className="flex items-center gap-2"><span className="text-slate-400">$</span><Input type="number" className="h-8 w-24 text-right" value={costoRepuestos} onChange={e => setCostoRepuestos(toNumber(e.target.value))} /></div></div><div className="flex items-center justify-between"><label className="text-xs font-medium text-slate-600">Otros</label><div className="flex items-center gap-2"><span className="text-slate-400">$</span><Input type="number" className="h-8 w-24 text-right" value={costoOtros} onChange={e => setCostoOtros(toNumber(e.target.value))} /></div></div><div className="h-px bg-slate-100 my-2" /><div className="flex items-center justify-between"><label className="text-xs font-medium text-red-500">Descuento</label><div className="flex items-center gap-2"><span className="text-red-300">- $</span><Input type="number" className="h-8 w-24 text-right text-red-600" value={descuento} onChange={e => setDescuento(toNumber(e.target.value))} /></div></div><div className="flex items-center justify-between pt-2"><span className="text-sm font-bold text-slate-700">Subtotal</span><span className="text-sm font-bold text-slate-800">{fmtMoney(subtotalCalculado)}</span></div><div className="flex items-center justify-between"><label className="text-xs font-medium text-slate-600">IVA</label><div className="flex items-center gap-2"><Input type="number" className="h-8 w-24 text-right" value={iva} onChange={e => setIva(toNumber(e.target.value))} /></div></div><div className="flex items-center justify-between pt-3 border-t border-slate-200"><span className="text-lg font-black text-slate-900">TOTAL</span><span className="text-lg font-black text-indigo-600">{fmtMoney(totalCalculado)}</span></div></div></div><div className="flex justify-between"><Button size="sm" variant="ghost" onClick={() => setPasoActivo(2)}>Atrás</Button><Button size="sm" variant="outline" onClick={() => setPasoActivo(4)}>Ir a Cierre</Button></div></div>
                                    )}
                                    {pasoActivo === 4 && (
                                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300"><h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-2">Paso 4: Validación y Cierre</h3><div className="grid gap-6"><div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"><div className="flex h-5 items-center"><input id="garantia" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" checked={esEnGarantia} onChange={(e) => setEsEnGarantia(e.target.checked)} /></div><div className="text-sm flex-1"><label htmlFor="garantia" className="font-medium text-slate-900 block">Aplicar Garantía</label><p className="text-slate-500 text-xs">Si se marca, se debe referenciar la orden original.</p></div>{esEnGarantia && (<Input placeholder="Ref. Orden ID" className="w-32 h-8 text-xs" value={referenciaGarantia} onChange={e => setReferenciaGarantia(e.target.value)} />)}</div><div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Verificación de Entrega (OTP)</h4><div className="flex gap-2 mb-2"><Button size="sm" variant="secondary" className="bg-white border border-slate-300 text-slate-700 w-full" onClick={handleEnviarOtp} disabled={otpEnviando || otpValidado}>{otpEnviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "📧 Enviar Código"}</Button></div><div className="flex gap-2"><Input value={otpCodigo} onChange={e => setOtpCodigo(e.target.value)} placeholder="Código OTP" className="bg-white" disabled={otpValidado} /><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleValidarOtp} disabled={otpValidado || !otpCodigo || otpVerificando}>{otpVerificando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}</Button></div>{otpMensaje && <p className="text-xs mt-2 font-medium text-center text-slate-600">{otpMensaje}</p>}</div><div><label className="text-xs font-semibold text-slate-600 mb-1 block">Motivo de Cierre / Notas de Entrega</label><textarea value={motivoCierre} onChange={e => setMotivoCierre(e.target.value)} className="w-full min-h-[80px] p-3 text-sm border border-slate-300 rounded-md" placeholder="Ej: Equipo entregado a satisfacción..." /></div><Input placeholder="Cerrada por (Nombre)" className="h-9 text-sm" value={cerradaPor} onChange={e => setCerradaPor(e.target.value)} /></div><div className="flex justify-start"><Button size="sm" variant="ghost" onClick={() => setPasoActivo(3)}>Atrás</Button></div></div>
                                    )}
                                </div>
                                <div className="border-l border-slate-200 bg-slate-50/50 p-4 flex flex-col gap-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Upload className="h-3 w-3" /> Evidencia Fotográfica</h3>
                                    <div className="flex-1 overflow-y-auto min-h-[200px] border border-slate-200 rounded-lg bg-white p-2">{imagenesDetalle.length > 0 ? (<div className="grid grid-cols-2 gap-2">{imagenesDetalle.map(img => (<div key={img.id} className="relative group aspect-square rounded overflow-hidden border border-slate-100 cursor-zoom-in" onClick={() => setSelectedImg(`http://localhost:8080${img.ruta}`)}><img src={`http://localhost:8080${img.ruta}`} alt="Evidencia" className="h-full w-full object-cover transition hover:scale-110" /><div className="absolute bottom-0 inset-x-0 bg-black/60 p-1"><p className="text-[9px] text-white truncate text-center">{img.categoria}</p></div></div>))}</div>) : (<div className="h-full flex items-center justify-center text-xs text-slate-400">Sin imágenes</div>)}</div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2"><Select value={categoriaImg} onValueChange={setCategoriaImg}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["INGRESO", "DIAGNOSTICO", "REPARACION", "ENTREGA"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Input type="file" multiple className="h-8 text-xs file:text-xs" onChange={e => setImagenesNuevas(Array.from(e.target.files || []))} /><Button size="sm" className="w-full h-8 text-xs bg-slate-800" onClick={subirImagenes} disabled={imagenesNuevas.length === 0}>Subir Imágenes</Button></div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0 z-10">
                            <Button variant="outline" onClick={() => guardarCambiosOrden(false)} disabled={guardando}><Save className="h-4 w-4 mr-2" /> Guardar Progreso</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={cerrarOrden} disabled={guardando}><CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar y Cerrar Orden</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FICHA TÉCNICA (NUEVO COMPONENTE INTEGRADO) --- */}
            {showFichaModal && fichaClienteCedula && (
                <FichaTecnicaModal
                    open={showFichaModal}
                    onClose={() => setShowFichaModal(false)}
                    clienteCedula={fichaClienteCedula}
                />
            )}

            {/* --- OVERLAY ZOOM IMAGEN --- */}
            {selectedImg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImg(null)}>
                    <img src={selectedImg} alt="Zoom" className="max-h-full max-w-full rounded shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/40"><X /></button>
                </div>
            )}
        </div>
    );
}