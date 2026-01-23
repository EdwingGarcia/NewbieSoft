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
    UserCog // Icono para el técnico
} from "lucide-react";
import XmlUploader from "./XmlUploader";
import { API_BASE_URL } from "../lib/api";

// --- CONSTANTES ---
const ITEMS_PER_PAGE = 6;
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
    idEquipo: number;
    tipo?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    hostname?: string;
    sistemaOperativo?: string;
    propietario?: string;
    hardwareJson?: Record<string, any>;
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

    // Estados para el técnico automático
    const [tecnicoId, setTecnicoId] = useState("");
    const [nombreTecnicoActual, setNombreTecnicoActual] = useState("");

    const [listaSearch, setListaSearch] = useState("");
    const [hardwareSearch, setHardwareSearch] = useState("");

    // === PAGINACIÓN ===
    const [currentPage, setCurrentPage] = useState(1);

    /* ============================
       TOKEN & COOKIE UTILS
       =============================== */

    const getToken = (): string | null =>
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1] || null;
    };

    /* ============================
       CARGAR USUARIOS Y ASIGNAR TÉCNICO
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
                const listTecnicos = data.filter((u) => u.rol?.nombre === "ROLE_TECNICO");

                setClientes(data.filter((u) => u.rol?.nombre === "ROLE_CLIENTE"));
                setTecnicos(listTecnicos);

                // ✅ AUTOMÁTICO: Buscar al técnico actual por la cookie 'cedula'
                const currentCedula = getCookie("cedula");
                if (currentCedula) {
                    setTecnicoId(currentCedula);
                    const found = listTecnicos.find(t => t.cedula === currentCedula);
                    if (found) setNombreTecnicoActual(found.nombre);
                    else setNombreTecnicoActual(currentCedula);
                }
            }
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    }, []);

    /* ============================
       CARGAR EQUIPOS
       =============================== */

    const fetchEquipos = useCallback(async (): Promise<void> => {
        const token = getToken();
        if (!token) return;

        try {
            setLoading(true);
            const res = await fetch(API_BASE, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error(`Error ${res.status}: No se pudieron cargar los equipos.`);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setEquipos(data);
                setError(null);
            } else {
                setEquipos([]);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setEquipos([]);
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

        if (!tecnicoId) {
            setError("No se pudo identificar al técnico responsable (revisar sesión).");
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

            alert("✅ Equipo creado correctamente");

            setShowForm(false);
            setNumeroSerie("");
            setModelo("");
            setMarca("");
            setCedulaCliente("");

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
       HARDWARE & FILTROS
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

    const filteredEquipos = useMemo(() => {
        if (!Array.isArray(equipos)) return [];
        const term = listaSearch.trim().toLowerCase();

        // 1. Filtrar
        let result = equipos;
        if (term) {
            result = equipos.filter((eq) => {
                return (
                    (eq.numeroSerie ?? "").toLowerCase().includes(term) ||
                    (eq.modelo ?? "").toLowerCase().includes(term) ||
                    (eq.marca ?? "").toLowerCase().includes(term) ||
                    (eq.propietario ?? "").toLowerCase().includes(term) ||
                    (eq.hostname ?? "").toLowerCase().includes(term)
                );
            });
        }

        // 2. Ordenar por ID descendente (El más reciente primero)
        return result.sort((a, b) => b.idEquipo - a.idEquipo);

    }, [equipos, listaSearch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [listaSearch]);

    const totalPages = Math.ceil(filteredEquipos.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentEquipos = filteredEquipos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    /* ============================
       UI COMPLETA
       =============================== */

    return (
        <div className="p-6 space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Gestión de Equipos 💻</h1>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Nuevo Equipo
                </Button>
            </div>

            {/* TABLA PRINCIPAL */}
            <Card>
                <CardHeader>
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

                <CardContent>
                    {error && (
                        <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
                            Error: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                        </div>
                    ) : filteredEquipos.length === 0 ? (
                        <div className="text-gray-500 text-center py-6">
                            {listaSearch
                                ? "No hay equipos que coincidan."
                                : "No hay equipos registrados."}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">ID</th>
                                            <th className="px-4 py-2 text-left">Serie / Hostname</th>
                                            <th className="px-4 py-2 text-left">Equipo</th>
                                            <th className="px-4 py-2 text-left">Propietario</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {currentEquipos.map((eq, index) => (
                                            <tr
                                                key={eq.idEquipo ?? `fallback-key-${index}`}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => verDetalles(eq.idEquipo)}
                                            >
                                                <td className="px-4 py-2 font-mono text-xs text-gray-500">
                                                    {eq.idEquipo}
                                                </td>

                                                <td className="px-4 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{eq.numeroSerie}</span>
                                                        <span className="text-xs text-gray-500">{eq.hostname}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex flex-col">
                                                        <span>{eq.marca} / {eq.modelo}</span>
                                                        <span className="text-xs text-gray-500">{eq.sistemaOperativo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 font-medium text-blue-600">
                                                    {eq.propietario ?? "Sin asignar"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- PAGINACIÓN --- */}
                            {filteredEquipos.length > ITEMS_PER_PAGE && (
                                <div className="mt-6 flex items-center justify-center gap-4">
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
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* MODAL NUEVO EQUIPO */}
            {
                showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative shadow-xl">

                            <button
                                onClick={() => setShowForm(false)}
                                className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
                            >
                                ✕
                            </button>

                            <h2 className="text-lg font-semibold mb-4">
                                Nuevo Equipo
                            </h2>

                            <div className="space-y-3">
                                <Input
                                    placeholder="Número de serie"
                                    value={numeroSerie}
                                    onChange={(e) => setNumeroSerie(e.target.value)}
                                />
                                <Input
                                    placeholder="Modelo"
                                    value={modelo}
                                    onChange={(e) => setModelo(e.target.value)}
                                />
                                <Input
                                    placeholder="Marca"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                />

                                {/* COMBO CLIENTE */}
                                <label className="text-xs font-semibold text-gray-500 uppercase mt-2 block">
                                    Cliente Asignado
                                </label>
                                <select
                                    value={cedulaCliente}
                                    onChange={(e) => setCedulaCliente(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 bg-white"
                                >
                                    <option value="">-- Selecciona un Cliente --</option>
                                    {clientes.map((c) => (
                                        <option key={c.cedula} value={c.cedula}>
                                            {c.nombre} — {c.cedula}
                                        </option>
                                    ))}
                                </select>

                                {/* ✅ TECNICO AUTOMÁTICO (Solo lectura) */}
                                <label className="text-xs font-semibold text-gray-500 uppercase mt-2 block">
                                    Técnico Responsable (Tú)
                                </label>
                                <div className="relative">
                                    <Input
                                        value={nombreTecnicoActual}
                                        disabled
                                        className="bg-gray-100 text-gray-600 pl-9 font-medium"
                                    />
                                    <UserCog className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <input type="hidden" value={tecnicoId} />
                                </div>

                                <Button
                                    onClick={crearEquipo}
                                    disabled={loading}
                                    className="flex items-center gap-2 w-full mt-4 justify-center"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Crear equipo
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL DETALLES */}
            {
                detalle && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl w-[90vw] max-w-6xl max-h-[90vh] p-6 relative flex flex-col overflow-y-auto">

                            <button
                                onClick={() => {
                                    setDetalle(null);
                                    setShowXml(false);
                                }}
                                className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 text-xl"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <h2 className="text-2xl font-semibold mb-4">
                                Detalles del Equipo #{detalle.idEquipo}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 mb-8">
                                <div className="space-y-2">
                                    <p>
                                        <span className="font-semibold">Número de serie:</span>{" "}
                                        {detalle.numeroSerie ?? "—"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Modelo:</span>{" "}
                                        {detalle.modelo ?? "—"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Marca:</span>{" "}
                                        {detalle.marca ?? "—"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Cliente (Cédula):</span>{" "}
                                        {detalle.propietario ? `${detalle.propietario} (${detalle.cedulaCliente})` : (detalle.cedulaCliente ?? "—")}
                                    </p>
                                </div>
                            </div>

                            {/* SECTION HARDWARE */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2 gap-2">
                                    <h3 className="text-lg font-semibold">
                                        Hardware detectado
                                    </h3>
                                    <div className="relative w-64">
                                        <Input
                                            value={hardwareSearch}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setHardwareSearch(e.target.value)
                                            }
                                            placeholder="Buscar en hardware..."
                                            className="pl-8 h-8 text-sm"
                                        />
                                        <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2" />
                                    </div>
                                </div>

                                {detalle.hardwareJson ? (
                                    <div className="border rounded-lg max-h-[400px] overflow-y-auto text-sm">
                                        <table className="w-full">
                                            <tbody>
                                                {getHardwareEntries().length === 0 ? (
                                                    <tr>
                                                        <td className="py-3 px-3 text-gray-400 italic">
                                                            Sin coincidencias.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getHardwareEntries().map(([key, value]) => (
                                                        <tr
                                                            key={key}
                                                            className="border-b last:border-b-0"
                                                        >
                                                            <td className="py-2 px-3 font-medium w-1/3 text-gray-700">
                                                                {key}
                                                            </td>
                                                            <td className="py-2 px-3 text-gray-600 break-words">
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
                                    <p className="text-gray-500 italic text-sm mt-2">
                                        Sin información de hardware.
                                    </p>
                                )}
                            </div>

                            {/* BOTÓN XML */}
                            <div className="mt-6 flex justify-end">
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={() => setShowXml(true)}
                                >
                                    <FileUp className="h-4 w-4" />
                                    Cargar XML del equipo
                                </Button>
                            </div>
                            {/* MODAL XML */}
                            {showXml && (
                                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-xl p-6 w-full max-w-3xl relative shadow-xl">
                                        <button
                                            onClick={() => setShowXml(false)}
                                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
                                        >
                                            ✕
                                        </button>
                                        <XmlUploader
                                            equipoId={detalle.idEquipo || (detalle as any).id}
                                        />
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