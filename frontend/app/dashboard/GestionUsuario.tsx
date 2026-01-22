"use client";

import { useEffect, useState, useCallback, ChangeEvent, useMemo, JSX, useRef } from "react";
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
    Check,
    ChevronsUpDown
} from "lucide-react";
import XmlUploader from "./XmlUploader";
import { API_BASE_URL } from "../lib/api";

// --- CONSTANTES ---
const ITEMS_PER_PAGE = 6;
// Asegurarse de que no haya doble slash al concatenar
const API_BASE = `${API_BASE_URL}/api/equipos`;

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
    idEquipo: number;       // Antes id o equipoId
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
       HARDWARE
    =============================== */

    const getHardwareEntries = () => {
        if (!detalle?.hardwareJson) return [];
        const entries = Object.entries(detalle.hardwareJson);
        const term = hardwareSearch.trim().toLowerCase();
        if (!term) return entries;
        return entries.filter(([k, v]) => {
            const val = typeof v === "string" ? v : JSON.stringify(v);
            return (
                k.toLowerCase().includes(term) || val.toLowerCase().includes(term)
            );
        });
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

    return (
        // FIX CRÍTICO: Usar altura calculada y flex-col para evitar desbordamiento fuera del layout
        <div className="flex flex-col h-[calc(100vh-100px)] w-full p-6 gap-6 overflow-hidden">

            {/* HEADER (shrink-0 para que no se aplaste) */}
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-bold">Gestión de Equipos 💻</h1>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Nuevo Equipo
                </Button>
            </div>

            {/* TABLA PRINCIPAL (flex-1 para ocupar el resto, min-h-0 para activar scroll interno) */}
            <Card className="flex flex-col flex-1 min-h-0 shadow-sm border-slate-200">
                <CardHeader className="shrink-0 border-b border-slate-100 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Lista de equipos</CardTitle>
                            <CardDescription>
                                Visualiza todos los equipos registrados.
                            </CardDescription>
                        </div>

                        {/* Buscador */}
                        <div className="relative w-64">
                            <Input
                                value={listaSearch}
                                onChange={(e) => setListaSearch(e.target.value)}
                                placeholder="Buscar por serie, modelo, cédula..."
                                className="pl-8 h-9 text-sm"
                            />
                            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                        </div>
                    </div>
                </CardHeader>

                {/* CardContent con overflow-y-auto para scroll interno */}
                <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
                    {error && (
                        <div className="m-4 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                            Error: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                        </div>
                    ) : filteredEquipos.length === 0 ? (
                        <div className="text-gray-500 text-center py-12">
                            {listaSearch
                                ? "No hay equipos que coincidan."
                                : "No hay equipos registrados."}
                        </div>
                    ) : (
                        <div className="w-full">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Serie / Hostname</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Equipo</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Propietario</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {currentEquipos.map((eq, index) => (
                                        <tr
                                            key={eq.idEquipo ?? `fallback-key-${index}`}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                                            onClick={() => verDetalles(eq.idEquipo)}
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                {eq.idEquipo}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{eq.numeroSerie}</span>
                                                    <span className="text-xs text-slate-500">{eq.hostname}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700">{eq.marca} {eq.modelo}</span>
                                                    <span className="text-xs text-slate-400">{eq.sistemaOperativo}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-blue-600">
                                                {eq.propietario ?? "Sin asignar"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>

                {/* Footer de Paginación (Fijo al final de la tarjeta) */}
                {filteredEquipos.length > ITEMS_PER_PAGE && (
                    <div className="shrink-0 border-t border-slate-100 p-3 bg-white">
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-slate-300"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-slate-500">
                                Página <span className="font-semibold text-slate-900">{currentPage}</span> de{" "}
                                <span className="font-semibold text-slate-900">{totalPages}</span>
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-slate-300"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* MODAL NUEVO EQUIPO */}
            {
                showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative shadow-xl animate-in fade-in zoom-in-95 duration-200">

                            <button
                                onClick={() => setShowForm(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <h2 className="text-lg font-bold mb-1 text-slate-900">
                                Nuevo Equipo
                            </h2>
                            <p className="text-sm text-slate-500 mb-5">Ingresa los datos básicos para registrar el equipo.</p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Serie</label>
                                        <Input
                                            placeholder="Número de serie"
                                            value={numeroSerie}
                                            onChange={(e) => setNumeroSerie(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Marca</label>
                                        <Input
                                            placeholder="Marca (ej. Dell)"
                                            value={marca}
                                            onChange={(e) => setMarca(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">Modelo</label>
                                    <Input
                                        placeholder="Modelo (ej. Latitude 5420)"
                                        value={modelo}
                                        onChange={(e) => setModelo(e.target.value)}
                                    />
                                </div>

                                {/* COMBO CLIENTE */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">Cliente</label>
                                    <select
                                        value={cedulaCliente}
                                        onChange={(e) => setCedulaCliente(e.target.value)}
                                        className="w-full border border-input rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                                    >
                                        <option value="">-- Selecciona un Cliente --</option>
                                        {clientes.map((c) => (
                                            <option key={c.cedula} value={c.cedula}>
                                                {c.nombre} — {c.cedula}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* COMBO TECNICO */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">Técnico Responsable</label>
                                    <select
                                        value={tecnicoId}
                                        onChange={(e) => setTecnicoId(e.target.value)}
                                        className="w-full border border-input rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                                    >
                                        <option value="">-- Selecciona un Técnico --</option>
                                        {tecnicos.map((t) => (
                                            <option key={t.cedula} value={t.cedula}>
                                                {t.nombre} — {t.cedula}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-2 flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                                    <Button
                                        onClick={crearEquipo}
                                        disabled={loading}
                                        className="bg-slate-900 text-white hover:bg-slate-800"
                                    >
                                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        Guardar Equipo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL DETALLES */}
            {
                detalle && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                            {/* Header Modal */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Detalles del Equipo #{detalle.idEquipo}
                                    </h2>
                                    <p className="text-xs text-slate-500">Información completa y hardware.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setDetalle(null);
                                        setShowXml(false);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-1 rounded-full border border-slate-200 hover:bg-slate-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content Scrollable */}
                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500">Número de serie</span>
                                            <span className="font-medium text-slate-900">{detalle.numeroSerie ?? "—"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500">Modelo</span>
                                            <span className="font-medium text-slate-900">{detalle.modelo ?? "—"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500">Marca</span>
                                            <span className="font-medium text-slate-900">{detalle.marca ?? "—"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500">Cliente (Cédula)</span>
                                            <span className="font-medium text-slate-900">{detalle.cedulaCliente ?? "—"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500">Hostname</span>
                                            <span className="font-medium text-slate-900">{detalle.hostname ?? "—"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500">Sistema Operativo</span>
                                            <span className="font-medium text-slate-900">{detalle.sistemaOperativo ?? "—"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION HARDWARE */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            Hardware detectado
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-normal">JSON</span>
                                        </h3>
                                        <div className="relative w-56">
                                            <Input
                                                value={hardwareSearch}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    setHardwareSearch(e.target.value)
                                                }
                                                placeholder="Filtrar hardware..."
                                                className="pl-8 h-8 text-xs bg-slate-50"
                                            />
                                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                        </div>
                                    </div>

                                    {detalle.hardwareJson ? (
                                        <div className="border rounded-lg max-h-[300px] overflow-y-auto text-xs bg-white shadow-inner">
                                            <table className="w-full">
                                                <thead className="bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="py-2 px-3 text-left font-medium text-slate-500 border-b">Propiedad</th>
                                                        <th className="py-2 px-3 text-left font-medium text-slate-500 border-b">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {getHardwareEntries().length === 0 ? (
                                                        <tr>
                                                            <td colSpan={2} className="py-4 px-3 text-center text-slate-400 italic">
                                                                Sin coincidencias.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        getHardwareEntries().map(([key, value]) => (
                                                            <tr key={key} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-2 px-3 font-medium w-1/3 text-slate-700 align-top border-r border-slate-50">
                                                                    {key}
                                                                </td>
                                                                <td className="py-2 px-3 text-slate-600 break-words font-mono text-[11px]">
                                                                    {typeof value === "string"
                                                                        ? value
                                                                        : JSON.stringify(value)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border border-dashed rounded-lg bg-slate-50">
                                            <p className="text-slate-500 text-sm">Sin información de hardware.</p>
                                            <p className="text-xs text-slate-400 mt-1">Sube un archivo XML para poblar estos datos.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 text-xs h-9 bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                                    onClick={() => setShowXml(true)}
                                >
                                    <FileUp className="h-4 w-4" />
                                    Cargar XML
                                </Button>
                            </div>

                            {/* MODAL XML (Anidado) */}
                            {showXml && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-900">Cargar especificaciones (XML)</h3>
                                            <button
                                                onClick={() => setShowXml(false)}
                                                className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <XmlUploader
                                            equipoId={detalle.idEquipo}
                                        />
                                        <div className="mt-4 text-center">
                                            <Button variant="ghost" size="sm" onClick={() => setShowXml(false)} className="text-xs text-slate-500">
                                                Volver a detalles
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}