import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api"; // Asegúrate de importar tu constante

// Definimos la interfaz básica que necesitamos para el contexto
interface EquipoBasicDTO {
    idEquipo: number;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    tipo: string | null;
}

interface EquipoSelectorProps {
    value: number | string; // El ID seleccionado
    onChange: (id: number) => void; // Función para actualizar el estado padre
    error?: boolean;
}

export const EquipoSelector = ({ value, onChange, error }: EquipoSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [equipos, setEquipos] = useState<EquipoBasicDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 1. Cargar equipos al montar
    useEffect(() => {
        const fetchEquipos = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/equipos`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setEquipos(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error("Error al cargar equipos", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipos();
    }, []);

    // 2. Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Filtrado local (Búsqueda inteligente)
    const filteredEquipos = equipos.filter((eq) => {
        const term = searchTerm.toLowerCase();
        const textoCompleto = `${eq.marca} ${eq.modelo} ${eq.numeroSerie} ${eq.idEquipo}`.toLowerCase();
        return textoCompleto.includes(term);
    });

    // 4. Encontrar el equipo seleccionado para mostrar su texto
    const selectedEquipo = equipos.find((eq) => eq.idEquipo === Number(value));

    return (
        <div className="relative" ref={containerRef}>
            {/* TRIGGER (Lo que parece el Input) */}
            <div
                onClick={() => {
                    setOpen(!open);
                    if (!open) setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer hover:bg-slate-50 ${error ? "border-red-500" : "border-slate-300"
                    }`}
            >
                <span className="truncate text-slate-700">
                    {selectedEquipo ? (
                        <span className="flex items-center gap-2">
                            <span className="font-semibold">{selectedEquipo.marca} {selectedEquipo.modelo}</span>
                            <span className="text-slate-400 text-xs">| S/N: {selectedEquipo.numeroSerie}</span>
                        </span>
                    ) : (
                        <span className="text-slate-400">Seleccionar equipo...</span>
                    )}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>

            {/* DROPDOWN (Lista desplegable) */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                    {/* Buscador interno */}
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 opacity-50" />
                        <input
                            ref={inputRef}
                            className="flex h-5 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-slate-400"
                            placeholder="Buscar por serie, modelo o marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Lista de opciones */}
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {loading ? (
                            <div className="py-6 text-center text-sm text-slate-500 flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                            </div>
                        ) : filteredEquipos.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-500">No se encontraron equipos.</div>
                        ) : (
                            filteredEquipos.map((eq) => (
                                <div
                                    key={eq.idEquipo}
                                    className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 cursor-pointer ${Number(value) === eq.idEquipo ? "bg-slate-100 text-slate-900" : "text-slate-700"
                                        }`}
                                    onClick={() => {
                                        onChange(eq.idEquipo); // <--- Enviamos el ID al padre
                                        setOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    <div className="flex flex-col w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-medium">{eq.marca} {eq.modelo}</span>
                                            {Number(value) === eq.idEquipo && <Check className="h-3 w-3 text-blue-600" />}
                                        </div>
                                        <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                            <span>S/N: {eq.numeroSerie ?? "N/A"}</span>
                                            <span>ID: {eq.idEquipo}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};