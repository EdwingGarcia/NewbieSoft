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

interface Equipo {
    id?: number;
    equipoId?: number;
    numeroSerie?: string;
    modelo?: string;
    marca?: string;
    cedulaCliente?: string;
    hardwareJson?: Record<string, any>;
    cliente?: { cedula?: string; nombre?: string };
}

const API_BASE = "http://localhost:8080/api/equipo";

export default function EquipoPage(): JSX.Element {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [detalle, setDetalle] = useState<Equipo | null>(null);
    const [showXml, setShowXml] = useState(false);

    // form
    const [numeroSerie, setNumeroSerie] = useState("");
    const [modelo, setModelo] = useState("");
    const [marca, setMarca] = useState("");
    const [cedulaCliente, setCedulaCliente] = useState("");

    // búsqueda dentro del hardware
    const [hardwareSearch, setHardwareSearch] = useState("");

    // 🔎 búsqueda de la lista
    const [listaSearch, setListaSearch] = useState("");

    const getToken = (): string | null =>
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fetchEquipos = useCallback(async (): Promise<void> => {
        const token = getToken();
        if (!token) {
            setError("Token no encontrado. Inicie sesión nuevamente.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Error ${res.status} al obtener equipos`);
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
    }, [fetchEquipos]);

    const crearEquipo = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setError("Token no encontrado. Inicie sesión nuevamente.");
            return;
        }

        if (!cedulaCliente) {
            setError("Debe ingresar la cédula del cliente");
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
            fetchEquipos();
        } catch (e: any) {
            setError(e.message || "Error creando equipo");
        } finally {
            setLoading(false);
        }
    }, [numeroSerie, modelo, marca, cedulaCliente]);

    const verDetalles = async (id: number) => {
        const token = getToken();
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Equipo no encontrado (${res.status})`);
            const data = await res.json();
            setDetalle(data);
            setHardwareSearch("");
            setShowXml(false);
        } catch (err: any) {
            alert(err.message);
        }
    };

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

    // 🔎 filtrado de la lista
    const filteredEquipos = useMemo(() => {
        const term = listaSearch.trim().toLowerCase();
        if (!term) return equipos;
        return equipos.filter((eq) => {
            const id = String(eq.id ?? eq.equipoId ?? "").toLowerCase();
            const serie = (eq.numeroSerie ?? "").toLowerCase();
            const mod = (eq.modelo ?? "").toLowerCase();
            const mar = (eq.marca ?? "").toLowerCase();
            const ced =
                (eq.cedulaCliente ?? eq.cliente?.cedula ?? "").toLowerCase();
            return (
                id.includes(term) ||
                serie.includes(term) ||
                mod.includes(term) ||
                mar.includes(term) ||
                ced.includes(term)
            );
        });
    }, [equipos, listaSearch]);

    return (
        <div className="p-6 space-y-6">
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Gestión de Equipos 💻</h1>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Nuevo Equipo
                </Button>
            </div>

            {/* ===== Tabla de equipos ===== */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Lista de equipos</CardTitle>
                            <CardDescription>
                                Visualiza todos los equipos registrados en el sistema.
                            </CardDescription>
                        </div>
                        {/* 🔍 buscador */}
                        <div className="relative w-64">
                            <Input
                                value={listaSearch}
                                onChange={(e) => setListaSearch(e.target.value)}
                                placeholder="Buscar por id, modelo, cédula..."
                                className="pl-8 h-9 text-sm"
                            />
                            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                        </div>
                    ) : filteredEquipos.length === 0 ? (
                        <div className="text-gray-500 text-center py-6">
                            {listaSearch
                                ? "No hay equipos que coincidan con la búsqueda."
                                : "No hay equipos registrados."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border-b px-4 py-2 text-left font-semibold text-gray-700">
                                            ID
                                        </th>
                                        <th className="border-b px-4 py-2 text-left font-semibold text-gray-700">
                                            Número Serie
                                        </th>
                                        <th className="border-b px-4 py-2 text-left font-semibold text-gray-700">
                                            Modelo
                                        </th>
                                        <th className="border-b px-4 py-2 text-left font-semibold text-gray-700">
                                            Marca
                                        </th>
                                        <th className="border-b px-4 py-2 text-left font-semibold text-gray-700">
                                            Cliente (Cédula)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEquipos.map((eq) => (
                                        <tr
                                            key={eq.id ?? eq.equipoId}
                                            className="hover:bg-gray-50 transition cursor-pointer"
                                            onClick={() => verDetalles(eq.id ?? eq.equipoId!)}
                                        >
                                            <td className="border-b px-4 py-2">
                                                {eq.id ?? eq.equipoId ?? "—"}
                                            </td>
                                            <td className="border-b px-4 py-2 font-medium text-gray-800">
                                                {eq.numeroSerie ?? "—"}
                                            </td>
                                            <td className="border-b px-4 py-2 text-gray-600">
                                                {eq.modelo ?? "—"}
                                            </td>
                                            <td className="border-b px-4 py-2 text-gray-600">
                                                {eq.marca ?? "—"}
                                            </td>
                                            <td className="border-b px-4 py-2 text-gray-600">
                                                {eq.cedulaCliente ?? eq.cliente?.cedula ?? "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ===== Modal Detalle de Equipo ===== */}
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
                                    {detalle.cedulaCliente ?? "—"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2 gap-2">
                                <h3 className="text-lg font-semibold">Hardware detectado</h3>
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
                                                    <tr key={key} className="border-b last:border-b-0">
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

                        {showXml && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-3xl relative shadow-xl">
                                    <button
                                        onClick={() => setShowXml(false)}
                                        className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
                                    >
                                        ✕
                                    </button>
                                    <XmlUploader equipoId={detalle.id ?? detalle.equipoId} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== Modal Crear Equipo ===== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative shadow-xl">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-semibold mb-4">Nuevo Equipo</h2>
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
                            <Input
                                placeholder="Cédula del cliente"
                                value={cedulaCliente}
                                onChange={(e) => setCedulaCliente(e.target.value)}
                            />

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
        </div>
    );
}
