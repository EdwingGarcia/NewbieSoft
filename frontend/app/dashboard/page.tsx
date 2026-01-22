"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "../styles/Dashboard.module.css";

/* =========================
   Dynamic Modules (no SSR)
========================= */
const FichaTecnicaModule = dynamic(() => import("./FichasTecnicasPage"), {
    ssr: false,
});
const EquipoModule = dynamic(() => import("./EquipoPage"), { ssr: false });
const CatalogoModule = dynamic(() => import("./CatalogoPage"), { ssr: false });
const UsuarioModule = dynamic(() => import("./GestionUsuario"), {
    ssr: false,
});
const OrdenTrabajoModule = dynamic(() => import("./OrdenesTrabajoPage"), {
    ssr: false,
});
const CitasModule = dynamic(() => import("./CitasPage"), { ssr: false });

// ✅ NUEVO: Módulo de Configuraciones
const ConfiguracionesModule = dynamic(() => import("./ConfiguracionesPage"), {
    ssr: false,
});

/* =========================
   Types / Constants
========================= */
type Section =
    | "dashboard"
    | "ordenes"
    | "fichas"
    | "equipo"
    | "catalogo"
    | "usuarios"
    | "roles"
    | "citas"
    | "configuraciones"; // ✅ NUEVO

import { API_BASE_URL } from "../lib/api";

const DASHBOARD_API = `${API_BASE_URL}/api/dashboard/resumen`;
const CITAS_API_BASE = `${API_BASE_URL}/api/citas`;

/* =========================
   Helpers
========================= */
function getAuthToken(): string | null {
    const direct =
        localStorage.getItem("token") || localStorage.getItem("nb.auth.token");

    if (direct) return direct.replace(/^Bearer\s+/i, "").trim();

    try {
        const raw = localStorage.getItem("nb.auth");
        if (!raw) return null;
        const obj = JSON.parse(raw);
        const tk =
            obj?.token ||
            obj?.accessToken ||
            obj?.jwt ||
            obj?.data?.token ||
            obj?.data?.accessToken;

        if (!tk) return null;
        return String(tk).replace(/^Bearer\s+/i, "").trim();
    } catch {
        return null;
    }
}

/* =========================
   Interfaces
========================= */
interface TecnicoDashboard {
    tecnicoCedula: string;
    tecnicoNombre: string;
    totalOrdenes: number;
    ordenesAbiertas: number;
    ordenesEnProceso: number;
    ordenesCerradas: number;
}

interface DashboardResumen {
    totalOrdenes: number;
    ordenesAbiertas: number;
    ordenesEnProceso: number;
    ordenesCerradas: number;
    ordenesHoy: number;
    ordenesMes: number;
    totalTecnicos: number;
    tecnicosConOrdenesAbiertas: number;
    tecnicos: TecnicoDashboard[];
    fechaGeneracion: string;
}

interface Cita {
    id: number;
    usuario?: {
        cedula?: string;
        nombre?: string;
        correo?: string;
        telefono?: string;
        direccion?: string;
    };
    tecnico?: {
        cedula?: string;
        nombre?: string;
    };
    fechaProgramada?: string;
    fechaCreacion?: string;
    motivo?: string;
    estado?: string;
    [key: string]: any;
}

export default function DashboardPage() {
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<Section>("dashboard");

    const [dashboardData, setDashboardData] = useState<DashboardResumen | null>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    const [citas, setCitas] = useState<Cita[]>([]);
    const [citasLoading, setCitasLoading] = useState(false);
    const [citasError, setCitasError] = useState<string | null>(null);
    const [userCedula, setUserCedula] = useState<string>("");
    const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);
    const [citasActionError, setCitasActionError] = useState<string | null>(null);

    const [citasView, setCitasView] = useState<"PENDIENTES" | "COMPLETADAS">("PENDIENTES");

    /* =========================
       Fetch: Dashboard + Citas
    ========================= */
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push("/");
            return;
        }
        const storedCedula = localStorage.getItem("cedula") || "";
        setUserCedula(storedCedula);

        const cargarDashboard = async () => {
            try {
                const res = await fetch(DASHBOARD_API, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("nb.auth");
                        localStorage.removeItem("nb.auth.token");
                        router.push("/");
                        return;
                    }
                    throw new Error(`Error ${res.status} al cargar dashboard`);
                }

                const json: DashboardResumen = await res.json();
                setDashboardData(json);
                setDashboardError(null);
            } catch (err) {
                console.error("Error cargando dashboard:", err);
                setDashboardError("No se pudo cargar el resumen del dashboard.");
            }
        };

        const cargarCitas = async () => {
            if (!storedCedula) {
                console.log("No se encontró cédula de técnico en localStorage");
                setCitas([]);
                return;
            }

            setCitasLoading(true);
            setCitasError(null);
            try {
                const url = `${API_BASE_URL}/api/citas/tecnico/${storedCedula}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("nb.auth");
                        localStorage.removeItem("nb.auth.token");
                        router.push("/");
                        return;
                    }
                    throw new Error(`Error ${res.status} al cargar citas`);
                }

                const json = await res.json();
                const arr: Cita[] = Array.isArray(json) ? json : json?.data ?? [];
                setCitas(arr);
            } catch (err) {
                console.error("Error cargando citas:", err);
                setCitasError("No se pudieron cargar las citas del técnico.");
                setCitas([]);
            } finally {
                setCitasLoading(false);
            }
        };

        cargarDashboard();
        cargarCitas();
    }, [router]);

    useEffect(() => {
        if (activeSection !== "dashboard") return;

        const token = getAuthToken();
        if (!token) return;

        const cargarCitas = async () => {
            const tecnicoCedula = localStorage.getItem("cedula");
            if (!tecnicoCedula) return;

            setCitasError(null);
            try {
                const url = `${API_BASE_URL}/api/citas/tecnico/${tecnicoCedula}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("nb.auth");
                        localStorage.removeItem("nb.auth.token");
                        router.push("/");
                        return;
                    }
                    throw new Error(`Error ${res.status} al cargar citas`);
                }

                const json = await res.json();
                const arr: Cita[] = Array.isArray(json) ? json : json?.data ?? [];
                setCitas(arr);
            } catch (err) {
                console.error("Error recargando citas:", err);
            } finally {
                setCitasLoading(false);
            }
        };

        cargarCitas();
    }, [activeSection]);

    async function marcarCitaComoCompletada(citaId: number) {
        const token = getAuthToken();
        if (!token) return;

        setUpdatingCitaId(citaId);
        setCitasActionError(null);

        try {
            const res = await fetch(`${CITAS_API_BASE}/${citaId}/completar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estado: "COMPLETADA" }),
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(`Error ${res.status} actualizando cita. ${msg}`);
            }

            setCitas((prev) =>
                prev.map((c) => (c.id === citaId ? { ...c, estado: "COMPLETADA" } : c))
            );
        } catch (e) {
            console.error(e);
            setCitasActionError("No se pudo marcar la cita como completada.");
        } finally {
            setUpdatingCitaId(null);
        }
    }

    /* =========================
       Dashboard computed values
    ========================= */
    const chartData = useMemo(() => {
        if (!dashboardData) return [];
        return [
            { label: "Abiertas", value: dashboardData.ordenesAbiertas, color: "#f97316" },
            { label: "En proceso", value: dashboardData.ordenesEnProceso, color: "#3b82f6" },
            { label: "Cerradas", value: dashboardData.ordenesCerradas, color: "#22c55e" },
        ];
    }, [dashboardData]);

    const maxChartValue = useMemo(() => {
        if (!chartData.length) return 1;
        return Math.max(...chartData.map((d) => d.value), 1);
    }, [chartData]);

    const completionRate = useMemo(() => {
        if (!dashboardData || dashboardData.totalOrdenes === 0) return 0;
        return (dashboardData.ordenesCerradas / dashboardData.totalOrdenes) * 100;
    }, [dashboardData]);

    const openRate = useMemo(() => {
        if (!dashboardData || dashboardData.totalOrdenes === 0) return 0;
        return (dashboardData.ordenesAbiertas / dashboardData.totalOrdenes) * 100;
    }, [dashboardData]);

    const processRate = useMemo(() => {
        if (!dashboardData || dashboardData.totalOrdenes === 0) return 0;
        return (dashboardData.ordenesEnProceso / dashboardData.totalOrdenes) * 100;
    }, [dashboardData]);

    const topTecnicos = useMemo(() => {
        if (!dashboardData) return [];
        const sorted = [...dashboardData.tecnicos].sort(
            (a, b) => b.totalOrdenes - a.totalOrdenes
        );
        return sorted.slice(0, 4);
    }, [dashboardData]);

    /* =========================
       Logout
    ========================= */
    const handleLogout = async () => {
        const token = getAuthToken();
        try {
            if (token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("nb.auth");
            localStorage.removeItem("nb.auth.token");
            router.push("/");
        }
    };

    /* =========================
       Helpers UI: citas
    ========================= */
    const formatCitaDate = (c: Cita) => {
        const raw = c.fechaProgramada ?? c.fechaCreacion;
        if (!raw) return "Sin fecha";
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return String(raw);
        return d.toLocaleString();
    };

    const getCitaTitle = (c: Cita) => c.motivo || `Cita #${c.id}`;

    const getCitaSubtitle = (c: Cita) => {
        const nombre = c.usuario?.nombre;
        const cedula = c.usuario?.cedula;
        const clienteLabel = nombre
            ? cedula
                ? `Cliente: ${nombre} (${cedula})`
                : `Cliente: ${nombre}`
            : cedula
                ? `Cliente: ${cedula}`
                : null;
        const parts = [clienteLabel].filter(Boolean).join(" • ");
        return parts || "—";
    };

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const getCitaDateObj = (c: Cita) => {
        const raw = c.fechaProgramada ?? c.fechaCreacion;
        if (!raw) return null;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const normalizeEstado = (e?: string) => (e ?? "").toUpperCase().trim();
    const isCompletada = (c: Cita) => {
        const e = normalizeEstado(c.estado);
        return e === "COMPLETADA" || e === "COMPLETADO";
    };
    const isPendiente = (c: Cita) => normalizeEstado(c.estado) === "PENDIENTE";

    const { hoy, manana } = useMemo(() => {
        const today = startOfDay(new Date());
        const tomorrow = startOfDay(new Date(today.getTime() + 24 * 60 * 60 * 1000));

        const base =
            citasView === "PENDIENTES"
                ? citas.filter(isPendiente)
                : citas.filter(isCompletada);

        const sortByTime = (a: Cita, b: Cita) => {
            const da = getCitaDateObj(a)?.getTime() ?? 0;
            const db = getCitaDateObj(b)?.getTime() ?? 0;
            return da - db;
        };

        const hoyArr = base
            .filter((c) => {
                const d = getCitaDateObj(c);
                return d ? isSameDay(d, today) : false;
            })
            .sort(sortByTime);

        const mananaArr = base
            .filter((c) => {
                const d = getCitaDateObj(c);
                return d ? isSameDay(d, tomorrow) : false;
            })
            .sort(sortByTime);

        return { hoy: hoyArr, manana: mananaArr };
    }, [citas, citasView]);

    return (
        <div
            className={styles.container}
            style={{ backgroundColor: "#f5f5ff", color: "#111827" }}
        >
            {/* ===== Sidebar ===== */}
            <aside
                className={styles.sidebar}
                style={{
                    background: "linear-gradient(180deg, #111827, #1f2937)",
                    color: "#f9fafb",
                    borderRight: "1px solid rgba(15,23,42,0.5)",
                }}
            >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                    Newbie Data Control
                </h2>

                <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.4rem",
                            flex: 1,
                        }}
                    >
                        <SidebarItem
                            label="Dashboard"
                            icon="📊"
                            isActive={activeSection === "dashboard"}
                            onClick={() => setActiveSection("dashboard")}
                        />

                        <SidebarItem
                            label="Citas"
                            icon="📅"
                            isActive={activeSection === "citas"}
                            onClick={() => setActiveSection("citas")}
                        />

                        <SidebarItem
                            label="Órdenes de Trabajo"
                            icon="📋"
                            isActive={activeSection === "ordenes"}
                            onClick={() => setActiveSection("ordenes")}
                        />

                        <SidebarItem
                            label="Equipos"
                            icon="🖥️"
                            isActive={activeSection === "equipo"}
                            onClick={() => setActiveSection("equipo")}
                        />

                        <SidebarItem
                            label="Catálogo"
                            icon="📦"
                            isActive={activeSection === "catalogo"}
                            onClick={() => setActiveSection("catalogo")}
                        />

                        <SidebarItem
                            label="Usuarios"
                            icon="👥"
                            isActive={activeSection === "usuarios"}
                            onClick={() => setActiveSection("usuarios")}
                        />

                        {/* ✅ NUEVO: Separador visual */}
                        <li style={{ flex: 1 }} />

                        {/* ✅ NUEVO: Configuraciones al final del sidebar */}
                        <SidebarItem
                            label="Configuraciones"
                            icon="⚙️"
                            isActive={activeSection === "configuraciones"}
                            onClick={() => setActiveSection("configuraciones")}
                        />
                    </ul>
                </nav>
            </aside>

            {/* ===== Main content ===== */}
            <main className={styles.main}>
                <header
                    className={styles.header}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                        padding: "0.8rem 1rem",
                        background: "linear-gradient(90deg, #111827, #1f2937)",
                        color: "#f9fafb",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                >
                    <div>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#f9fafb" }}>
                            Administrador
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "999px",
                            border: "1px solid rgba(255,255,255,0.3)",
                            color: "#f9fafb",
                            cursor: "pointer",
                            padding: "0.35rem 0.9rem",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            backdropFilter: "blur(3px)",
                            transition: "0.2s",
                        }}
                    >
                        <span>🚪</span>
                        <span>Cerrar sesión</span>
                    </button>
                </header>

                {/* ===== Contenido dinámico ===== */}
                <section className={styles.content}>
                    {/* Sección DASHBOARD */}
                    {activeSection === "dashboard" && (
                        <div
                            style={{
                                marginBottom: "1.5rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1.25rem",
                            }}
                        >
                            {/* Título + fecha */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                }}
                            >
                                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a" }}>
                                    Resumen de técnicos
                                </h1>
                                {dashboardData && (
                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                        Actualizado:{" "}
                                        {new Date(dashboardData.fechaGeneracion).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {dashboardError && (
                                <div
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#b91c1c",
                                        backgroundColor: "#fee2e2",
                                        borderRadius: "8px",
                                        padding: "0.5rem 0.75rem",
                                        border: "1px solid #fecaca",
                                    }}
                                >
                                    {dashboardError}
                                </div>
                            )}

                            {dashboardData && (
                                <>
                                    {/* KPIs principales */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                            gap: "1rem",
                                        }}
                                    >
                                        <DashboardCard title="Total órdenes" value={dashboardData.totalOrdenes} />
                                        <DashboardCard
                                            title="Órdenes abiertas"
                                            value={dashboardData.ordenesAbiertas}
                                            chipColor="#f97316"
                                        />
                                        <DashboardCard
                                            title="En proceso"
                                            value={dashboardData.ordenesEnProceso}
                                            chipColor="#3b82f6"
                                        />
                                        <DashboardCard
                                            title="Cerradas"
                                            value={dashboardData.ordenesCerradas}
                                            chipColor="#22c55e"
                                        />
                                        <DashboardCard title="Técnicos con órdenes" value={dashboardData.totalTecnicos} />
                                        <DashboardCard
                                            title="Técnicos con OT abiertas"
                                            value={dashboardData.tecnicosConOrdenesAbiertas}
                                            chipColor="#f97316"
                                        />
                                        <DashboardCard title="Órdenes hoy" value={dashboardData.ordenesHoy} />
                                        <DashboardCard title="Órdenes este mes" value={dashboardData.ordenesMes} />
                                    </div>

                                    {/* BLOQUE PRINCIPAL DE "GRÁFICAS" */}
                                    <div
                                        style={{
                                            marginTop: "0.25rem",
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.8fr)",
                                            gap: "1.25rem",
                                        }}
                                    >
                                        {/* Card: Órdenes por estado */}
                                        <div
                                            style={{
                                                padding: "1rem 1.25rem",
                                                borderRadius: "12px",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        >
                                            <h2
                                                style={{
                                                    fontSize: "0.95rem",
                                                    fontWeight: 600,
                                                    marginBottom: "0.75rem",
                                                    color: "#0f172a",
                                                }}
                                            >
                                                Órdenes por estado
                                            </h2>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {chartData.map((item) => (
                                                    <div key={item.label}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                fontSize: "0.8rem",
                                                                marginBottom: "0.15rem",
                                                            }}
                                                        >
                                                            <span style={{ color: "#4b5563" }}>{item.label}</span>
                                                            <span style={{ fontWeight: 600, color: "#111827" }}>
                                                                {item.value}
                                                            </span>
                                                        </div>

                                                        <div
                                                            style={{
                                                                height: "10px",
                                                                borderRadius: "999px",
                                                                backgroundColor: "#e5e7eb",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(item.value / maxChartValue) * 100}%`,
                                                                    height: "100%",
                                                                    borderRadius: "999px",
                                                                    backgroundColor: item.color,
                                                                    transition: "width 0.4s ease",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Card: Rendimiento general */}
                                        <div
                                            style={{
                                                padding: "1rem 1.25rem",
                                                borderRadius: "12px",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                                                border: "1px solid #e5e7eb",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>
                                                Rendimiento general
                                            </h2>

                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
                                                {/* Gauge */}
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        width: "120px",
                                                        height: "120px",
                                                        borderRadius: "999px",
                                                        background: `conic-gradient(#22c55e ${completionRate}%, #e5e7eb ${completionRate}%)`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "80px",
                                                            height: "80px",
                                                            borderRadius: "999px",
                                                            backgroundColor: "#ffffff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            flexDirection: "column",
                                                            boxShadow: "0 0 0 1px #e5e7eb",
                                                        }}
                                                    >
                                                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#16a34a" }}>
                                                            {Math.trunc(completionRate)}%
                                                        </span>
                                                        <span style={{ fontSize: "0.7rem", color: "#6b7280", textAlign: "center" }}>
                                                            Órdenes completadas
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detalle */}
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "0.4rem",
                                                        fontSize: "0.8rem",
                                                        color: "#4b5563",
                                                    }}
                                                >
                                                    <div>
                                                        <span style={{ display: "inline-flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#22c55e", marginRight: "0.4rem" }} />
                                                        <b>{Math.trunc(completionRate)}%</b> cerradas del total de órdenes.
                                                    </div>

                                                    <div>
                                                        <span style={{ display: "inline-flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#f97316", marginRight: "0.4rem" }} />
                                                        <b>{Math.trunc(openRate)}%</b> en estado abierto.
                                                    </div>

                                                    <div>
                                                        <span style={{ display: "inline-flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#3b82f6", marginRight: "0.4rem" }} />
                                                        <b>{Math.trunc(processRate)}%</b> en diagnóstico / reparación.
                                                    </div>

                                                    <div style={{ marginTop: "0.3rem", fontSize: "0.75rem", color: "#6b7280" }}>
                                                        Estos porcentajes se calculan sobre el total de órdenes registradas.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista de técnicos + Top técnicos */}
                                    <div
                                        style={{
                                            marginTop: "1rem",
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.8fr)",
                                            gap: "1.25rem",
                                        }}
                                    >
                                        {/* Técnicos asignados */}
                                        <div
                                            style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: "12px",
                                                padding: "0.75rem 1rem 1rem",
                                                border: "1px solid #e5e7eb",
                                                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "0.6rem",
                                                }}
                                            >
                                                <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>
                                                    Técnicos asignados
                                                </h2>
                                                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                    {dashboardData.tecnicos.length} técnicos
                                                </span>
                                            </div>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                                    gap: "0.75rem",
                                                    marginTop: "0.4rem",
                                                }}
                                            >
                                                {dashboardData.tecnicos.map((t) => (
                                                    <div
                                                        key={t.tecnicoCedula}
                                                        style={{
                                                            borderRadius: "10px",
                                                            border: "1px solid #e5e7eb",
                                                            padding: "0.6rem 0.75rem",
                                                            backgroundColor: "#f9fafb",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                                                                    {t.tecnicoNombre}
                                                                </div>
                                                                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t.tecnicoCedula}</div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                                                gap: "0.35rem",
                                                                fontSize: "0.75rem",
                                                                marginTop: "0.4rem",
                                                            }}
                                                        >
                                                            <TecnicoMetric label="Total" value={t.totalOrdenes} />
                                                            <TecnicoMetric label="Abiertas" value={t.ordenesAbiertas} color="#f97316" />
                                                            <TecnicoMetric label="Proceso" value={t.ordenesEnProceso} color="#3b82f6" />
                                                            <TecnicoMetric label="Cerradas" value={t.ordenesCerradas} color="#22c55e" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Top técnicos */}
                                        <div
                                            style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: "12px",
                                                padding: "0.75rem 1rem 1rem",
                                                border: "1px solid #e5e7eb",
                                                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>
                                                    Top técnicos por órdenes
                                                </h2>
                                                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Vista rápida</span>
                                            </div>

                                            {topTecnicos.length === 0 ? (
                                                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.5rem" }}>
                                                    No hay datos de técnicos disponibles.
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.4rem" }}>
                                                    {topTecnicos.map((t) => {
                                                        const maxTotal = topTecnicos[0]?.totalOrdenes || 1;

                                                        return (
                                                            <div key={t.tecnicoCedula}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                                                                            {t.tecnicoNombre}
                                                                        </div>
                                                                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t.tecnicoCedula}</div>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            flex: 1,
                                                                            margin: "0 0.8rem",
                                                                            height: "8px",
                                                                            borderRadius: "999px",
                                                                            backgroundColor: "#e5e7eb",
                                                                            overflow: "hidden",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: `${(t.totalOrdenes / maxTotal) * 100}%`,
                                                                                height: "100%",
                                                                                borderRadius: "999px",
                                                                                background: "linear-gradient(90deg,#4f46e5,#22c55e)",
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <span style={{ fontSize: "0.8rem", color: "#111827", fontWeight: 500 }}>
                                                                        {t.totalOrdenes} OT
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* BLOQUE INFERIOR: CITAS DEL TÉCNICO */}
                                    <div
                                        style={{
                                            marginTop: "1.25rem",
                                            backgroundColor: "#ffffff",
                                            borderRadius: "12px",
                                            padding: "1rem 1.25rem",
                                            border: "1px solid #e5e7eb",
                                            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: "0.75rem",
                                                flexWrap: "wrap",
                                                marginBottom: "0.8rem",
                                            }}
                                        >
                                            <div>
                                                <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                                                    Citas del técnico
                                                </h2>
                                                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.15rem" }}>
                                                    Técnico: <b>{userCedula}</b>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                                    <button
                                                        onClick={() => setCitasView("PENDIENTES")}
                                                        style={{
                                                            border: "1px solid #e5e7eb",
                                                            background:
                                                                citasView === "PENDIENTES"
                                                                    ? "linear-gradient(90deg,#111827,#1f2937)"
                                                                    : "#fff",
                                                            color:
                                                                citasView === "PENDIENTES"
                                                                    ? "#fff"
                                                                    : "#111827",
                                                            padding: "0.35rem 0.7rem",
                                                            borderRadius: "999px",
                                                            fontSize: "0.78rem",
                                                            fontWeight: 800,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Pendientes
                                                    </button>

                                                    <button
                                                        onClick={() => setCitasView("COMPLETADAS")}
                                                        style={{
                                                            border: "1px solid #e5e7eb",
                                                            background:
                                                                citasView === "COMPLETADAS"
                                                                    ? "linear-gradient(90deg,#16a34a,#22c55e)"
                                                                    : "#fff",
                                                            color:
                                                                citasView === "COMPLETADAS"
                                                                    ? "#fff"
                                                                    : "#111827",
                                                            padding: "0.35rem 0.7rem",
                                                            borderRadius: "999px",
                                                            fontSize: "0.78rem",
                                                            fontWeight: 800,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Completadas
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => setActiveSection("citas")}
                                                    style={{
                                                        background: "linear-gradient(90deg,#6366f1,#4f46e5)",
                                                        borderRadius: "999px",
                                                        border: "none",
                                                        color: "#fff",
                                                        cursor: "pointer",
                                                        padding: "0.45rem 0.9rem",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Ver módulo completo
                                                </button>
                                            </div>
                                        </div>

                                        {citasLoading && (
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Cargando citas…</div>
                                        )}

                                        {citasError && (
                                            <div
                                                style={{
                                                    fontSize: "0.85rem",
                                                    color: "#b91c1c",
                                                    backgroundColor: "#fee2e2",
                                                    borderRadius: "8px",
                                                    padding: "0.5rem 0.75rem",
                                                    border: "1px solid #fecaca",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                {citasError}
                                            </div>
                                        )}

                                        {citasActionError && (
                                            <div
                                                style={{
                                                    fontSize: "0.85rem",
                                                    color: "#b91c1c",
                                                    backgroundColor: "#fee2e2",
                                                    borderRadius: "8px",
                                                    padding: "0.5rem 0.75rem",
                                                    border: "1px solid #fecaca",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                {citasActionError}
                                            </div>
                                        )}

                                        {!citasLoading && !citasError && (
                                            <>
                                                {hoy.length === 0 && manana.length === 0 ? (
                                                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                                        {citasView === "PENDIENTES"
                                                            ? "No hay citas pendientes para hoy o mañana."
                                                            : "No hay citas completadas para hoy o mañana."}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                        {/* HOY */}
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: "0.82rem",
                                                                    fontWeight: 900,
                                                                    color: "#111827",
                                                                    marginBottom: "0.5rem",
                                                                }}
                                                            >
                                                                Hoy ({hoy.length})
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                                                    gap: "0.75rem",
                                                                }}
                                                            >
                                                                {hoy.slice(0, 8).map((c, idx) => {
                                                                    const estado = (c.estado ?? "").toUpperCase();
                                                                    const isDone = estado === "COMPLETADA" || estado === "COMPLETADO";
                                                                    const isUpdating = updatingCitaId === c.id;

                                                                    return (
                                                                        <div
                                                                            key={String(c.id ?? `hoy-${idx}`)}
                                                                            style={{
                                                                                borderRadius: "10px",
                                                                                border: "1px solid #e5e7eb",
                                                                                padding: "0.75rem 0.85rem",
                                                                                backgroundColor: "#f9fafb",
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                gap: "0.35rem",
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                                                                                <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>
                                                                                    {getCitaTitle(c)}
                                                                                </div>

                                                                                <span
                                                                                    style={{
                                                                                        fontSize: "0.7rem",
                                                                                        padding: "0.12rem 0.45rem",
                                                                                        borderRadius: "999px",
                                                                                        backgroundColor: isDone ? "#dcfce7" : "#e0e7ff",
                                                                                        color: isDone ? "#166534" : "#3730a3",
                                                                                        fontWeight: 800,
                                                                                        height: "fit-content",
                                                                                        whiteSpace: "nowrap",
                                                                                    }}
                                                                                >
                                                                                    {c.estado ?? "CITA"}
                                                                                </span>
                                                                            </div>

                                                                            <div style={{ fontSize: "0.78rem", color: "#374151" }}>
                                                                                <b>Fecha:</b> {formatCitaDate(c)}
                                                                            </div>

                                                                            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                                                                {getCitaSubtitle(c)}
                                                                            </div>

                                                                            {citasView === "PENDIENTES" && (
                                                                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.35rem" }}>
                                                                                    <button
                                                                                        onClick={() => marcarCitaComoCompletada(c.id)}
                                                                                        disabled={!c.id || isDone || isUpdating}
                                                                                        style={{
                                                                                            border: "1px solid #e5e7eb",
                                                                                            background: isDone
                                                                                                ? "#f3f4f6"
                                                                                                : "linear-gradient(90deg,#111827,#1f2937)",
                                                                                            color: isDone ? "#6b7280" : "#ffffff",
                                                                                            padding: "0.35rem 0.75rem",
                                                                                            borderRadius: "10px",
                                                                                            fontSize: "0.8rem",
                                                                                            fontWeight: 800,
                                                                                            cursor: isDone ? "not-allowed" : "pointer",
                                                                                            opacity: isUpdating ? 0.75 : 1,
                                                                                        }}
                                                                                        title={isDone ? "Ya está completada" : "Marcar como completada"}
                                                                                    >
                                                                                        {isUpdating ? "Actualizando..." : "Completada"}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {hoy.length > 8 && (
                                                                <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#6b7280" }}>
                                                                    Mostrando 8 de {hoy.length} citas de hoy.
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* MAÑANA */}
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: "0.82rem",
                                                                    fontWeight: 900,
                                                                    color: "#111827",
                                                                    marginBottom: "0.5rem",
                                                                }}
                                                            >
                                                                Mañana ({manana.length})
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                                                    gap: "0.75rem",
                                                                }}
                                                            >
                                                                {manana.slice(0, 8).map((c, idx) => {
                                                                    const estado = (c.estado ?? "").toUpperCase();
                                                                    const isDone = estado === "COMPLETADA" || estado === "COMPLETADO";
                                                                    const isUpdating = updatingCitaId === c.id;

                                                                    return (
                                                                        <div
                                                                            key={String(c.id ?? `manana-${idx}`)}
                                                                            style={{
                                                                                borderRadius: "10px",
                                                                                border: "1px solid #e5e7eb",
                                                                                padding: "0.75rem 0.85rem",
                                                                                backgroundColor: "#f9fafb",
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                gap: "0.35rem",
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                                                                                <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>
                                                                                    {getCitaTitle(c)}
                                                                                </div>

                                                                                <span
                                                                                    style={{
                                                                                        fontSize: "0.7rem",
                                                                                        padding: "0.12rem 0.45rem",
                                                                                        borderRadius: "999px",
                                                                                        backgroundColor: isDone ? "#dcfce7" : "#e0e7ff",
                                                                                        color: isDone ? "#166534" : "#3730a3",
                                                                                        fontWeight: 800,
                                                                                        height: "fit-content",
                                                                                        whiteSpace: "nowrap",
                                                                                    }}
                                                                                >
                                                                                    {c.estado ?? "CITA"}
                                                                                </span>
                                                                            </div>

                                                                            <div style={{ fontSize: "0.78rem", color: "#374151" }}>
                                                                                <b>Fecha:</b> {formatCitaDate(c)}
                                                                            </div>

                                                                            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                                                                {getCitaSubtitle(c)}
                                                                            </div>

                                                                            {citasView === "PENDIENTES" && (
                                                                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.35rem" }}>
                                                                                    <button
                                                                                        onClick={() => marcarCitaComoCompletada(c.id)}
                                                                                        disabled={!c.id || isDone || isUpdating}
                                                                                        style={{
                                                                                            border: "1px solid #e5e7eb",
                                                                                            background: isDone
                                                                                                ? "#f3f4f6"
                                                                                                : "linear-gradient(90deg,#111827,#1f2937)",
                                                                                            color: isDone ? "#6b7280" : "#ffffff",
                                                                                            padding: "0.35rem 0.75rem",
                                                                                            borderRadius: "10px",
                                                                                            fontSize: "0.8rem",
                                                                                            fontWeight: 800,
                                                                                            cursor: isDone ? "not-allowed" : "pointer",
                                                                                            opacity: isUpdating ? 0.75 : 1,
                                                                                        }}
                                                                                        title={isDone ? "Ya está completada" : "Marcar como completada"}
                                                                                    >
                                                                                        {isUpdating ? "Actualizando..." : "Completada"}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {manana.length > 8 && (
                                                                <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#6b7280" }}>
                                                                    Mostrando 8 de {manana.length} citas de mañana.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Secciones de gestión */}
                    {activeSection === "ordenes" && <OrdenTrabajoModule />}
                    {activeSection === "fichas" && <FichaTecnicaModule />}
                    {activeSection === "equipo" && <EquipoModule />}
                    {activeSection === "usuarios" && <UsuarioModule />}
                    {activeSection === "citas" && <CitasModule />}
                    {activeSection === "catalogo" && <CatalogoModule />}

                    {/* ✅ NUEVO: Sección Configuraciones */}
                    {activeSection === "configuraciones" && <ConfiguracionesModule />}
                </section>
            </main>
        </div>
    );
}

/* =====================
   Componentes auxiliares
===================== */
function SidebarItem({
    label,
    icon,
    isActive,
    onClick,
}: {
    label: string;
    icon?: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <li>
            <button
                onClick={onClick}
                style={{
                    width: "100%",
                    textAlign: "left",
                    background: isActive
                        ? "linear-gradient(90deg,#6366f1,#4f46e5)"
                        : "transparent",
                    border: "none",
                    color: isActive ? "#f9fafb" : "#e5e7eb",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                }}
            >
                {icon && <span>{icon}</span>}
                {label}
            </button>
        </li>
    );
}

function DashboardCard({
    title,
    value,
    chipColor,
}: {
    title: string;
    value: number;
    chipColor?: string;
}) {
    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "0.9rem 1rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                minHeight: "82px",
            }}
        >
            <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>
                {title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "#0f172a" }}>
                    {value}
                </span>

                {chipColor && (
                    <span
                        style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.5rem",
                            borderRadius: "999px",
                            backgroundColor: chipColor + "1a",
                            color: chipColor,
                            fontWeight: 600,
                        }}
                    >
                        {title.split(" ")[1] ?? ""}
                    </span>
                )}
            </div>
        </div>
    );
}

function TecnicoMetric({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color?: string;
}) {
    return (
        <div>
            <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{label}</div>
            <div style={{ fontWeight: 600, color: color || "#111827" }}>{value}</div>
        </div>
    );
}