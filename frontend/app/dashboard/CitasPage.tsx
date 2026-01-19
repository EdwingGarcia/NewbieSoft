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
} from "lucide-react";

/* =========================
   API + Tipos
========================= */
import { API_BASE_URL } from "../lib/api"; // <--- AGREGAR ESTA LÍNEA
const CITAS_API_BASE = `${API_BASE_URL}/api/citas`;
const USUARIOS_API = `${API_BASE_URL}/api/usuarios`;

type CitasScope = "TODAS" | "CLIENTE" | "TECNICO";

// --- TIPOS / INTERFACES ---
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

/** ✅ Normalizador robusto (soporta nombres viejos y nuevos) */
const normalizeCita = (c: any): CitaAdminDTO => ({
    id: Number(c.id),
    cliente: (c.cliente ?? c.usuario) as UsuarioDTO,
    tecnico: (c.tecnico ?? c.tecnicoAsignado ?? undefined) as UsuarioDTO | undefined,
    fechaHoraInicio: String(c.fechaHoraInicio ?? c.fechaProgramada),
    motivo: String(c.motivo ?? ""),
    estado: String(c.estado ?? ""),
    fechaCreacion: String(c.fechaCreacion ?? ""),
});

/** ✅ Construye endpoint según scope */
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

    // ✅ Modal crear cita (integrado)
    const [openCrear, setOpenCrear] = useState(false);

    /* =========================
       1) CARGA DE DATOS
    ========================= */
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

            if (!response.ok) {
                console.error("Error HTTP", response.status);
                setCitas([]);
                return;
            }

            const data = await response.json();
            const arr = Array.isArray(data) ? data : [];
            setCitas(arr.map(normalizeCita));
        } catch (error) {
            console.error("Error conexión", error);
            setCitas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope, scopeId]);

    /* =========================
       2) LÓGICA DE CALENDARIO
    ========================= */
    const getDaysInWeek = (date: Date) => {
        const days: Date[] = [];
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(new Date(date).setDate(diff));

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            days.push(nextDay);
        }
        return days;
    };

    const diasSemana = useMemo(() => getDaysInWeek(new Date(fechaActual)), [fechaActual]);
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
        const nuevaFecha = new Date(fechaActual);
        nuevaFecha.setDate(nuevaFecha.getDate() + days);
        setFechaActual(nuevaFecha);
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case "PENDIENTE":
                return "bg-amber-50 border-amber-300 text-amber-800";
            case "CONFIRMADA":
                return "bg-blue-50 border-blue-300 text-blue-800";
            case "FINALIZADA":
                return "bg-emerald-50 border-emerald-300 text-emerald-800";
            case "CANCELADA":
                return "bg-red-50 border-red-200 text-red-800 opacity-60";
            default:
                return "bg-slate-100 border-slate-200";
        }
    };

    return (
        <div
            style={{
                height: "calc(100vh - 120px)",
                minHeight: "600px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* --- HEADER --- */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #e2e8f0",
                }}
            >
                {/* Lado Izquierdo */}
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                    <h2
                        style={{
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            color: "#0f172a",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <Calendar size={20} /> AGENDA
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#fff",
                        }}
                    >
                        <button
                            onClick={() => cambiarSemana(-7)}
                            style={{
                                padding: "0.3rem 0.6rem",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                borderRight: "1px solid #cbd5e1",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button
                            onClick={() => setFechaActual(new Date())}
                            style={{
                                padding: "0.3rem 1rem",
                                cursor: "pointer",
                                background: "#f8fafc",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                border: "none",
                                fontFamily: "monospace",
                            }}
                        >
                            HOY
                        </button>

                        <button
                            onClick={() => cambiarSemana(7)}
                            style={{
                                padding: "0.3rem 0.6rem",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                borderLeft: "1px solid #cbd5e1",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <span
                        style={{
                            fontSize: "0.85rem",
                            fontFamily: "monospace",
                            color: "#64748b",
                            fontWeight: 500,
                        }}
                    >
                        {diasSemana[0].toLocaleDateString("es-ES", { month: "short", day: "numeric" })} —{" "}
                        {diasSemana[6].toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                    </span>
                </div>

                {/* Lado Derecho */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {/* Selector scope */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as CitasScope)}
                            style={{
                                padding: "0.5rem 0.7rem",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                backgroundColor: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            <option value="TODAS">TODAS</option>
                            <option value="CLIENTE">POR CLIENTE</option>
                            <option value="TECNICO">POR TÉCNICO</option>
                        </select>

                        {(scope === "CLIENTE" || scope === "TECNICO") && (
                            <input
                                value={scopeId}
                                onChange={(e) => setScopeId(e.target.value)}
                                placeholder={scope === "CLIENTE" ? "Cédula cliente" : "Cédula técnico"}
                                style={{
                                    padding: "0.5rem 0.7rem",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.75rem",
                                    fontFamily: "monospace",
                                    fontWeight: 600,
                                    backgroundColor: "#fff",
                                    minWidth: "160px",
                                }}
                            />
                        )}
                    </div>

                    {/* Filtro Estado */}
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Filter size={14} style={{ position: "absolute", left: "10px", color: "#64748b" }} />
                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            style={{
                                padding: "0.5rem 1rem 0.5rem 2.2rem",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                fontWeight: 600,
                                appearance: "none",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                minWidth: "140px",
                            }}
                        >
                            <option value="TODOS">ESTADO: TODOS</option>
                            <option value="PENDIENTE">PENDIENTES</option>
                            <option value="CONFIRMADA">CONFIRMADOS</option>
                            <option value="FINALIZADA">FINALIZADOS</option>
                            <option value="CANCELADA">CANCELADOS</option>
                        </select>
                    </div>

                    {/* ✅ Botón abre modal (integrado) */}
                    <button
                        onClick={() => setOpenCrear(true)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.55rem 0.9rem",
                            border: "1px solid #0f172a",
                            background: "#0f172a",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            borderRadius: 0,
                        }}
                    >
                        <Calendar size={16} />
                        Nueva Cita
                    </button>
                </div>
            </div>

            {/* --- CALENDARIO GRID --- */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
            >
                {/* Header Días (Sticky) */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "60px repeat(7, 1fr)",
                        borderBottom: "1px solid #e2e8f0",
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        zIndex: 5, // ✅ IMPORTANTE: bajo, para que cualquier modal fixed lo tape
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                >
                    <div style={{ padding: "0.5rem", borderRight: "1px solid #e2e8f0", background: "#f8fafc" }} />
                    {diasSemana.map((day, i) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        return (
                            <div
                                key={i}
                                style={{
                                    padding: "0.6rem",
                                    borderRight: "1px solid #e2e8f0",
                                    textAlign: "center",
                                    background: isToday ? "#eff6ff" : "#fff",
                                    borderBottom: isToday ? "2px solid #2563eb" : "none",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: isToday ? "#2563eb" : "#94a3b8",
                                        textTransform: "uppercase",
                                        letterSpacing: "1px",
                                    }}
                                >
                                    {day.toLocaleDateString("es-ES", { weekday: "short" })}
                                </div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Body Horas */}
                <div style={{ flex: 1, minHeight: 0 }}>
                    {loading ? (
                        <div style={{ padding: "1.5rem", color: "#64748b", fontFamily: "monospace" }}>Cargando...</div>
                    ) : (
                        horas.map((hour) => (
                            <div key={hour} style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: "100px" }}>
                                {/* Columna Hora */}
                                <div
                                    style={{
                                        borderRight: "1px solid #e2e8f0",
                                        borderBottom: "1px solid #f1f5f9",
                                        padding: "0.5rem",
                                        fontSize: "0.7rem",
                                        color: "#94a3b8",
                                        fontFamily: "monospace",
                                        textAlign: "right",
                                        backgroundColor: "#fafafa",
                                    }}
                                >
                                    {hour}:00
                                </div>

                                {/* Celdas Días */}
                                {diasSemana.map((day, i) => {
                                    const slots = getCitasForSlot(day, hour);
                                    const isToday = new Date().toDateString() === day.toDateString();

                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                borderRight: "1px solid #f1f5f9",
                                                borderBottom: "1px solid #f1f5f9",
                                                padding: "4px",
                                                position: "relative",
                                                backgroundColor: isToday ? "#f8fafc" : "transparent",
                                            }}
                                        >
                                            {slots.map((cita) => (
                                                <div
                                                    key={cita.id}
                                                    onDoubleClick={() => setCitaSeleccionada(cita)}
                                                    title="Doble click para ver detalles"
                                                    className={`p-2 mb-1 border-l-2 cursor-pointer transition-all hover:translate-y-[-1px] hover:shadow-sm ${getStatusColor(
                                                        cita.estado
                                                    )}`}
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        overflow: "hidden",
                                                        borderRadius: "0px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span
                                                            style={{
                                                                fontWeight: 700,
                                                                fontSize: "0.7rem",
                                                                color: "#000",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                maxWidth: "75%",
                                                            }}
                                                        >
                                                            {cita.cliente?.nombre?.split(" ")[0] ?? "Cliente"}{" "}
                                                            {cita.cliente?.apellido ? cita.cliente.apellido.charAt(0) + "." : ""}
                                                        </span>

                                                        <span style={{ fontSize: "0.65rem", fontFamily: "monospace", opacity: 0.7 }}>
                                                            {new Date(cita.fechaHoraInicio).getMinutes().toString().padStart(2, "0")}m
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "0.7rem",
                                                            opacity: 0.8,
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                    >
                                                        {cita.motivo}
                                                    </div>

                                                    {cita.tecnico && (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                paddingTop: "4px",
                                                                borderTop: "1px dashed rgba(0,0,0,0.1)",
                                                            }}
                                                        >
                                                            <UserCog size={10} className="text-slate-500" />
                                                            <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#475569" }}>
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

            {/* ✅ MODAL CREAR CITA (FULL VIEWPORT FIXED) */}
            {openCrear && (
                <CrearCitaModal
                    onClose={() => setOpenCrear(false)}
                    onCreated={() => {
                        setOpenCrear(false);
                        fetchCitas();
                    }}
                />
            )}

            {/* --- MODAL DE DETALLES --- */}
            {citaSeleccionada && <CitaDetailModal cita={citaSeleccionada} onClose={() => setCitaSeleccionada(null)} />}
        </div>
    );
}

/* =========================
   MODAL: CREAR CITA (integrado)
   ✅ FIX: overlay fixed inset-0 => tapa header sticky
========================= */

interface Rol {
    id: number;
    nombre: string;
}
interface Usuario {
    cedula: string;
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    rol?: Rol;
}

function CrearCitaModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
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

    // ✅ Bloquear scroll del body mientras el modal está abierto
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    // ESC para cerrar
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [onClose]);

    // Cargar usuarios
    useEffect(() => {
        const fetchCombos = async () => {
            setLoadingData(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const resUsers = await fetch(USUARIOS_API, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (resUsers.ok) {
                    const usuarios: Usuario[] = await resUsers.json();
                    setListaClientes(usuarios.filter((u) => u.rol?.nombre === "ROLE_CLIENTE"));
                    setListaTecnicos(
                        usuarios.filter((u) => u.rol?.nombre === "ROLE_TECNICO" || u.rol?.nombre === "ROLE_ADMIN")
                    );
                } else {
                    setError("No se pudo cargar la lista de usuarios.");
                }
            } catch (err) {
                console.error("Error cargando usuarios:", err);
                setError("No se pudo cargar la lista de usuarios.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchCombos();
    }, []);

    // Click afuera dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropCliente(false);
                setShowDropTecnico(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtrarUsuarios = (lista: Usuario[], busqueda: string) => {
        const termino = busqueda.toLowerCase();
        return lista.filter((u) => {
            const nombreCompleto = `${u.nombre || ""} ${u.apellido || ""}`.toLowerCase();
            return nombreCompleto.includes(termino) || u.cedula.includes(termino);
        });
    };

    const renderDropdownItem = (u: Usuario, onSelect: (u: Usuario) => void) => (
        <div
            key={u.cedula}
            onClick={() => onSelect(u)}
            style={{
                padding: "0.7rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
            onMouseEnter={(e) => ((e.currentTarget.style.backgroundColor = "#f8fafc"))}
            onMouseLeave={(e) => ((e.currentTarget.style.backgroundColor = "#fff"))}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>
                    {u.nombre} {u.apellido || ""}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <User size={12} /> {u.email}
                </span>
            </div>

            <span
                style={{
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    background: "#f1f5f9",
                    color: "#334155",
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #e2e8f0",
                }}
            >
                {u.cedula}
            </span>
        </div>
    );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!clienteSeleccionado || !fecha || !hora || !motivo) {
            setError("Todos los campos son obligatorios.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const fechaHoraInicio = `${fecha}T${hora}:00`;

            const response = await fetch(
                `${CITAS_API_BASE}/agendar`, // <--- Usamos la constante que ya definimos arriba
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        usuarioId: clienteSeleccionado.cedula,
                        fechaHoraInicio,
                        motivo,
                        tecnicoId: tecnicoSeleccionado ? tecnicoSeleccionado.cedula : null,
                    }),
                }
            );

            if (response.ok) {
                onCreated();
            } else {
                const txt = await response.text();
                console.error("Error del servidor:", txt);
                setError("Error al agendar. Verifique los datos.");
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(2, 6, 23, 0.55)",
                backdropFilter: "blur(6px)",
                zIndex: 2000, // ✅ MÁS ALTO que cualquier sticky header
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                ref={wrapperRef}
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 30px 60px rgba(2,6,23,0.35)",
                    borderRadius: 0,
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "1rem 1.25rem",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Calendar size={18} />
                        <div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#0f172a", letterSpacing: "0.06em" }}>
                                AGENDAR SERVICIO TÉCNICO
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                Selecciona cliente, fecha/hora y detalle.
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            width: 36,
                            height: 36,
                            display: "grid",
                            placeItems: "center",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                        }}
                        title="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {error && (
                        <div
                            style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                padding: "0.75rem",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Cliente */}
                    <div style={{ position: "relative" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: 900, color: "#64748b", letterSpacing: "0.12em" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                <User size={12} /> CLIENTE *
                            </span>
                        </label>

                        <div
                            style={{
                                marginTop: 6,
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                border: showDropCliente ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                background: "#fff",
                            }}
                        >
                            <Search size={16} style={{ position: "absolute", left: 10, color: "#94a3b8" }} />
                            <input
                                type="text"
                                placeholder={loadingData ? "Cargando..." : "Buscar cliente..."}
                                value={busquedaCliente}
                                onChange={(e) => {
                                    setBusquedaCliente(e.target.value);
                                    setShowDropCliente(true);
                                    setShowDropTecnico(false);
                                    if (e.target.value === "") setClienteSeleccionado(null);
                                }}
                                onFocus={() => {
                                    setShowDropCliente(true);
                                    setShowDropTecnico(false);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.7rem 2.2rem 0.7rem 2.2rem",
                                    fontSize: "0.9rem",
                                    outline: "none",
                                    border: "none",
                                }}
                            />

                            <div style={{ position: "absolute", right: 10, color: "#94a3b8" }}>
                                {clienteSeleccionado ? <Check size={16} color="#059669" /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {showDropCliente && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#fff",
                                    border: "1px solid #cbd5e1",
                                    boxShadow: "0 12px 24px rgba(2,6,23,0.12)",
                                    maxHeight: 190,
                                    overflowY: "auto",
                                    zIndex: 2100,
                                    marginTop: 6,
                                }}
                            >
                                {filtrarUsuarios(listaClientes, busquedaCliente).length > 0 ? (
                                    filtrarUsuarios(listaClientes, busquedaCliente).map((u) =>
                                        renderDropdownItem(u, (sel) => {
                                            setClienteSeleccionado(sel);
                                            setBusquedaCliente(`${sel.nombre} ${sel.apellido || ""} - ${sel.cedula}`);
                                            setShowDropCliente(false);
                                        })
                                    )
                                ) : (
                                    <div style={{ padding: "0.9rem", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                                        Sin resultados
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Técnico */}
                    <div style={{ position: "relative" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: 900, color: "#64748b", letterSpacing: "0.12em" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                <Wrench size={12} /> TÉCNICO (Opcional)
                            </span>
                        </label>

                        <div
                            style={{
                                marginTop: 6,
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                border: showDropTecnico ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                background: "#fff",
                            }}
                        >
                            <Search size={16} style={{ position: "absolute", left: 10, color: "#94a3b8" }} />
                            <input
                                type="text"
                                placeholder={loadingData ? "Cargando..." : "Buscar técnico..."}
                                value={busquedaTecnico}
                                onChange={(e) => {
                                    setBusquedaTecnico(e.target.value);
                                    setShowDropTecnico(true);
                                    setShowDropCliente(false);
                                    if (e.target.value === "") setTecnicoSeleccionado(null);
                                }}
                                onFocus={() => {
                                    setShowDropTecnico(true);
                                    setShowDropCliente(false);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.7rem 2.2rem 0.7rem 2.2rem",
                                    fontSize: "0.9rem",
                                    outline: "none",
                                    border: "none",
                                }}
                            />

                            <div style={{ position: "absolute", right: 10, color: "#94a3b8" }}>
                                {tecnicoSeleccionado ? <Check size={16} color="#059669" /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {showDropTecnico && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#fff",
                                    border: "1px solid #cbd5e1",
                                    boxShadow: "0 12px 24px rgba(2,6,23,0.12)",
                                    maxHeight: 190,
                                    overflowY: "auto",
                                    zIndex: 2100,
                                    marginTop: 6,
                                }}
                            >
                                {filtrarUsuarios(listaTecnicos, busquedaTecnico).length > 0 ? (
                                    filtrarUsuarios(listaTecnicos, busquedaTecnico).map((u) =>
                                        renderDropdownItem(u, (sel) => {
                                            setTecnicoSeleccionado(sel);
                                            setBusquedaTecnico(`${sel.nombre} ${sel.apellido || ""} - ${sel.cedula}`);
                                            setShowDropTecnico(false);
                                        })
                                    )
                                ) : (
                                    <div style={{ padding: "0.9rem", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                                        Sin resultados
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fecha/Hora */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                        <div>
                            <label style={{ fontSize: "0.7rem", fontWeight: 900, color: "#64748b", letterSpacing: "0.12em" }}>
                                FECHA *
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                style={{
                                    width: "100%",
                                    marginTop: 6,
                                    padding: "0.65rem 0.7rem",
                                    border: "1px solid #cbd5e1",
                                    outline: "none",
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "0.7rem", fontWeight: 900, color: "#64748b", letterSpacing: "0.12em" }}>
                                HORA *
                            </label>
                            <input
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                                style={{
                                    width: "100%",
                                    marginTop: 6,
                                    padding: "0.65rem 0.7rem",
                                    border: "1px solid #cbd5e1",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>

                    {/* Motivo */}
                    <div>
                        <label style={{ fontSize: "0.7rem", fontWeight: 900, color: "#64748b", letterSpacing: "0.12em" }}>
                            DETALLE DEL SERVICIO *
                        </label>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Describa el problema técnico..."
                            style={{
                                width: "100%",
                                marginTop: 6,
                                minHeight: 110,
                                padding: "0.75rem",
                                border: "1px solid #cbd5e1",
                                outline: "none",
                                fontFamily: "monospace",
                                fontSize: "0.85rem",
                                resize: "vertical",
                            }}
                        />
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", paddingTop: "0.9rem", borderTop: "1px solid #f1f5f9" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "0.6rem 0.9rem",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                fontWeight: 900,
                                cursor: "pointer",
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !clienteSeleccionado}
                            style={{
                                padding: "0.6rem 0.9rem",
                                border: "1px solid #0f172a",
                                background: "#0f172a",
                                color: "#fff",
                                fontWeight: 900,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading || !clienteSeleccionado ? 0.7 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Asignando...
                                </>
                            ) : (
                                "Confirmar Asignación"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* =========================
   MODAL DETALLES (el tuyo)
========================= */
function CitaDetailModal({ cita, onClose }: { cita: CitaAdminDTO; onClose: () => void }) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const estado = (cita.estado ?? "").toUpperCase();

    const estadoStyles = (() => {
        if (estado.includes("COMPLET")) return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
        if (estado.includes("CANCEL")) return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" };
        if (estado.includes("REPRO") || estado.includes("NO")) return { bg: "#ffedd5", border: "#fed7aa", text: "#9a3412" };
        return { bg: "#e0e7ff", border: "#c7d2fe", text: "#3730a3" };
    })();

    const fechaLabel = (() => {
        try {
            return new Date(cita.fechaHoraInicio).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" });
        } catch {
            return String(cita.fechaHoraInicio ?? "Sin fecha");
        }
    })();

    const clienteNombre = `${cita.cliente?.nombre ?? ""} ${cita.cliente?.apellido ?? ""}`.trim() || "—";
    const tecnicoNombre = cita.tecnico ? `${cita.tecnico?.nombre ?? ""} ${cita.tecnico?.apellido ?? ""}`.trim() || "—" : null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de cita ${cita.id}`}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(2, 6, 23, 0.55)",
                backdropFilter: "blur(6px)",
                zIndex: 3000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "720px",
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    boxShadow: "0 0 0 1px rgba(148,163,184,0.35), 0 24px 50px -12px rgba(2,6,23,0.45)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "1rem 1.25rem",
                        background: "linear-gradient(90deg, #0f172a, #111827)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.72rem", color: "rgba(226,232,240,0.85)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
                                Detalle de cita
                            </span>
                            <span style={{ fontSize: "0.75rem", padding: "0.22rem 0.55rem", borderRadius: "999px", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 700 }}>
                                #{String(cita.id).padStart(6, "0")}
                            </span>
                        </div>

                        <span style={{ fontSize: "0.72rem", color: "rgba(226,232,240,0.85)" }}>
                            <span style={{ opacity: 0.8 }}>Programada:</span> <b style={{ color: "#fff" }}>{fechaLabel}</b>
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "#fff",
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                        }}
                        title="Cerrar"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: "1.25rem" }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1.2fr",
                            gap: "1rem",
                            padding: "0.9rem",
                            borderRadius: "14px",
                            border: "1px solid #e2e8f0",
                            background: "linear-gradient(180deg, #ffffff, #f8fafc)",
                            marginBottom: "1rem",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.12em", marginBottom: "0.35rem" }}>
                                Estado
                            </div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.3rem 0.6rem", borderRadius: "999px", background: estadoStyles.bg, border: `1px solid ${estadoStyles.border}`, color: estadoStyles.text, fontWeight: 900, fontSize: "0.75rem" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "999px", backgroundColor: estadoStyles.text, opacity: 0.9 }} />
                                {cita.estado}
                            </span>
                        </div>

                        <div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.12em", marginBottom: "0.35rem" }}>
                                Horario programado
                            </div>
                            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ width: 28, height: 28, borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#fff", display: "grid", placeItems: "center", boxShadow: "0 6px 14px rgba(2,6,23,0.06)" }}>
                                    <Clock size={14} />
                                </span>
                                {fechaLabel}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div style={{ borderRadius: "14px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "0.95rem", boxShadow: "0 10px 24px rgba(2,6,23,0.06)" }}>
                            <h4 style={{ margin: 0, fontSize: "0.75rem", fontWeight: 900, color: "#334155", textTransform: "uppercase", letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                                <span style={{ width: 28, height: 28, borderRadius: "10px", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "grid", placeItems: "center" }}>
                                    <User size={14} />
                                </span>
                                Datos del cliente
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <InfoItem label="Nombre" value={clienteNombre} />
                                <InfoItem label="Cédula" value={cita.cliente?.cedula ?? "—"} monospace />
                                <InfoItem label="Contacto" value={cita.cliente?.telefono || "N/A"} monospace />
                            </div>
                        </div>

                        <div style={{ borderRadius: "14px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "0.95rem", boxShadow: "0 10px 24px rgba(2,6,23,0.06)" }}>
                            <h4 style={{ margin: 0, fontSize: "0.75rem", fontWeight: 900, color: "#334155", textTransform: "uppercase", letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                                <span style={{ width: 28, height: 28, borderRadius: "10px", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "grid", placeItems: "center" }}>
                                    <UserCog size={14} />
                                </span>
                                Técnico asignado
                            </h4>

                            {cita.tecnico ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <InfoItem label="Nombre" value={tecnicoNombre ?? "—"} />
                                </div>
                            ) : (
                                <div style={{ padding: "0.75rem", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" }}>
                                    Sin asignar
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ borderRadius: "14px", border: "1px solid #e2e8f0", background: "linear-gradient(180deg, #ffffff, #f8fafc)", padding: "0.95rem" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "#334155", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "0.6rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span>Detalle de solicitud</span>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "none" }}></span>
                        </div>

                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "4px solid #0f172a", borderRadius: "12px", padding: "0.85rem 0.9rem", fontSize: "0.9rem", color: "#0f172a", lineHeight: 1.5, boxShadow: "0 10px 20px rgba(2,6,23,0.06)", whiteSpace: "pre-wrap" }}>
                            {cita.motivo || "Sin detalle"}
                        </div>
                    </div>
                </div>

                <div style={{ padding: "0.9rem 1.25rem", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                    <button onClick={onClose} style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#0f172a", padding: "0.45rem 0.9rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer" }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
    return (
        <div>
            <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, marginBottom: "2px" }}>{label}</div>
            <div style={{ color: "#0f172a", fontWeight: 500, fontSize: "0.9rem", fontFamily: monospace ? "monospace" : "inherit" }}>
                {value}
            </div>
        </div>
    );
}
