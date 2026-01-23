"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Search, Check, Smartphone, Laptop, HardDrive, Server, Monitor } from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

// 1. Interfaz adaptada EXACTAMENTE a tu respuesta de API (Spring Boot)
interface EquipoAPI {
    id: number;
    numeroSerie: string;
    modelo: string;
    marca: string;
    cedulaCliente: string;
    tecnicoCedula: string;
    tecnicoNombre: string;
    hardwareJson?: {
        "Sistema operativo"?: string;
        "Nombre del computadora"?: string;
        "Descripción de computadora"?: string;
        "Factor de forma nominal"?: string;
        [key: string]: any;
    };
}

interface CrearFichaTecnicaModalProps {
    open: boolean;
    clienteCedula: string;
    tecnicoCedula: string;
    ordenTrabajoId: number;
    onClose: () => void;
    onCreated?: (fichaId: number) => void;
}

export const CrearFichaTecnicaModal: React.FC<CrearFichaTecnicaModalProps> = ({
    open,
    clienteCedula,
    tecnicoCedula,
    ordenTrabajoId,
    onClose,
    onCreated,
}) => {
    const [equipos, setEquipos] = useState<EquipoAPI[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEquipoId, setSelectedEquipoId] = useState<number | null>(null);
    const [creando, setCreando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Cargar equipos del cliente al abrir
    useEffect(() => {
        if (!open || !clienteCedula || !token) return;

        const fetchEquipos = async () => {
            setLoading(true);
            setError(null);
            try {
                // Usamos el endpoint exacto que proporcionaste
                const res = await fetch(
                    `${API_BASE_URL}/api/equipos/cliente/${clienteCedula}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    setEquipos(Array.isArray(data) ? data : data ? [data] : []);
                } else if (res.status === 404) {
                    setEquipos([]);
                } else {
                    throw new Error(`Error al cargar equipos (HTTP ${res.status})`);
                }
            } catch (e: any) {
                console.error(e);
                setEquipos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEquipos();
        // Reiniciar selección al abrir
        setSelectedEquipoId(null);
    }, [open, clienteCedula, token]);

    // Cerrar buscador al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Normalizar texto para búsquedas (sin tildes, minúsculas)
    const normalizeText = (text: string | null | undefined) => {
        if (!text) return "";
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Filtro en cliente
    const filteredEquipos = equipos.filter((eq) => {
        const term = normalizeText(searchTerm);
        const hw = eq.hardwareJson || {};
        const textoCompleto = `${eq.marca} ${eq.modelo} ${eq.numeroSerie} ${hw["Nombre del computadora"]} ${eq.id}`;
        return normalizeText(textoCompleto).includes(term);
    });

    const selectedEquipo = equipos.find((eq) => eq.id === selectedEquipoId);

    // --- FUNCIÓN DE CREACIÓN CORREGIDA PARA @RequestParam ---
    const crearFicha = async () => {
        if (!selectedEquipoId) {
            setError("Por favor selecciona un equipo");
            return;
        }

        if (!token) {
            setError("No hay token de autenticación");
            return;
        }

        setCreando(true);
        setError(null);

        try {
            // ⚠️ CORRECCIÓN CLAVE: El backend usa @RequestParam, así que enviamos los datos en la URL
            // No usamos JSON body.
            const params = new URLSearchParams();
            params.append("cedulaTecnico", tecnicoCedula);
            params.append("equipoId", String(selectedEquipoId));
            if (ordenTrabajoId) params.append("ordenTrabajoId", String(ordenTrabajoId));
            params.append("observaciones", "Ficha creada desde Orden de Trabajo");

            const url = `${API_BASE_URL}/api/fichas?${params.toString()}`;

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                    // No hace falta Content-Type json porque no enviamos body
                },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                throw new Error(text || `Error creando ficha (HTTP ${res.status})`);
            }

            // Intentar leer el ID de la nueva ficha
            let newId: number | null = null;
            try {
                const responseText = await res.clone().text();
                if (responseText) {
                    // Intenta parsear JSON
                    try {
                        const json = JSON.parse(responseText);
                        newId = json?.id ?? json?.data?.id ?? null;
                    } catch {
                        // Si devuelve solo el número como texto
                        const parsed = parseInt(responseText, 10);
                        if (!isNaN(parsed)) newId = parsed;
                    }
                }
            } catch (e) {
                console.error("Error parseando respuesta", e);
            }

            // Fallback: Si el backend no devolvió el ID claro, buscamos la última ficha de este OT
            if (!newId) {
                await new Promise((r) => setTimeout(r, 800)); // Pequeña espera
                const listRes = await fetch(`${API_BASE_URL}/api/fichas`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (listRes.ok) {
                    const allFichas = await listRes.json();
                    if (Array.isArray(allFichas)) {
                        // Filtramos por la OT actual
                        const deEstaOrden = allFichas.filter((f: any) => Number(f.ordenTrabajoId) === Number(ordenTrabajoId));
                        // Ordenamos descendente por ID
                        deEstaOrden.sort((a: any, b: any) => b.id - a.id);
                        if (deEstaOrden.length > 0) newId = deEstaOrden[0].id;
                    }
                }
            }

            if (newId) {
                onCreated?.(newId);
            } else {
                alert("Ficha creada, pero no se pudo abrir automáticamente. Por favor recarga la lista.");
            }

            onClose();

        } catch (e: any) {
            console.error("Error creando ficha:", e);
            setError(e?.message || "Error al conectar con el servidor");
        } finally {
            setCreando(false);
        }
    };

    // Helper para determinar icono
    const getIcono = (eq: EquipoAPI) => {
        const hw = eq.hardwareJson || {};
        const formFactor = (hw["Factor de forma nominal"] || "").toLowerCase();
        const model = (eq.modelo || "").toLowerCase();

        if (formFactor.includes("laptop") || model.includes("laptop") || model.includes("tuf")) return <Laptop className="h-5 w-5" />;
        if (formFactor.includes("phone") || model.includes("celular")) return <Smartphone className="h-5 w-5" />;
        if (model.includes("server") || model.includes("poweredge")) return <Server className="h-5 w-5" />;
        return <Monitor className="h-5 w-5" />; // Default PC
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative mx-3 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                Nueva Ficha Técnica
                            </h2>
                            <p className="text-[11px] text-slate-300">
                                Selecciona un equipo de la Orden #{ordenTrabajoId}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60"
                            aria-label="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto bg-slate-50 flex-1">
                    {error && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                            <p className="text-sm text-slate-600">Cargando equipos del cliente...</p>
                        </div>
                    ) : equipos.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                            <HardDrive className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-900">Sin equipos disponibles</p>
                            <p className="mt-1 text-xs text-slate-600">Este cliente no tiene equipos registrados.</p>
                        </div>
                    ) : (
                        <>
                            {/* Buscador */}
                            <div className="relative" ref={containerRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        ref={inputRef}
                                        placeholder="Buscar por serie, modelo..."
                                        className="pl-9 bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onFocus={() => setSearchOpen(true)}
                                    />
                                </div>
                            </div>

                            {/* Lista de Equipos */}
                            <div className="space-y-2">
                                {filteredEquipos.length === 0 ? (
                                    <p className="text-center text-xs text-slate-500 py-4">No se encontraron equipos.</p>
                                ) : (
                                    filteredEquipos.map((eq) => {
                                        const isSelected = selectedEquipoId === eq.id; // ⚠️ USAMOS eq.id, NO eq.idEquipo

                                        return (
                                            <div
                                                key={eq.id}
                                                onClick={() => setSelectedEquipoId(eq.id)}
                                                className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all duration-200 ${isSelected
                                                        ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-sm"
                                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                                                    }`}
                                            >
                                                {/* Icono */}
                                                <div className={`mt-0.5 rounded-lg p-2 shrink-0 transition-colors ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {getIcono(eq)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-bold text-slate-900 truncate pr-6">
                                                            {eq.marca} {eq.modelo}
                                                        </p>
                                                    </div>

                                                    <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                                                        S/N: {eq.numeroSerie}
                                                    </p>

                                                    {/* Chips de info extra */}
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {eq.hardwareJson?.["Nombre del computadora"] && (
                                                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                {eq.hardwareJson["Nombre del computadora"]}
                                                            </span>
                                                        )}
                                                        {eq.hardwareJson?.["Sistema operativo"] && (
                                                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[150px]">
                                                                {eq.hardwareJson["Sistema operativo"].split("Build")[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm animate-in zoom-in">
                                                        <Check className="h-3 w-3" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 bg-white px-5 py-3 shrink-0">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">
                            {selectedEquipoId ? "1 equipo seleccionado" : "Ningún equipo seleccionado"}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="h-8 text-xs border-slate-300 text-slate-700"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={!selectedEquipoId || creando}
                                onClick={crearFicha}
                                className={`h-8 text-xs transition-all ${!selectedEquipoId ? "bg-slate-200 text-slate-400" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                            >
                                {creando ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    "Crear Ficha"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};