"use client";

import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    UserCog,
    X,
    User,
    Clock,
    Search,
    Check,
    ChevronDown,
    Wrench,
    Loader2,
    Menu,
} from "lucide-react";
import { API_BASE_URL } from "../lib/api";
import { formatDateTime, showNotification } from "../lib/config";

const CITAS_API_BASE = `${API_BASE_URL}/api/citas`;
const USUARIOS_API = `${API_BASE_URL}/api/usuarios`;

type CitasScope = "TODAS" | "CLIENTE" | "TECNICO";

// --- TIPOS ---
interface UsuarioDTO {
    cedula: string;
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
}

interface CitaAdminDTO {
    id: number;
    cliente: UsuarioDTO;
    tecnico?: UsuarioDTO;
    fechaHoraInicio: string;
    motivo: string;
    estado: string;
    fechaCreacion: string;
}

// --- UTILIDADES ---
const normalizeCita = (c: any): CitaAdminDTO => ({
    id: Number(c.id),
    cliente: (c.cliente ?? c.usuario) as UsuarioDTO,
    tecnico: (c.tecnico ?? c.tecnicoAsignado ?? undefined) as UsuarioDTO | undefined,
    fechaHoraInicio: String(c.fechaHoraInicio ?? c.fechaProgramada),
    motivo: String(c.motivo ?? ""),
    estado: String(c.estado ?? ""),
    fechaCreacion: String(c.fechaCreacion ?? ""),
});

const buildCitasEndpoint = (scope: CitasScope, id?: string) => {
    if (scope === "TODAS") return `${CITAS_API_BASE}/todas`;
    if (scope === "CLIENTE") return `${CITAS_API_BASE}/cliente/${encodeURIComponent(id ?? "")}`;
    return `${CITAS_API_BASE}/tecnico/${encodeURIComponent(id ?? "")}`;
};

export default function CitasPage() {
    const [citas, setCitas] = useState<CitaAdminDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
    const [fechaActual, setFechaActual] = useState(new Date());
    const [scope, setScope] = useState<CitasScope>("TODAS");
    const [scopeId, setScopeId] = useState<string>("");
    const [citaSeleccionada, setCitaSeleccionada] = useState<CitaAdminDTO | null>(null);
    const [openCrear, setOpenCrear] = useState(false);

    // --- CARGA DE DATOS ---
    const fetchCitas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if ((scope === "CLIENTE" || scope === "TECNICO") && !scopeId.trim()) {
                setCitas([]);
                return;
            }
            const url = buildCitasEndpoint(scope, scopeId.trim());
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Error HTTP");
            const data = await response.json();
            setCitas(Array.isArray(data) ? data.map(normalizeCita) : []);
        } catch (error) {
            console.error(error);
            setCitas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitas();
    }, [scope, scopeId]);

    // --- LÓGICA CALENDARIO ---
    const diasSemana = useMemo(() => {
        const date = new Date(fechaActual);
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(new Date(date).setDate(diff));
        return Array.from({ length: 7 }, (_, i) => {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            return nextDay;
        });
    }, [fechaActual]);

    const horas = Array.from({ length: 13 }, (_, i) => i + 7);

    const getCitasForSlot = (day: Date, hour: number) => {
        return citas.filter((cita) => {
            if (estadoFiltro !== "TODOS" && cita.estado !== estadoFiltro) return false;
            const d = new Date(cita.fechaHoraInicio);
            return (
                d.getDate() === day.getDate() &&
                d.getMonth() === day.getMonth() &&
                d.getFullYear() === day.getFullYear() &&
                d.getHours() === hour
            );
        });
    };

    const cambiarSemana = (days: number) => {
        const nueva = new Date(fechaActual);
        nueva.setDate(nueva.getDate() + days);
        setFechaActual(nueva);
    };

    const getStatusClasses = (estado: string) => {
        switch (estado) {
            case "PENDIENTE": return "bg-purple-50 border-purple-400 text-purple-900";
            case "CONFIRMADA": return "bg-indigo-50 border-indigo-400 text-indigo-900";
            case "FINALIZADA": return "bg-emerald-50 border-emerald-400 text-emerald-900";
            case "CANCELADA": return "bg-red-50 border-red-300 text-red-900 opacity-75";
            default: return "bg-purple-50 border-purple-300 text-purple-700";
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[600px] bg-gradient-to-br from-slate-50 to-purple-50/30 font-sans text-slate-900 p-4 gap-4">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 rounded-xl border border-purple-100 bg-white px-5 py-4 shadow-sm">

                {/* Izquierda: Título y Navegación */}
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-500/30">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <span>Agenda de Citas</span>
                    </h2>

                    <div className="flex items-center bg-white border border-purple-200 rounded-lg overflow-hidden shadow-sm">
                        <button onClick={() => cambiarSemana(-7)} className="p-2 hover:bg-purple-50 transition-colors border-r border-purple-200">
                            <ChevronLeft size={18} className="text-purple-600" />
                        </button>
                        <button
                            onClick={() => setFechaActual(new Date())}
                            className="px-4 py-2 text-sm font-semibold bg-purple-50 hover:bg-purple-100 transition-colors text-purple-700"
                        >
                            HOY
                        </button>
                        <button onClick={() => cambiarSemana(7)} className="p-2 hover:bg-purple-50 transition-colors border-l border-purple-200">
                            <ChevronRight size={18} className="text-purple-600" />
                        </button>
                    </div>

                    <span className="hidden sm:flex items-center text-sm font-medium text-purple-600 font-mono">
                        {diasSemana[0].toLocaleDateString("es-ES", { month: "short", day: "numeric" })} —{" "}
                        {diasSemana[6].toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                    </span>
                </div>

                {/* Derecha: Filtros y Botones */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex gap-2">
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as CitasScope)}
                            className="h-10 px-3 py-2 border border-purple-200 rounded-lg text-xs font-bold bg-purple-50/50 text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="TODAS">TODAS</option>
                            <option value="CLIENTE">CLIENTE</option>
                            <option value="TECNICO">TÉCNICO</option>
                        </select>

                        {(scope === "CLIENTE" || scope === "TECNICO") && (
                            <input
                                value={scopeId}
                                onChange={(e) => setScopeId(e.target.value)}
                                placeholder="Cédula..."
                                className="h-10 w-32 px-3 py-2 border border-purple-200 rounded-lg text-xs font-mono font-semibold bg-purple-50/50 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        )}
                    </div>


                    <button
                        onClick={() => setOpenCrear(true)}
                        className="h-10 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-500/25"
                    >
                        <Calendar size={14} />
                        <span>NUEVA CITA</span>
                    </button>
                </div>
            </div>

            {/* --- CALENDARIO GRID --- */}
            <div className="flex-1 overflow-auto border border-purple-100 rounded-xl bg-white shadow-sm relative">
                {/* Contenedor con scroll horizontal para móviles */}
                <div className="min-w-[800px]">

                    {/* Header Días */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-white z-10 border-b border-purple-100 shadow-sm">
                        <div className="bg-purple-50/50 border-r border-purple-100"></div>
                        {diasSemana.map((day, i) => {
                            const isToday = new Date().toDateString() === day.toDateString();
                            return (
                                <div
                                    key={i}
                                    className={`p-2 text-center border-r border-purple-50 last:border-0 ${isToday ? "bg-purple-50" : ""
                                        }`}
                                >
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isToday ? "text-purple-600" : "text-purple-400"
                                        }`}>
                                        {day.toLocaleDateString("es-ES", { weekday: "short" })}
                                    </div>
                                    <div className={`text-lg font-bold font-mono ${isToday ? "text-purple-700 bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto" : "text-slate-700"
                                        }`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Cuerpo Horas */}
                    <div className="divide-y divide-purple-50">
                        {loading ? (
                            <div className="p-8 text-center text-purple-500 flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-purple-600" /> Cargando agenda...
                            </div>
                        ) : (
                            horas.map((hour) => (
                                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[100px]">
                                    {/* Columna Hora */}
                                    <div className="p-2 text-[11px] text-purple-500 font-mono text-right bg-purple-50/50 border-r border-purple-100">
                                        {hour}:00
                                    </div>

                                    {/* Celdas Días */}
                                    {diasSemana.map((day, i) => {
                                        const slots = getCitasForSlot(day, hour);
                                        const isToday = new Date().toDateString() === day.toDateString();
                                        return (
                                            <div
                                                key={i}
                                                className={`p-1 border-r border-purple-50 last:border-0 relative group transition-colors hover:bg-purple-50/50 ${isToday ? "bg-purple-50/30" : ""
                                                    }`}
                                            >
                                                {slots.map((cita) => (
                                                    <div
                                                        key={cita.id}
                                                        onClick={() => setCitaSeleccionada(cita)}
                                                        className={`
                              p-2 mb-1 border-l-4 rounded-r-md shadow-sm cursor-pointer 
                              transition-all hover:-translate-y-0.5 hover:shadow-md 
                              ${getStatusClasses(cita.estado)}
                            `}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-bold text-[11px] truncate w-[85%]">
                                                                {cita.cliente?.nombre?.split(" ")[0]} {cita.cliente?.apellido?.charAt(0)}.
                                                            </span>
                                                            <span className="text-[10px] opacity-70 font-mono">
                                                                {new Date(cita.fechaHoraInicio).getMinutes().toString().padStart(2, "0")}m
                                                            </span>
                                                        </div>

                                                        <div className="text-[11px] leading-tight opacity-90 line-clamp-2 mb-1">
                                                            {cita.motivo}
                                                        </div>

                                                        {cita.tecnico && (
                                                            <div className="flex items-center gap-1 pt-1 border-t border-black/5 mt-1">
                                                                <UserCog size={10} className="opacity-60" />
                                                                <span className="text-[10px] font-semibold opacity-70">
                                                                    {cita.tecnico.nombre.split(" ")[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODALES */}
            {openCrear && (
                <CrearCitaModal
                    onClose={() => setOpenCrear(false)}
                    onCreated={() => {
                        setOpenCrear(false);
                        fetchCitas();
                    }}
                />
            )}

            {citaSeleccionada && (
                <CitaDetailModal
                    cita={citaSeleccionada}
                    onClose={() => setCitaSeleccionada(null)}
                />
            )}
        </div>
    );
}

/* =========================================
   COMPONENTES DE MODAL (Estilizados)
   ========================================= */

// --- Crear Cita Modal ---
interface Usuario {
    cedula: string;
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    rol?: { id: number; nombre: string };
}

function CrearCitaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [motivo, setMotivo] = useState("");

    const [listaClientes, setListaClientes] = useState<Usuario[]>([]);
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Usuario | null>(null);
    const [showDropCliente, setShowDropCliente] = useState(false);

    const [listaTecnicos, setListaTecnicos] = useState<Usuario[]>([]);
    const [busquedaTecnico, setBusquedaTecnico] = useState("");
    const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<Usuario | null>(null);
    const [showDropTecnico, setShowDropTecnico] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "auto"; };
    }, []);

    useEffect(() => {
        const fetchCombos = async () => {
            setLoadingData(true);
            try {
                const token = localStorage.getItem("token");
                const resUsers = await fetch(USUARIOS_API, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (resUsers.ok) {
                    const usuarios: Usuario[] = await resUsers.json();
                    setListaClientes(usuarios.filter((u) => u.rol?.nombre === "ROLE_CLIENTE"));
                    setListaTecnicos(usuarios.filter((u) => u.rol?.nombre === "ROLE_TECNICO" || u.rol?.nombre === "ROLE_ADMIN"));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchCombos();
    }, []);

    // Cierra dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropCliente(false);
                setShowDropTecnico(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtrarUsuarios = (lista: Usuario[], busqueda: string) => {
        const termino = busqueda.toLowerCase();
        return lista.filter((u) =>
            `${u.nombre} ${u.apellido}`.toLowerCase().includes(termino) || u.cedula.includes(termino)
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!clienteSeleccionado || !fecha || !hora || !motivo) {
            setError("Complete todos los campos obligatorios.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${CITAS_API_BASE}/agendar`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    usuarioId: clienteSeleccionado.cedula,
                    fechaHoraInicio: `${fecha}T${hora}:00`,
                    motivo,
                    tecnicoId: tecnicoSeleccionado?.cedula || null,
                }),
            });

            if (res.ok) onCreated();
            else setError("Error al agendar. Verifique disponibilidad.");
        } catch {
            setError("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    const renderDropdown = (
        lista: Usuario[],
        busqueda: string,
        onSelect: (u: Usuario) => void
    ) => {
        const filtrados = filtrarUsuarios(lista, busqueda);
        return (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto z-50 mt-1 rounded-md">
                {filtrados.length > 0 ? filtrados.map(u => (
                    <div
                        key={u.cedula}
                        onClick={() => onSelect(u)}
                        className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex justify-between items-center group"
                    >
                        <div>
                            <div className="text-sm font-bold text-slate-800">{u.nombre} {u.apellido}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1"><User size={10} /> {u.email}</div>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 group-hover:bg-white">{u.cedula}</span>
                    </div>
                )) : (
                    <div className="p-3 text-center text-xs text-slate-400">Sin resultados</div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <div
                ref={wrapperRef}
                className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <Calendar size={20} className="text-slate-800" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm tracking-wide">AGENDAR SERVICIO</h3>
                            <p className="text-xs text-slate-500">Complete los detalles de la nueva cita</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {error}
                        </div>
                    )}

                    {/* Cliente Autocomplete */}
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Cliente *</label>
                        <div className={`flex items-center border rounded-lg bg-white transition-all ${showDropCliente ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-300'}`}>
                            <Search size={16} className="ml-3 text-slate-400" />
                            <input
                                className="w-full p-2.5 text-sm outline-none bg-transparent"
                                placeholder={loadingData ? "Cargando..." : "Buscar cliente..."}
                                value={busquedaCliente}
                                onChange={e => {
                                    setBusquedaCliente(e.target.value);
                                    setShowDropCliente(true);
                                    setShowDropTecnico(false);
                                    if (e.target.value === "") setClienteSeleccionado(null);
                                }}
                                onFocus={() => { setShowDropCliente(true); setShowDropTecnico(false); }}
                            />
                            <div className="mr-3 text-slate-400">
                                {clienteSeleccionado ? <Check size={16} className="text-emerald-500" /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                        {showDropCliente && renderDropdown(listaClientes, busquedaCliente, (u) => {
                            setClienteSeleccionado(u);
                            setBusquedaCliente(`${u.nombre} ${u.apellido || ""} - ${u.cedula}`);
                            setShowDropCliente(false);
                        })}
                    </div>

                    {/* Técnico Autocomplete */}
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Técnico (Opcional)</label>
                        <div className={`flex items-center border rounded-lg bg-white transition-all ${showDropTecnico ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-300'}`}>
                            <Search size={16} className="ml-3 text-slate-400" />
                            <input
                                className="w-full p-2.5 text-sm outline-none bg-transparent"
                                placeholder="Buscar técnico..."
                                value={busquedaTecnico}
                                onChange={e => {
                                    setBusquedaTecnico(e.target.value);
                                    setShowDropTecnico(true);
                                    setShowDropCliente(false);
                                    if (e.target.value === "") setTecnicoSeleccionado(null);
                                }}
                                onFocus={() => { setShowDropTecnico(true); setShowDropCliente(false); }}
                            />
                            <div className="mr-3 text-slate-400">
                                {tecnicoSeleccionado ? <Check size={16} className="text-emerald-500" /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                        {showDropTecnico && renderDropdown(listaTecnicos, busquedaTecnico, (u) => {
                            setTecnicoSeleccionado(u);
                            setBusquedaTecnico(`${u.nombre} ${u.apellido || ""} - ${u.cedula}`);
                            setShowDropTecnico(false);
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha *</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Hora *</label>
                            <input
                                type="time"
                                value={hora}
                                onChange={e => setHora(e.target.value)}
                                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Detalle del servicio *</label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="Describa el problema..."
                            className="w-full p-3 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !clienteSeleccionado}
                            className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-500/25"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Confirmar Cita
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Detalle Modal ---
function CitaDetailModal({ cita, onClose }: { cita: CitaAdminDTO; onClose: () => void }) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "auto"; };
    }, []);

    const estadoStyles = {
        PENDIENTE: "bg-purple-100 text-purple-800 border-purple-200",
        CONFIRMADA: "bg-indigo-100 text-indigo-800 border-indigo-200",
        FINALIZADA: "bg-emerald-100 text-emerald-800 border-emerald-200",
        CANCELADA: "bg-red-100 text-red-800 border-red-200",
    }[cita.estado] || "bg-slate-100 text-slate-800";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Detalle de cita</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono font-bold">#{String(cita.id).padStart(5, '0')}</span>
                        </div>
                        <div className="text-lg font-bold">
                            {formatDateTime(cita.fechaHoraInicio)}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estado</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${estadoStyles}`}>
                                {cita.estado}
                            </span>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Horario</label>
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                <Clock size={16} className="text-indigo-500" />
                                {new Date(cita.fechaHoraInicio).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                <div className="p-1.5 bg-slate-100 rounded-md"><User size={14} /></div>
                                <span className="text-xs font-bold uppercase text-slate-600">Cliente</span>
                            </div>
                            <InfoItem label="Nombre" value={`${cita.cliente.nombre} ${cita.cliente.apellido || ''}`} />
                            <InfoItem label="Contacto" value={cita.cliente.email} monospace />
                            <InfoItem label="Teléfono" value={cita.cliente.telefono || 'Sin teléfono'} monospace />
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                <div className="p-1.5 bg-slate-100 rounded-md"><UserCog size={14} /></div>
                                <span className="text-xs font-bold uppercase text-slate-600">Técnico</span>
                            </div>
                            {cita.tecnico ? (
                                <InfoItem label="Asignado a" value={`${cita.tecnico.nombre} ${cita.tecnico.apellido || ''}`} />
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-400 italic border border-dashed border-slate-200">
                                    Sin asignar
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Detalle de solicitud</label>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{cita.motivo}</p>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 shadow-sm rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
    return (
        <div className="mb-2 last:mb-0">
            <span className="text-[10px] text-slate-400 font-bold block">{label}</span>
            <span className={`text-sm text-slate-800 font-medium ${monospace ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}