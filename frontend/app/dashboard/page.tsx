"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "../styles/Dashboard.module.css";

// Importar sistema de configuración
import { useSidebarStyle, useAppName, useSessionMonitor, useAutoRefresh, useItemsPerPage } from "../lib/useConfig";
import { formatDate, formatDateTime, showNotification } from "../lib/config";

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

    // Usar hooks de configuración
    const sidebarStyle = useSidebarStyle();
    const appName = useAppName();
    const itemsPerPage = useItemsPerPage();
    const [sidebarHovered, setSidebarHovered] = useState(false);

    // Calcular si el sidebar está expandido basado en el estilo configurado
    const isSidebarExpanded =
        sidebarStyle === "expanded" ? true :
            sidebarStyle === "collapsed" ? false :
                sidebarHovered; // "auto" mode: expandir solo en hover

    const [dashboardData, setDashboardData] = useState<DashboardResumen | null>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    const [citas, setCitas] = useState<Cita[]>([]);
    const [citasLoading, setCitasLoading] = useState(false);
    const [citasError, setCitasError] = useState<string | null>(null);
    const [userCedula, setUserCedula] = useState<string>("");
    const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);
    const [citasActionError, setCitasActionError] = useState<string | null>(null);

    const [citasView, setCitasView] = useState<"PENDIENTES" | "COMPLETADAS">("PENDIENTES");

    // Monitor de sesión - cierra sesión por inactividad
    const handleSessionTimeout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("nb.auth");
        localStorage.removeItem("nb.auth.token");
        router.push("/?timeout=1");
    }, [router]);

    useSessionMonitor(handleSessionTimeout);

    // Función para recargar datos del dashboard
    const reloadDashboardData = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(DASHBOARD_API, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json: DashboardResumen = await res.json();
                setDashboardData(json);
            }
        } catch (err) {
            console.error("Error en auto-refresh:", err);
        }
    }, []);

    // Auto-refresh del dashboard
    useAutoRefresh(reloadDashboardData, activeSection === "dashboard");

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
            { label: "Abiertas", value: dashboardData.ordenesAbiertas, color: "#9333ea" },
            { label: "En proceso", value: dashboardData.ordenesEnProceso, color: "#7c3aed" },
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
        return formatDateTime(raw);
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
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
                style={{
                    width: isSidebarExpanded ? "220px" : "70px",
                    background: "linear-gradient(180deg, #1e1b4b, #312e81)",
                    color: "#f9fafb",
                    borderRight: "1px solid rgba(99,102,241,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    padding: isSidebarExpanded ? "1.25rem" : "1rem 0.5rem",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Logo/Título */}
                <div style={{
                    marginTop: "0.5rem",
                    marginBottom: "1.5rem",
                    textAlign: isSidebarExpanded ? "left" : "center",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                }}>
                    {isSidebarExpanded ? (
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                            {appName}
                        </h2>
                    ) : (
                        <span style={{ fontSize: "1.5rem" }}>🔧</span>
                    )}
                </div>

                <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                            flex: 1,
                        }}
                    >
                        <SidebarItem
                            label="Dashboard"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>}
                            isActive={activeSection === "dashboard"}
                            onClick={() => setActiveSection("dashboard")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Citas"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
                            isActive={activeSection === "citas"}
                            onClick={() => setActiveSection("citas")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Órdenes de Trabajo"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                            isActive={activeSection === "ordenes"}
                            onClick={() => setActiveSection("ordenes")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Equipos"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                            isActive={activeSection === "equipo"}
                            onClick={() => setActiveSection("equipo")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Catálogo"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>}
                            isActive={activeSection === "catalogo"}
                            onClick={() => setActiveSection("catalogo")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Usuarios"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                            isActive={activeSection === "usuarios"}
                            onClick={() => setActiveSection("usuarios")}
                            collapsed={!isSidebarExpanded}
                        />

                        {/* Separador visual */}
                        <li style={{ flex: 1 }} />

                        {/* Configuraciones al final del sidebar */}
                        <SidebarItem
                            label="Configuraciones"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>}
                            isActive={activeSection === "configuraciones"}
                            onClick={() => setActiveSection("configuraciones")}
                            collapsed={!isSidebarExpanded}
                        />
                    </ul>
                </nav>
            </aside>

            {/* ===== Main content ===== */}
            <main className={styles.main} style={{ flex: 1, overflow: "auto" }}>
                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1.5rem",
                        background: "linear-gradient(90deg, #1e1b4b, #312e81)",
                        color: "#f9fafb",
                        boxShadow: "0 2px 10px rgba(30,27,75,0.3)",
                        position: "sticky",
                        top: 0,
                        zIndex: 20,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e0e7ff" }}>
                            🎛️ Panel de Administración
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#e0e7ff",
                            cursor: "pointer",
                            padding: "0.4rem 1rem",
                            fontSize: "0.8rem",
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
                            {/* Título + fecha + resumen rápido */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                    padding: "1rem 1.25rem",
                                    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                                    borderRadius: "16px",
                                    boxShadow: "0 8px 24px rgba(30,27,75,0.15)",
                                }}
                            >
                                <div>
                                    <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.25rem" }}>
                                        📊 Resumen de Operaciones
                                    </h1>
                                    <p style={{ fontSize: "0.85rem", color: "#c4b5fd", margin: 0 }}>
                                        Panel centralizado de métricas y gestión técnica
                                    </p>
                                </div>
                                {dashboardData && (
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            color: "#a5b4fc",
                                            display: "block",
                                            marginBottom: "0.25rem"
                                        }}>
                                            Última actualización
                                        </span>
                                        <span style={{
                                            fontSize: "0.9rem",
                                            color: "#ffffff",
                                            fontWeight: 600
                                        }}>
                                            {formatDateTime(dashboardData.fechaGeneracion)}
                                        </span>
                                    </div>
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
                                    {/* KPIs principales - Primera fila */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                            gap: "1rem",
                                        }}
                                    >
                                        <DashboardCard
                                            title="Total órdenes"
                                            value={dashboardData.totalOrdenes}
                                            icon="📊"
                                            chipColor="#6d28d9"
                                        />
                                        <DashboardCard
                                            title="Órdenes abiertas"
                                            value={dashboardData.ordenesAbiertas}
                                            chipColor="#9333ea"
                                            icon="📂"
                                        />
                                        <DashboardCard
                                            title="En proceso"
                                            value={dashboardData.ordenesEnProceso}
                                            chipColor="#7c3aed"
                                            icon="🔧"
                                        />
                                        <DashboardCard
                                            title="Completadas"
                                            value={dashboardData.ordenesCerradas}
                                            chipColor="#22c55e"
                                            icon="✅"
                                        />
                                    </div>

                                    {/* KPIs secundarios - Segunda fila */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                            gap: "1rem",
                                        }}
                                    >
                                        <DashboardCard
                                            title="Técnicos activos"
                                            value={dashboardData.totalTecnicos}
                                            icon="👨‍🔧"
                                            chipColor="#4c1d95"
                                        />
                                        <DashboardCard
                                            title="Técnicos ocupados"
                                            value={dashboardData.tecnicosConOrdenesAbiertas}
                                            chipColor="#7e22ce"
                                            icon="🛠️"
                                        />
                                        <DashboardCard
                                            title="Órdenes hoy"
                                            value={dashboardData.ordenesHoy}
                                            icon="📆"
                                            chipColor="#8b5cf6"
                                        />
                                        <DashboardCard
                                            title="Órdenes este mes"
                                            value={dashboardData.ordenesMes}
                                            icon="📅"
                                            chipColor="#a855f7"
                                        />
                                    </div>

                                    {/* Estadísticas adicionales */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(4, 1fr)",
                                            gap: "1rem",
                                            marginTop: "0.5rem",
                                        }}
                                    >
                                        <div style={{
                                            background: "linear-gradient(135deg, #4c1d95, #6d28d9)",
                                            borderRadius: "16px",
                                            padding: "1.25rem",
                                            color: "#fff",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase" }}>📈 Tasa de Completado</span>
                                            <span style={{ fontSize: "2.2rem", fontWeight: 800 }}>{Math.round(completionRate)}%</span>
                                            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>de órdenes finalizadas</span>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #7e22ce, #a855f7)",
                                            borderRadius: "16px",
                                            padding: "1.25rem",
                                            color: "#fff",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase" }}>🔄 En Proceso</span>
                                            <span style={{ fontSize: "2.2rem", fontWeight: 800 }}>{Math.round(processRate)}%</span>
                                            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>órdenes en diagnóstico</span>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #581c87, #9333ea)",
                                            borderRadius: "16px",
                                            padding: "1.25rem",
                                            color: "#fff",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase" }}>👨‍🔧 Promedio por técnico</span>
                                            <span style={{ fontSize: "2.2rem", fontWeight: 800 }}>
                                                {dashboardData.totalTecnicos > 0
                                                    ? Math.round(dashboardData.totalOrdenes / dashboardData.totalTecnicos)
                                                    : 0}
                                            </span>
                                            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>órdenes asignadas</span>
                                        </div>
                                        <div style={{
                                            background: "linear-gradient(135deg, #312e81, #4338ca)",
                                            borderRadius: "16px",
                                            padding: "1.25rem",
                                            color: "#fff",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase" }}>📅 Citas Pendientes</span>
                                            <span style={{ fontSize: "2.2rem", fontWeight: 800 }}>{hoy.length + manana.length}</span>
                                            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>para hoy y mañana</span>
                                        </div>
                                    </div>

                                    {/* BLOQUE PRINCIPAL DE "GRÁFICAS" */}
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                                            gap: "1.25rem",
                                        }}
                                    >
                                        {/* Card: Órdenes por estado */}
                                        <div
                                            style={{
                                                padding: "1.25rem",
                                                borderRadius: "16px",
                                                background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",
                                                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.08)",
                                                border: "1px solid #e9d5ff",
                                            }}
                                        >
                                            <h2
                                                style={{
                                                    fontSize: "1rem",
                                                    fontWeight: 700,
                                                    marginBottom: "1rem",
                                                    color: "#1e1b4b",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                📈 Distribución de Órdenes
                                            </h2>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                {chartData.map((item) => (
                                                    <div key={item.label}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                fontSize: "0.85rem",
                                                                marginBottom: "0.35rem",
                                                            }}
                                                        >
                                                            <span style={{ color: "#4b5563", fontWeight: 500 }}>{item.label}</span>
                                                            <span style={{ fontWeight: 700, color: "#1e1b4b" }}>
                                                                {item.value}
                                                            </span>
                                                        </div>

                                                        <div
                                                            style={{
                                                                height: "12px",
                                                                borderRadius: "999px",
                                                                backgroundColor: "#ede9fe",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(item.value / maxChartValue) * 100}%`,
                                                                    height: "100%",
                                                                    borderRadius: "999px",
                                                                    background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                                                                    transition: "width 0.4s ease",
                                                                    boxShadow: `0 2px 8px ${item.color}40`,
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
                                                padding: "1.25rem",
                                                borderRadius: "16px",
                                                background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",
                                                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.08)",
                                                border: "1px solid #e9d5ff",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e1b4b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                🎯 Rendimiento General
                                            </h2>

                                            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "0.5rem" }}>
                                                {/* Gauge */}
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        width: "130px",
                                                        height: "130px",
                                                        borderRadius: "999px",
                                                        background: `conic-gradient(#7c3aed ${completionRate}%, #ede9fe ${completionRate}%)`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxShadow: "0 4px 20px rgba(124, 58, 237, 0.2)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "90px",
                                                            height: "90px",
                                                            borderRadius: "999px",
                                                            backgroundColor: "#ffffff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            flexDirection: "column",
                                                            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
                                                        }}
                                                    >
                                                        <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#6d28d9" }}>
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
                                                        <span style={{ display: "inline-flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#7c3aed", marginRight: "0.4rem" }} />
                                                        <b>{Math.trunc(completionRate)}%</b> cerradas del total de órdenes.
                                                    </div>

                                                    <div>
                                                        <span style={{ display: "inline-flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#a855f7", marginRight: "0.4rem" }} />
                                                        <b>{Math.trunc(openRate)}%</b> en estado abierto.
                                                    </div>

                                                    <div>
                                                        <span style={{ display: "inline-flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: "#4c1d95", marginRight: "0.4rem" }} />
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
                                                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                                                borderRadius: "12px",
                                                padding: "0.75rem 1rem 1rem",
                                                border: "1px solid #e9d5ff",
                                                boxShadow: "0 8px 24px rgba(124,58,237,0.08)",
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
                                                <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4c1d95" }}>
                                                    👥 Técnicos asignados
                                                </h2>
                                                <span style={{ fontSize: "0.8rem", color: "#7c3aed", fontWeight: 500 }}>
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
                                                            border: "1px solid #e9d5ff",
                                                            padding: "0.6rem 0.75rem",
                                                            backgroundColor: "#ffffff",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#4c1d95" }}>
                                                                    {t.tecnicoNombre}
                                                                </div>
                                                                <div style={{ fontSize: "0.75rem", color: "#7c3aed" }}>{t.tecnicoCedula}</div>
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
                                                            <TecnicoMetric label="Abiertas" value={t.ordenesAbiertas} color="#9333ea" />
                                                            <TecnicoMetric label="Proceso" value={t.ordenesEnProceso} color="#7c3aed" />
                                                            <TecnicoMetric label="Cerradas" value={t.ordenesCerradas} color="#4c1d95" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Top técnicos */}
                                        <div
                                            style={{
                                                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                                                borderRadius: "12px",
                                                padding: "0.75rem 1rem 1rem",
                                                border: "1px solid #e9d5ff",
                                                boxShadow: "0 8px 24px rgba(124,58,237,0.08)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4c1d95" }}>
                                                    🏆 Top técnicos por órdenes
                                                </h2>
                                                <span style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 500 }}>Vista rápida</span>
                                            </div>

                                            {topTecnicos.length === 0 ? (
                                                <div style={{ fontSize: "0.8rem", color: "#7c3aed", marginTop: "0.5rem" }}>
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
                                                                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#4c1d95" }}>
                                                                            {t.tecnicoNombre}
                                                                        </div>
                                                                        <div style={{ fontSize: "0.75rem", color: "#7c3aed" }}>{t.tecnicoCedula}</div>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            flex: 1,
                                                                            margin: "0 0.8rem",
                                                                            height: "8px",
                                                                            borderRadius: "999px",
                                                                            backgroundColor: "#ede9fe",
                                                                            overflow: "hidden",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: `${(t.totalOrdenes / maxTotal) * 100}%`,
                                                                                height: "100%",
                                                                                borderRadius: "999px",
                                                                                background: "linear-gradient(90deg,#4c1d95,#9333ea)",
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <span style={{ fontSize: "0.8rem", color: "#4c1d95", fontWeight: 600 }}>
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
                                            background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                                            borderRadius: "12px",
                                            padding: "1rem 1.25rem",
                                            border: "1px solid #e9d5ff",
                                            boxShadow: "0 10px 30px rgba(124,58,237,0.1)",
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
                                                <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4c1d95" }}>
                                                    📅 Citas del técnico
                                                </h2>
                                                <div style={{ fontSize: "0.78rem", color: "#7c3aed", marginTop: "0.15rem" }}>
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
                                                                    ? "linear-gradient(90deg,#4338ca,#7c3aed)"
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
                                                        background: "linear-gradient(90deg,#4338ca,#7c3aed)",
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
                                                    <div style={{ fontSize: "0.85rem", color: "#7c3aed" }}>
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
                                                                    color: "#4c1d95",
                                                                    marginBottom: "0.5rem",
                                                                }}
                                                            >
                                                                📌 Hoy ({hoy.length})
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
                                                                                border: "1px solid #e9d5ff",
                                                                                padding: "0.75rem 0.85rem",
                                                                                backgroundColor: "#ffffff",
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                gap: "0.35rem",
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                                                                                <div style={{ fontWeight: 700, color: "#4c1d95", fontSize: "0.9rem" }}>
                                                                                    {getCitaTitle(c)}
                                                                                </div>

                                                                                <span
                                                                                    style={{
                                                                                        fontSize: "0.7rem",
                                                                                        padding: "0.12rem 0.45rem",
                                                                                        borderRadius: "999px",
                                                                                        backgroundColor: isDone ? "#e9d5ff" : "#ede9fe",
                                                                                        color: isDone ? "#4c1d95" : "#7c3aed",
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

                                                                            <div style={{ fontSize: "0.78rem", color: "#7c3aed" }}>
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
                                                                                                : "linear-gradient(90deg,#4338ca,#7c3aed)",
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
                                                                <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#7c3aed" }}>
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
                                                                    color: "#4c1d95",
                                                                    marginBottom: "0.5rem",
                                                                }}
                                                            >
                                                                📆 Mañana ({manana.length})
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
                                                                                border: "1px solid #e9d5ff",
                                                                                padding: "0.75rem 0.85rem",
                                                                                backgroundColor: "#ffffff",
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                gap: "0.35rem",
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                                                                                <div style={{ fontWeight: 700, color: "#4c1d95", fontSize: "0.9rem" }}>
                                                                                    {getCitaTitle(c)}
                                                                                </div>

                                                                                <span
                                                                                    style={{
                                                                                        fontSize: "0.7rem",
                                                                                        padding: "0.12rem 0.45rem",
                                                                                        borderRadius: "999px",
                                                                                        backgroundColor: isDone ? "#e9d5ff" : "#ede9fe",
                                                                                        color: isDone ? "#4c1d95" : "#7c3aed",
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

                                                                            <div style={{ fontSize: "0.78rem", color: "#7c3aed" }}>
                                                                                {getCitaSubtitle(c)}
                                                                            </div>

                                                                            {citasView === "PENDIENTES" && (
                                                                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.35rem" }}>
                                                                                    <button
                                                                                        onClick={() => marcarCitaComoCompletada(c.id)}
                                                                                        disabled={!c.id || isDone || isUpdating}
                                                                                        style={{
                                                                                            border: "1px solid #e9d5ff",
                                                                                            background: isDone
                                                                                                ? "#f3f4f6"
                                                                                                : "linear-gradient(90deg,#4c1d95,#7c3aed)",
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
                                                                <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#7c3aed" }}>
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
    iconSvg,
    isActive,
    onClick,
    collapsed = false,
}: {
    label: string;
    iconSvg?: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    collapsed?: boolean;
}) {
    return (
        <li>
            <button
                onClick={onClick}
                title={collapsed ? label : undefined}
                style={{
                    width: "100%",
                    textAlign: collapsed ? "center" : "left",
                    background: isActive
                        ? "linear-gradient(90deg, #4c1d95, #6d28d9)"
                        : "transparent",
                    border: "none",
                    color: "#ffffff",
                    padding: collapsed ? "0.6rem" : "0.5rem 0.85rem",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: "0.6rem",
                    boxShadow: isActive ? "0 4px 12px rgba(109, 40, 217, 0.3)" : "none",
                    opacity: isActive ? 1 : 0.85,
                }}
            >
                {iconSvg && <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{iconSvg}</span>}
                {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
            </button>
        </li>
    );
}

function DashboardCard({
    title,
    value,
    chipColor,
    icon,
    trend,
}: {
    title: string;
    value: number;
    chipColor?: string;
    icon?: string;
    trend?: { value: number; isPositive: boolean };
}) {
    // Colores morados oscuros para las tarjetas
    const purpleAccent = chipColor || "#7c3aed";

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
                borderRadius: "16px",
                padding: "1rem 1.25rem",
                border: "1px solid #e9d5ff",
                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                minHeight: "100px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Acento decorativo */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${purpleAccent}, #a855f7)`,
                borderRadius: "16px 16px 0 0",
            }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {title}
                </span>
                {icon && <span style={{ fontSize: "1.2rem", opacity: 0.6 }}>{icon}</span>}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b4b" }}>
                    {value}
                </span>

                {trend && (
                    <span style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "6px",
                        backgroundColor: trend.isPositive ? "#dcfce7" : "#fee2e2",
                        color: trend.isPositive ? "#166534" : "#991b1b",
                        fontWeight: 700,
                    }}>
                        {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>

            {chipColor && (
                <div style={{
                    position: "absolute",
                    bottom: "0.75rem",
                    right: "0.75rem",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: chipColor,
                    boxShadow: `0 0 8px ${chipColor}80`,
                }} />
            )}
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
            <div style={{ fontSize: "0.7rem", color: "#7c3aed" }}>{label}</div>
            <div style={{ fontWeight: 600, color: color || "#4c1d95" }}>{value}</div>
        </div>
    );
}