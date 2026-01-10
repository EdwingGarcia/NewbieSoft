"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    UserCog,
    X,
    User,
    FileText,
    Clock,
} from "lucide-react";
import AgendarCitaModal from "./AgendarCitaModal";

/* =========================
   API + Tipos
========================= */

const CITAS_API_BASE = "http://localhost:8080/api/citas";

type CitasScope = "TODAS" | "CLIENTE" | "TECNICO";

// --- TIPOS / INTERFACES ---
interface UsuarioDTO {
    cedula: string;
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
}

/**
 * ✅ DTO “normalizado” para el front.
 * OJO: aunque tu backend hoy mande `usuario` y `fechaProgramada`,
 * acá lo convertimos a `cliente` y `fechaHoraInicio`.
 */
interface CitaAdminDTO {
    id: number;
    cliente: UsuarioDTO; // antes: usuario
    tecnico?: UsuarioDTO; // puede ser null/undefined
    fechaHoraInicio: string; // antes: fechaProgramada
    motivo: string;
    estado: string;
    fechaCreacion: string;
}

/** ✅ Normalizador robusto (soporta nombres viejos y nuevos) */
const normalizeCita = (c: any): CitaAdminDTO => ({
    id: Number(c.id),
    // soporta backend viejo (usuario) o nuevo (cliente)
    cliente: (c.cliente ?? c.usuario) as UsuarioDTO,

    // soporta si tu backend ya expone tecnico
    tecnico: (c.tecnico ?? c.tecnicoAsignado ?? undefined) as UsuarioDTO | undefined,

    // soporta backend viejo (fechaProgramada) o nuevo (fechaHoraInicio)
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

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function CitasPage() {
    const [citas, setCitas] = useState<CitaAdminDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
    const [fechaActual, setFechaActual] = useState(new Date());

    // ✅ NUEVO: scope de consulta (usa endpoints nuevos)
    const [scope, setScope] = useState<CitasScope>("TODAS");
    const [scopeId, setScopeId] = useState<string>(""); // cedula cliente/técnico según scope

    const [citaSeleccionada, setCitaSeleccionada] = useState<CitaAdminDTO | null>(null);

    /* =========================
       1) CARGA DE DATOS (ENDPOINTS NUEVOS)
    ========================= */
    const fetchCitas = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            // ✅ validación simple: si pides CLIENTE/TECNICO necesitas id
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

    // ✅ recarga cuando cambias scope o scopeId
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
                    {/* ✅ NUEVO: Selector de endpoint */}
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

                    {/* Select Filtro Estado */}
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

                    {/* Agendar */}
                    <div style={{ display: "flex" }}>
                        <AgendarCitaModal onCitaCreated={fetchCitas} />
                    </div>
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
                        zIndex: 20,
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
                            <div
                                key={hour}
                                style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: "100px" }}
                            >
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

            {/* --- MODAL DE DETALLES --- */}
            {citaSeleccionada && (
                <CitaDetailModal cita={citaSeleccionada} onClose={() => setCitaSeleccionada(null)} />
            )}
        </div>
    );
}

/* =========================
   MODAL DETALLES
========================= */
function CitaDetailModal({
    cita,
    onClose,
}: {
    cita: CitaAdminDTO;
    onClose: () => void;
}) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const estado = (cita.estado ?? "").toUpperCase();

    const estadoStyles = (() => {
        // Ajusta nombres a tu backend
        if (estado.includes("COMPLET")) {
            return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
        }
        if (estado.includes("CANCEL")) {
            return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" };
        }
        if (estado.includes("REPRO") || estado.includes("NO")) {
            return { bg: "#ffedd5", border: "#fed7aa", text: "#9a3412" };
        }
        // Pendiente / programada / en proceso (default)
        return { bg: "#e0e7ff", border: "#c7d2fe", text: "#3730a3" };
    })();

    const fechaLabel = (() => {
        try {
            return new Date(cita.fechaHoraInicio).toLocaleString("es-ES", {
                dateStyle: "full",
                timeStyle: "short",
            });
        } catch {
            return String(cita.fechaHoraInicio ?? "Sin fecha");
        }
    })();

    const clienteNombre = `${cita.cliente?.nombre ?? ""} ${cita.cliente?.apellido ?? ""}`.trim() || "—";
    const tecnicoNombre =
        cita.tecnico
            ? `${cita.tecnico?.nombre ?? ""} ${cita.tecnico?.apellido ?? ""}`.trim() || "—"
            : null;

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
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                animation: "modalOverlayIn 0.16s ease-out",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "720px",
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    boxShadow:
                        "0 0 0 1px rgba(148,163,184,0.35), 0 24px 50px -12px rgba(2,6,23,0.45)",
                    overflow: "hidden",
                    transform: "translateY(0)",
                    animation: "modalCardIn 0.18s ease-out",
                }}
            >
                {/* ===== Header ===== */}
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
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "0.72rem",
                                    color: "rgba(226,232,240,0.85)",
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                }}
                            >
                                Detalle de cita
                            </span>

                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    padding: "0.22rem 0.55rem",
                                    borderRadius: "999px",
                                    backgroundColor: "rgba(255,255,255,0.12)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    fontWeight: 700,
                                }}
                            >
                                #{String(cita.id).padStart(6, "0")}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                flexWrap: "wrap",
                                marginTop: "0.15rem",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "0.72rem",
                                    color: "rgba(226,232,240,0.85)",
                                }}
                            >
                                <span style={{ opacity: 0.8 }}>Programada:</span>{" "}
                                <b style={{ color: "#fff" }}>{fechaLabel}</b>
                            </span>
                        </div>
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
                            transition: "transform 0.15s ease, background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                        title="Cerrar"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ===== Body ===== */}
                <div style={{ padding: "1.25rem" }}>
                    {/* ===== Row status + time ===== */}
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
                            <div
                                style={{
                                    fontSize: "0.7rem",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    fontWeight: 800,
                                    letterSpacing: "0.12em",
                                    marginBottom: "0.35rem",
                                }}
                            >
                                Estado
                            </div>

                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.45rem",
                                    padding: "0.3rem 0.6rem",
                                    borderRadius: "999px",
                                    background: estadoStyles.bg,
                                    border: `1px solid ${estadoStyles.border}`,
                                    color: estadoStyles.text,
                                    fontWeight: 900,
                                    fontSize: "0.75rem",
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "999px",
                                        backgroundColor: estadoStyles.text,
                                        opacity: 0.9,
                                    }}
                                />
                                {cita.estado}
                            </span>
                        </div>

                        <div>
                            <div
                                style={{
                                    fontSize: "0.7rem",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    fontWeight: 800,
                                    letterSpacing: "0.12em",
                                    marginBottom: "0.35rem",
                                }}
                            >
                                Horario programado
                            </div>

                            <div
                                style={{
                                    fontWeight: 800,
                                    fontSize: "0.92rem",
                                    color: "#0f172a",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <span
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "10px",
                                        border: "1px solid #e2e8f0",
                                        backgroundColor: "#fff",
                                        display: "grid",
                                        placeItems: "center",
                                        boxShadow: "0 6px 14px rgba(2,6,23,0.06)",
                                    }}
                                >
                                    <Clock size={14} />
                                </span>
                                {fechaLabel}
                            </div>
                        </div>
                    </div>

                    {/* ===== Grid: cliente / tecnico ===== */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginBottom: "1rem",
                        }}
                    >
                        {/* Cliente */}
                        <div
                            style={{
                                borderRadius: "14px",
                                border: "1px solid #e2e8f0",
                                backgroundColor: "#ffffff",
                                padding: "0.95rem",
                                boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "0.85rem",
                                }}
                            >
                                <h4
                                    style={{
                                        margin: 0,
                                        fontSize: "0.75rem",
                                        fontWeight: 900,
                                        color: "#334155",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.14em",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "10px",
                                            background: "#f1f5f9",
                                            border: "1px solid #e2e8f0",
                                            display: "grid",
                                            placeItems: "center",
                                        }}
                                    >
                                        <User size={14} />
                                    </span>
                                    Datos del cliente
                                </h4>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <InfoItem label="Nombre" value={clienteNombre} />
                                <InfoItem label="Cédula" value={cita.cliente?.cedula ?? "—"} monospace />
                                <InfoItem label="Contacto" value={cita.cliente?.telefono || "N/A"} monospace />
                            </div>
                        </div>

                        {/* Técnico */}
                        <div
                            style={{
                                borderRadius: "14px",
                                border: "1px solid #e2e8f0",
                                backgroundColor: "#ffffff",
                                padding: "0.95rem",
                                boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "0.85rem",
                                }}
                            >
                                <h4
                                    style={{
                                        margin: 0,
                                        fontSize: "0.75rem",
                                        fontWeight: 900,
                                        color: "#334155",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.14em",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "10px",
                                            background: "#f1f5f9",
                                            border: "1px solid #e2e8f0",
                                            display: "grid",
                                            placeItems: "center",
                                        }}
                                    >
                                        <UserCog size={14} />
                                    </span>
                                    Técnico asignado
                                </h4>
                            </div>

                            {cita.tecnico ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <InfoItem label="Nombre" value={tecnicoNombre ?? "—"} />
                                    {/* Si tienes cédula del técnico, descomenta:
                  <InfoItem label="Cédula" value={cita.tecnico?.cedula ?? "—"} monospace />
                  */}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        padding: "0.75rem",
                                        borderRadius: "12px",
                                        backgroundColor: "#f8fafc",
                                        border: "1px dashed #cbd5e1",
                                        color: "#64748b",
                                        fontSize: "0.85rem",
                                        fontStyle: "italic",
                                    }}
                                >
                                    Sin asignar
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Motivo */}
                    <div
                        style={{
                            borderRadius: "14px",
                            border: "1px solid #e2e8f0",
                            background: "linear-gradient(180deg, #ffffff, #f8fafc)",
                            padding: "0.95rem",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 900,
                                color: "#334155",
                                textTransform: "uppercase",
                                letterSpacing: "0.14em",
                                marginBottom: "0.6rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Detalle de solicitud</span>
                            <span
                                style={{
                                    fontSize: "0.72rem",
                                    color: "#64748b",
                                    fontWeight: 800,
                                    letterSpacing: 0,
                                    textTransform: "none",
                                }}
                            >
                                (Motivo)
                            </span>
                        </div>

                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderLeft: "4px solid #0f172a",
                                borderRadius: "12px",
                                padding: "0.85rem 0.9rem",
                                fontSize: "0.9rem",
                                color: "#0f172a",
                                lineHeight: 1.5,
                                boxShadow: "0 10px 20px rgba(2,6,23,0.06)",
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {cita.motivo || "Sin detalle"}
                        </div>
                    </div>
                </div>

                {/* ===== Footer ===== */}
                <div
                    style={{
                        padding: "0.9rem 1.25rem",
                        borderTop: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.6rem",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#fff",
                            color: "#0f172a",
                            padding: "0.45rem 0.9rem",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                    >
                        Cerrar
                    </button>
                </div>

                {/* Animaciones (inline) */}
                <style jsx>{`
          @keyframes modalOverlayIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes modalCardIn {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
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
