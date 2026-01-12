"use client";

import { useEffect, useState, useCallback, ChangeEvent, useMemo } from "react";
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
} from "lucide-react";
import XmlUploader from "./XmlUploader";

/* ============================
   INTERFACES
=============================== */

interface Equipo {
    id?: number;
    equipoId?: number;
    numeroSerie?: string;
    modelo?: string;
    marca?: string;
    cedulaCliente?: string;
    tecnicoCedula?: string;
    tecnicoNombre?: string
    hardwareJson?: Record<string, any>;
    cliente?: { cedula?: string; nombre?: string };
}

    interface Rol {
    nombre: string;
    }

    interface Usuario {
    cedula: string;
    nombre: string;
    rol?: Rol;
    }

/* ============================
   CONSTANTES
=============================== */

const API_BASE = "http://localhost:8080/api/equipo";

/* ============================
   COMPONENTE PRINCIPAL
=============================== */

export default function EquipoPage(): JSX.Element {
    /* ============================
       ESTADOS
    =============================== */


    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [clientes, setClientes] = useState<Usuario[]>([]);

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

    const tecnicoCedula =
    typeof window !== "undefined"
        ? localStorage.getItem("cedula")
        : null;


    /* ============================
       TOKEN
    =============================== */

    const getToken = (): string | null =>
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    /* ============================
       CARGAR USUARIOS
    =============================== */

    const fetchClientes = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch("http://localhost:8080/api/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
        });

        const data: Usuario[] = await res.json();
        setClientes(data.filter(u => u.rol?.nombre === "ROLE_CLIENTE"));
    } catch (e) {
        console.error("Error cargando clientes", e);
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
            const res = await fetch(`${API_BASE}/mis-equipos`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data: Equipo[] = await res.json();
            setEquipos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
    fetchEquipos();
    fetchClientes();
    }, [fetchEquipos, fetchClientes]);


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
                }),
            });

            if (!res.ok) throw new Error(`Error ${res.status} al crear equipo`);

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
    }, [numeroSerie, modelo, marca, cedulaCliente, tecnicoId]);

    /* ============================
       DETALLES DE EQUIPO
    =============================== */

    const verDetalles = async (id: number) => {
        const token = getToken();

        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            setDetalle(data);
            setHardwareSearch("");
            setShowXml(false);
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
       FILTRO LISTA
    =============================== */

    const filteredEquipos = useMemo(() => {
        const term = listaSearch.trim().toLowerCase();
        if (!term) return equipos;

        return equipos.filter((eq) => {
            const ced = eq.cedulaCliente ?? eq.cliente?.cedula ?? "";

            return (
                (eq.numeroSerie ?? "").toLowerCase().includes(term) ||
                (eq.modelo ?? "").toLowerCase().includes(term) ||
                (eq.marca ?? "").toLowerCase().includes(term) ||
                ced.toLowerCase().includes(term)
            );
        });
    }, [equipos, listaSearch]);

    /* ============================
       UI COMPLETA
    =============================== */

    return (
        <div className="p-6 space-y-6">
            {/* ============================
                HEADER
            =============================== */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Gestión de Equipos 💻</h1>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Nuevo Equipo
                </Button>
            </div>

            {/* ============================
                TABLA PRINCIPAL
            =============================== */}
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
                        <div className="text-red-600 text-sm mb-3">{error}</div>
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
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">ID</th>
                                        <th className="px-4 py-2 text-left">Número Serie</th>
                                        <th className="px-4 py-2 text-left">Modelo</th>
                                        <th className="px-4 py-2 text-left">Marca</th>
                                        <th className="px-4 py-2 text-left">Cliente</th>
                                        <th className="px-4 py-2 text-left">Técnico</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredEquipos.map((eq) => (
                                        <tr
                                            key={eq.id ?? eq.equipoId}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => verDetalles(eq.id ?? eq.equipoId!)}
                                        >
                                            <td className="px-4 py-2">
                                                {eq.id ?? eq.equipoId}
                                            </td>
                                            <td className="px-4 py-2">{eq.numeroSerie}</td>
                                            <td className="px-4 py-2">{eq.modelo}</td>
                                            <td className="px-4 py-2">{eq.marca}</td>
                                            <td className="px-4 py-2">
                                                {eq.cliente?.nombre} ({eq.cliente?.cedula})
                                            </td>
                                            <td className="px-4 py-2">
                                                {eq.tecnicoNombre ?? "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ============================
                MODAL NUEVO EQUIPO
            =============================== */}

            {showForm && (
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

                        {/* FORMULARIO */}
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

                            {/* 🔵 COMBO CLIENTE */}
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
                            <p className="text-sm text-gray-600">
                            <span className="font-semibold">Técnico asignado:</span>{" "}
                            {tecnicoCedula ?? "—"}
                            </p>

                            <Button
                                onClick={crearEquipo}
                                disabled={loading}
                                className="flex items-center gap-2"
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
            )}

            {/* ============================
                MODAL DETALLES
                (NO MODIFIQUÉ NADA AQUÍ)
            =============================== */}

            {detalle && (
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
                            Detalles del Equipo #{detalle.id}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 mb-8">
                            <div className="space-y-2">
                                <p>
                                    <span className="font-semibold">
                                        Número de serie:
                                    </span>{" "}
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
                                    <span className="font-semibold">
                                        Cliente (Cédula):
                                    </span>{" "}
                                    {detalle.cedulaCliente ?? "—"}
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
                                                getHardwareEntries().map(
                                                    ([key, value]) => (
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
                                                                    : JSON.stringify(
                                                                          value
                                                                      )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )
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
                                        equipoId={
                                            detalle.id ?? detalle.equipoId
                                        }
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
