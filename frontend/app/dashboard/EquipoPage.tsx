"use client";

import { useEffect, useState, useCallback, ChangeEvent, useMemo, JSX } from "react";
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
    X,
    Search,
    FileUp,
    ChevronLeft,
    ChevronRight,
    Laptop,
    Monitor,
    Cpu,
    HardDrive,
    MemoryStick,
    Wifi,
    User,
    Hash,
    Server,
    Settings,
    CircuitBoard,
    Eye,
    Calendar,
    Building2,
    Tag,
    Layers,
    type LucideIcon,
} from "lucide-react";
import XmlUploader from "./XmlUploader";
import { API_BASE_URL } from "../lib/api";

// --- CONSTANTES ---
const ITEMS_PER_PAGE = 8;
// Asegurarse de que no haya doble slash al concatenar
const API_BASE = `${API_BASE_URL}/api/equipos`;

/* ============================
   CATEGORÍAS DE HARDWARE PARA VISUALIZACIÓN
=============================== */
const HARDWARE_CATEGORIES: { name: string; icon: LucideIcon; keywords: string[]; color: string }[] = [
    { name: "Procesador", icon: Cpu, keywords: ["cpu", "procesador", "processor", "núcleo", "core", "frecuencia"], color: "text-slate-600" },
    { name: "Memoria RAM", icon: MemoryStick, keywords: ["ram", "memoria", "memory", "módulo", "ddr"], color: "text-slate-600" },
    { name: "Almacenamiento", icon: HardDrive, keywords: ["disco", "drive", "ssd", "hdd", "storage", "capacidad", "unidad"], color: "text-slate-600" },
    { name: "Placa Base", icon: CircuitBoard, keywords: ["placa", "mainboard", "motherboard", "chipset", "bios", "uefi"], color: "text-slate-600" },
    { name: "Red", icon: Wifi, keywords: ["red", "network", "wifi", "ethernet", "mac", "adaptador", "enlace"], color: "text-slate-600" },
    { name: "Gráficos", icon: Monitor, keywords: ["gpu", "gráfica", "video", "display", "monitor", "tarjeta grafica"], color: "text-slate-600" },
    { name: "Sistema", icon: Settings, keywords: ["sistema", "operativo", "windows", "linux", "os", "tpm", "secure"], color: "text-slate-600" },
];

/* ============================
   INTERFACES
=============================== */

interface Rol {
    idRol: number;
    nombre: string;
}

interface Usuario {
    cedula: string;
    nombre: string;
    rol?: Rol;
}
interface Equipo {
    // Coincide con EquipoListDto
    idEquipo?: number;      // Campo principal
    id?: number;            // Campo alternativo (backend puede usar este)
    tipo?: string;          // Nuevo campo
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    hostname?: string;      // Nuevo campo
    sistemaOperativo?: string; // Nuevo campo
    propietario?: string;   // EL CAMBIO IMPORTANTE: Ahora es un String, no un objeto

    // Mantenemos este opcional por si el endpoint de "Detalles" trae más info
    hardwareJson?: Record<string, any>;
    // Campos antiguos para compatibilidad con el formulario de creación si es necesario
    cedulaCliente?: string;
}

/* ============================
   COMPONENTE PRINCIPAL
=============================== */

export default function EquipoPage(): JSX.Element {
    /* ============================
       ESTADOS
    =============================== */

    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [clientes, setClientes] = useState<Usuario[]>([]);
    const [tecnicos, setTecnicos] = useState<Usuario[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [detalle, setDetalle] = useState<Equipo | null>(null);
    const [showXml, setShowXml] = useState(false);

    const [numeroSerie, setNumeroSerie] = useState("");
    const [modelo, setModelo] = useState("");
    const [marca, setMarca] = useState("");
    const [cedulaCliente, setCedulaCliente] = useState("");
    const [tecnicoId, setTecnicoId] = useState("");

    const [listaSearch, setListaSearch] = useState("");
    const [hardwareSearch, setHardwareSearch] = useState("");

    // === PAGINACIÓN ===
    const [currentPage, setCurrentPage] = useState(1);

    /* ============================
       TOKEN
    =============================== */

    const getToken = (): string | null =>
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    /* ============================
       CARGAR USUARIOS
    =============================== */

    const fetchUsuarios = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/usuarios`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data: Usuario[] = await res.json();
                setClientes(data.filter((u) => u.rol?.nombre === "ROLE_CLIENTE"));
                setTecnicos(data.filter((u) => u.rol?.nombre === "ROLE_TECNICO"));
            }
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    }, []);

    /* ============================
       CARGAR EQUIPOS (CORREGIDO)
    =============================== */

    const fetchEquipos = useCallback(async (): Promise<void> => {
        const token = getToken();
        if (!token) return;

        try {
            setLoading(true);

            // CORRECCIÓN 1: Usamos API_BASE sin agregar "/" extra al final
            const res = await fetch(API_BASE, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                // Si la API devuelve error (404, 500), lanzamos excepción para ir al catch
                throw new Error(`Error ${res.status}: No se pudieron cargar los equipos.`);
            }

            const data = await res.json();

            // CORRECCIÓN 2: Verificamos que sea array antes de setear el estado
            if (Array.isArray(data)) {
                setEquipos(data);
                setError(null);
            } else {
                console.error("Respuesta inesperada (no es lista):", data);
                setEquipos([]); // Evitamos que map explote
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setEquipos([]); // Limpiamos la lista en caso de error crítico
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEquipos();
        fetchUsuarios();
    }, [fetchEquipos, fetchUsuarios]);

    /* ============================
       CREAR EQUIPO
    =============================== */

    const crearEquipo = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        if (!cedulaCliente) {
            setError("Debe seleccionar un cliente");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    numeroSerie: numeroSerie || `S/N-${Date.now()}`,
                    modelo,
                    marca,
                    cedulaCliente,
                    tecnicoCedula: tecnicoId,
                }),
            });

            if (!res.ok) throw new Error(`Error ${res.status} al crear equipo`);
            if (!tecnicoId) {
                setError("Debe seleccionar un técnico");
                return;
            }

            alert("✅ Equipo creado correctamente");

            setShowForm(false);
            setNumeroSerie("");
            setModelo("");
            setMarca("");
            setCedulaCliente("");
            setTecnicoId("");

            fetchEquipos();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [numeroSerie, modelo, marca, cedulaCliente, tecnicoId, fetchEquipos]);

    /* ============================
       DETALLES DE EQUIPO
    =============================== */
    const verDetalles = async (id: number) => {
        const token = getToken();

        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();

                // --- AGREGA ESTO ---
                console.log("DATOS QUE LLEGAN DEL BACKEND:", data);
                // -------------------

                setDetalle(data);
                setHardwareSearch("");
                setShowXml(false);
            } else {
                alert("No se pudo cargar el detalle del equipo.");
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    /* ============================
         FILTRO LISTA & PAGINACIÓN
       =============================== */

    // 1. Filtrar
    const filteredEquipos = useMemo(() => {
        if (!Array.isArray(equipos)) return [];

        const term = listaSearch.trim().toLowerCase();
        if (!term) return equipos;

        return equipos.filter((eq) => {
            // Ajustamos para buscar en los nuevos campos del DTO
            return (
                (eq.numeroSerie ?? "").toLowerCase().includes(term) ||
                (eq.modelo ?? "").toLowerCase().includes(term) ||
                (eq.marca ?? "").toLowerCase().includes(term) ||
                (eq.propietario ?? "").toLowerCase().includes(term) || // Buscamos por propietario
                (eq.hostname ?? "").toLowerCase().includes(term)
            );
        });
    }, [equipos, listaSearch]);

    // 2. Resetear página al buscar
    useEffect(() => {
        setCurrentPage(1);
    }, [listaSearch]);

    // 3. Calcular datos de la página actual
    const totalPages = Math.ceil(filteredEquipos.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentEquipos = filteredEquipos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    /* ============================
       UI COMPLETA
    =============================== */

    // Función para categorizar campos de hardware
    const categorizeHardwareField = (key: string): { category: string; icon: LucideIcon; color: string } => {
        const keyLower = key.toLowerCase();
        for (const cat of HARDWARE_CATEGORIES) {
            if (cat.keywords.some(kw => keyLower.includes(kw))) {
                return { category: cat.name, icon: cat.icon, color: cat.color };
            }
        }
        return { category: "Otros", icon: Layers, color: "text-gray-600" };
    };

    // Agrupar hardware por categoría
    const groupedHardware = useMemo(() => {
        if (!detalle?.hardwareJson) return {};
        const entries = Object.entries(detalle.hardwareJson);
        const term = hardwareSearch.trim().toLowerCase();
        
        const filtered = term 
            ? entries.filter(([k, v]) => {
                const val = typeof v === "string" ? v : JSON.stringify(v);
                return k.toLowerCase().includes(term) || val.toLowerCase().includes(term);
            })
            : entries;

        const groups: Record<string, Array<[string, unknown]>> = {};
        filtered.forEach(([key, value]) => {
            const { category } = categorizeHardwareField(key);
            if (!groups[category]) groups[category] = [];
            groups[category].push([key, value]);
        });
        return groups;
    }, [detalle?.hardwareJson, hardwareSearch]);

    return (
        <div className="min-h-full h-full bg-gradient-to-br from-slate-50 to-purple-50/30 p-6 space-y-6">
            {/* ===== HEADER PROFESIONAL ===== */}
            <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-500/30">
                        <Laptop className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Gestión de Equipos</h1>
                        <p className="text-purple-600 text-sm font-medium">
                            {equipos.length} equipos registrados
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25"
                >
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Equipo
                </Button>
            </div>

            {/* ===== TABLA PRINCIPAL ===== */}
            <Card className="shadow-sm border border-purple-100">
                <CardHeader className="border-b bg-white">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg text-purple-900">Inventario de Equipos</CardTitle>
                            <CardDescription className="text-purple-600">
                                {filteredEquipos.length} de {equipos.length} equipos
                            </CardDescription>
                        </div>

                        {/* Buscador */}
                        <div className="relative w-72">
                            <Input
                                value={listaSearch}
                                onChange={(e) => setListaSearch(e.target.value)}
                                placeholder="Buscar por serie, modelo, marca..."
                                className="pl-9 h-9 text-sm border-purple-200 bg-purple-50/50 focus-visible:ring-purple-400"
                            />
                            <Search className="h-4 w-4 text-purple-400 absolute left-3 top-2.5" />
                            {listaSearch && (
                                <button
                                    onClick={() => setListaSearch("")}
                                    className="absolute right-3 top-2.5 text-purple-400 hover:text-purple-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {error && (
                        <div className="m-4 text-red-700 text-sm bg-red-50 p-3 rounded border border-red-200">
                            Error: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                    ) : filteredEquipos.length === 0 ? (
                        <div className="text-center py-12 text-purple-600">
                            {listaSearch ? "No hay equipos que coincidan" : "No hay equipos registrados"}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-purple-50 to-indigo-50/50 border-b border-purple-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-purple-700">ID</th>
                                            <th className="px-4 py-3 text-left font-medium text-purple-700">Identificación</th>
                                            <th className="px-4 py-3 text-left font-medium text-purple-700">Equipo</th>
                                            <th className="px-4 py-3 text-left font-medium text-purple-700">Propietario</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-purple-50">
                                        {currentEquipos.map((eq, index) => {
                                            const equipoId = eq.idEquipo || eq.id;
                                            return (
                                                <tr
                                                    key={equipoId ?? `fallback-key-${index}`}
                                                    onDoubleClick={() => equipoId && verDetalles(equipoId)}
                                                    className="hover:bg-purple-50/50 cursor-pointer transition-colors"
                                                    title="Doble clic para ver detalles"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                                            {equipoId || "—"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-800">{eq.numeroSerie || "S/N"}</span>
                                                            {eq.hostname && (
                                                                <span className="text-xs text-purple-600">{eq.hostname}</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-800">
                                                                {eq.marca || "—"} {eq.modelo ? `/ ${eq.modelo}` : ""}
                                                            </span>
                                                            {eq.sistemaOperativo && (
                                                                <span className="text-xs text-slate-500">{eq.sistemaOperativo}</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-slate-700">
                                                        {eq.propietario || "Sin asignar"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 italic">Doble clic en una fila para ver detalles</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-600">
                                        {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredEquipos.length)} de {filteredEquipos.length}
                                    </span>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="h-8 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="px-3 text-sm text-indigo-600 min-w-[60px] text-center font-medium">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="h-8 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ===== MODAL NUEVO EQUIPO ===== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg relative shadow-lg">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-slate-800">Nuevo Equipo</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del formulario */}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Número de Serie</label>
                                    <Input
                                        placeholder="Ej: SN123456"
                                        value={numeroSerie}
                                        onChange={(e) => setNumeroSerie(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Marca</label>
                                    <Input
                                        placeholder="Ej: Dell, HP"
                                        value={marca}
                                        onChange={(e) => setMarca(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Modelo</label>
                                    <Input
                                        placeholder="Ej: Latitude 5520"
                                        value={modelo}
                                        onChange={(e) => setModelo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Cliente *</label>
                                    <select
                                        value={cedulaCliente}
                                        onChange={(e) => setCedulaCliente(e.target.value)}
                                        className="w-full h-10 border border-slate-300 rounded-md px-3 bg-white text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {clientes.map((c) => (
                                            <option key={c.cedula} value={c.cedula}>
                                                {c.nombre} — {c.cedula}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Técnico *</label>
                                    <select
                                        value={tecnicoId}
                                        onChange={(e) => setTecnicoId(e.target.value)}
                                        className="w-full h-10 border border-slate-300 rounded-md px-3 bg-white text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {tecnicos.map((t) => (
                                            <option key={t.cedula} value={t.cedula}>
                                                {t.nombre} — {t.cedula}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer del modal */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
                            <Button variant="outline" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={crearEquipo}
                                disabled={loading}
                                className="bg-slate-800 hover:bg-slate-700"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Crear Equipo
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL DETALLES ===== */}
            {detalle && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] relative flex flex-col shadow-xl border border-slate-200">
                        
                        {/* Header con gradiente indigo/purple */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-t-xl flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                    <Laptop className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        Equipo #{detalle.idEquipo || (detalle as any).id || "—"}
                                    </h2>
                                    <p className="text-sm text-slate-500 truncate max-w-md">
                                        {[detalle.marca, detalle.modelo].filter(Boolean).join(" ") || "Sin marca/modelo"} — {detalle.numeroSerie || "S/N"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setDetalle(null);
                                    setShowXml(false);
                                }}
                                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido scrolleable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {/* Info básica en tarjetas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                    <p className="text-xs text-indigo-600 uppercase tracking-wide font-medium mb-1">Número de Serie</p>
                                    <p className="text-sm font-medium text-slate-800">{detalle.numeroSerie || "—"}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                    <p className="text-xs text-indigo-600 uppercase tracking-wide font-medium mb-1">Marca / Modelo</p>
                                    <p className="text-sm font-medium text-slate-800">{detalle.marca || "—"} / {detalle.modelo || "—"}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                    <p className="text-xs text-indigo-600 uppercase tracking-wide font-medium mb-1">Cliente</p>
                                    <p className="text-sm font-medium text-slate-800">{detalle.cedulaCliente || "Sin asignar"}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                    <p className="text-xs text-indigo-600 uppercase tracking-wide font-medium mb-1">Hostname</p>
                                    <p className="text-sm font-medium text-slate-800">{detalle.hostname || "—"}</p>
                                </div>
                            </div>

                            {/* Hardware */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-100 to-indigo-50/30 border-b border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <CircuitBoard className="h-5 w-5 text-indigo-600" />
                                        <h3 className="font-semibold text-slate-800">Información de Hardware</h3>
                                    </div>
                                    <div className="relative w-64">
                                        <Input
                                            value={hardwareSearch}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setHardwareSearch(e.target.value)
                                            }
                                            placeholder="Buscar componente..."
                                            className="pl-9 h-9 text-sm bg-white border-slate-300 focus:border-indigo-400 focus:ring-indigo-400/20"
                                        />
                                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                                    </div>
                                </div>

                                {detalle.hardwareJson ? (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        {Object.keys(groupedHardware).length === 0 ? (
                                            <div className="py-12 text-center text-slate-400">
                                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>Sin coincidencias</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {Object.entries(groupedHardware).map(([category, items]) => {
                                                    const catInfo = HARDWARE_CATEGORIES.find(c => c.name === category);
                                                    const CategoryIcon = catInfo?.icon || Layers;
                                                    
                                                    return (
                                                        <div key={category} className="p-5">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                                    <CategoryIcon className="h-4 w-4 text-indigo-600" />
                                                                </div>
                                                                <span className="text-sm font-semibold text-slate-700">{category}</span>
                                                                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">({items.length})</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                {items.map(([key, value]) => (
                                                                    <div
                                                                        key={key}
                                                                        className="flex flex-col p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors"
                                                                    >
                                                                        <span className="text-xs text-indigo-600 font-medium">{key}</span>
                                                                        <span className="text-sm text-slate-800 mt-0.5">
                                                                            {typeof value === "string" ? value : JSON.stringify(value)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <Laptop className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Sin información de hardware</p>
                                        <p className="text-xs mt-1">Carga un archivo XML para importar datos</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex-shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDetalle(null);
                                    setShowXml(false);
                                }}
                                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                                Cerrar
                            </Button>
                            <Button
                                onClick={() => setShowXml(true)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25"
                            >
                                <FileUp className="h-4 w-4 mr-2" />
                                Cargar XML
                            </Button>
                        </div>

                        {/* Modal XML */}
                        {showXml && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                                <div className="bg-white rounded-lg w-full max-w-2xl relative shadow-lg">
                                    <div className="flex items-center justify-between px-6 py-4 border-b">
                                        <h3 className="font-semibold text-slate-800">Cargar archivo XML</h3>
                                        <button
                                            onClick={() => setShowXml(false)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <XmlUploader
                                            equipoId={detalle.idEquipo || (detalle as any).id}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}