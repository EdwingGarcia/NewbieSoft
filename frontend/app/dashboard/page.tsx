"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "../styles/Dashboard.module.css";

// 🔹 Carga dinámica de los módulos (sin SSR)
const FichaTecnicaModule = dynamic(() => import("./FichasTecnicasPage"), {
    ssr: false,
});
const EquipoModule = dynamic(() => import("./EquipoPage"), { ssr: false });
const UsuarioModule = dynamic(() => import("./GestionUsuario"), {
    ssr: false,
});
const OrdenTrabajoModule = dynamic(() => import("./OrdenesTrabajoPage"), {
    ssr: false,
});
// --- NUEVO MÓDULO DE CITAS ---
const CitasModule = dynamic(() => import("./CitasPage"), {
    ssr: false,
});

// 🔹 Tipo de sección
type Section =
    | "dashboard"
    | "ordenes"
    | "fichas"
    | "equipo"
    | "usuarios"
    | "roles"
    | "citas"; // <-- AÑADIDO

const DASHBOARD_API = "http://localhost:8080/api/dashboard/resumen";

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

export default function DashboardPage() {
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<Section>("dashboard");
    const [dashboardData, setDashboardData] = useState<DashboardResumen | null>(
        null
    );
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    // 🔑 Verificar sesión activa y cargar dashboard
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }

        const cargarDashboard = async () => {
            try {
                const res = await fetch(DASHBOARD_API, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
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

        cargarDashboard();
    }, [router]);

    // 🔹 Datos para la gráfica “Órdenes por estado”
    const chartData = useMemo(() => {
        if (!dashboardData) return [];
        return [
            {
                label: "Abiertas",
                value: dashboardData.ordenesAbiertas,
                color: "#f97316", // naranja suave
            },
            {
                label: "En proceso",
                value: dashboardData.ordenesEnProceso,
                color: "#3b82f6", // azul
            },
            {
                label: "Cerradas",
                value: dashboardData.ordenesCerradas,
                color: "#22c55e", // verde
            },
        ];
    }, [dashboardData]);

    const maxChartValue = useMemo(() => {
        if (!chartData.length) return 1;
        return Math.max(...chartData.map((d) => d.value), 1);
    }, [chartData]);

    // 🔹 Métricas derivadas para “gráficas extra”
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

    // 🔹 Top técnicos por total de órdenes
    const topTecnicos = useMemo(() => {
        if (!dashboardData) return [];
        const sorted = [...dashboardData.tecnicos].sort(
            (a, b) => b.totalOrdenes - a.totalOrdenes
        );
        return sorted.slice(0, 4);
    }, [dashboardData]);

    // 🔒 Cerrar sesión
    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            if (token) {
                await fetch("http://localhost:8080/api/auth/logout", {
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

    return (
        <div
            className={styles.container}
            style={{
                backgroundColor: "#f5f5ff", // fondo claro lilita suave
                color: "#111827",
            }}
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
                <h2
                    style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        marginBottom: "1.5rem",
                    }}
                >
                    Newbie Data Control
                </h2>
                <nav>
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.4rem",
                        }}
                    >
                        {/* DASHBOARD */}
                        <SidebarItem
                            label="Dashboard"
                            isActive={activeSection === "dashboard"}
                            onClick={() => setActiveSection("dashboard")}
                        />

                        {/* --- NUEVO ÍTEM CITAS --- */}
                        <SidebarItem
                            label="Citas Técnicas"
                            isActive={activeSection === "citas"}
                            onClick={() => setActiveSection("citas")}
                        />

                        <SidebarItem
                            label="Órdenes de Trabajo"
                            isActive={activeSection === "ordenes"}
                            onClick={() => setActiveSection("ordenes")}
                        />

                        <SidebarItem
                            label="Equipos"
                            isActive={activeSection === "equipo"}
                            onClick={() => setActiveSection("equipo")}
                        />

                        <SidebarItem
                            label="Fichas Técnicas"
                            isActive={activeSection === "fichas"}
                            onClick={() => setActiveSection("fichas")}
                        />

                        <SidebarItem
                            label="Usuarios"
                            isActive={activeSection === "usuarios"}
                            onClick={() => setActiveSection("usuarios")}
                        />

                        <SidebarItem
                            label="Crear Rol"
                            isActive={activeSection === "roles"}
                            onClick={() => setActiveSection("roles")}
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
                        background:
                            "linear-gradient(90deg, #111827, #1f2937)",
                        color: "#f9fafb",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                >
                    <div>
                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                color: "#f9fafb",
                            }}
                        >
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
                                <h1
                                    style={{
                                        fontSize: "1.6rem",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                    }}
                                >
                                    Resumen de técnicos
                                </h1>
                                {dashboardData && (
                                    <span
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Actualizado:{" "}
                                        {new Date(
                                            dashboardData.fechaGeneracion
                                        ).toLocaleDateString()}
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
                                            gridTemplateColumns:
                                                "repeat(auto-fit, minmax(180px, 1fr))",
                                            gap: "1rem",
                                        }}
                                    >
                                        <DashboardCard
                                            title="Total órdenes"
                                            value={dashboardData.totalOrdenes}
                                        />
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
                                        <DashboardCard
                                            title="Técnicos con órdenes"
                                            value={dashboardData.totalTecnicos}
                                        />
                                        <DashboardCard
                                            title="Técnicos con OT abiertas"
                                            value={
                                                dashboardData.tecnicosConOrdenesAbiertas
                                            }
                                            chipColor="#f97316"
                                        />
                                        <DashboardCard
                                            title="Órdenes hoy"
                                            value={dashboardData.ordenesHoy}
                                        />
                                        <DashboardCard
                                            title="Órdenes este mes"
                                            value={dashboardData.ordenesMes}
                                        />
                                    </div>

                                    {/* BLOQUE PRINCIPAL DE “GRÁFICAS” */}
                                    <div
                                        style={{
                                            marginTop: "0.25rem",
                                            display: "grid",
                                            gridTemplateColumns:
                                                "minmax(0, 2.2fr) minmax(0, 1.8fr)",
                                            gap: "1.25rem",
                                        }}
                                    >
                                        {/* Card: Órdenes por estado (barras) */}
                                        <div
                                            style={{
                                                padding: "1rem 1.25rem",
                                                borderRadius: "12px",
                                                backgroundColor: "#ffffff",
                                                boxShadow:
                                                    "0 10px 30px rgba(15,23,42,0.08)",
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

                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "0.75rem",
                                                }}
                                            >
                                                {chartData.map((item) => (
                                                    <div key={item.label}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                fontSize: "0.8rem",
                                                                marginBottom:
                                                                    "0.15rem",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: "#4b5563",
                                                                }}
                                                            >
                                                                {item.label}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
                                                                    color: "#111827",
                                                                }}
                                                            >
                                                                {item.value}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                height: "10px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    "#e5e7eb",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(item.value /
                                                                            maxChartValue) *
                                                                        100
                                                                        }%`,
                                                                    height: "100%",
                                                                    borderRadius:
                                                                        "999px",
                                                                    backgroundColor:
                                                                        item.color,
                                                                    transition:
                                                                        "width 0.4s ease",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Card: Rendimiento general (gauge + porcentajes) */}
                                        <div
                                            style={{
                                                padding: "1rem 1.25rem",
                                                borderRadius: "12px",
                                                backgroundColor: "#ffffff",
                                                boxShadow:
                                                    "0 10px 30px rgba(15,23,42,0.08)",
                                                border: "1px solid #e5e7eb",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <h2
                                                style={{
                                                    fontSize: "0.95rem",
                                                    fontWeight: 600,
                                                    color: "#0f172a",
                                                }}
                                            >
                                                Rendimiento general
                                            </h2>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "1rem",
                                                    marginTop: "0.25rem",
                                                }}
                                            >
                                                {/* Gauge circular */}
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        width: "120px",
                                                        height: "120px",
                                                        borderRadius: "999px",
                                                        background: `conic-gradient(#22c55e ${completionRate
                                                            }%, #e5e7eb ${completionRate
                                                            }%)`,
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
                                                            backgroundColor:
                                                                "#ffffff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent:
                                                                "center",
                                                            flexDirection: "column",
                                                            boxShadow:
                                                                "0 0 0 1px #e5e7eb",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: "1.2rem",
                                                                fontWeight: 700,
                                                                color: "#16a34a",
                                                            }}
                                                        >
                                                            {Math.trunc(
                                                                completionRate
                                                            )}
                                                            %
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: "0.7rem",
                                                                color: "#6b7280",
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Órdenes
                                                            completadas
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detalle porcentual */}
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
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                width: "10px",
                                                                height: "10px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    "#22c55e",
                                                                marginRight:
                                                                    "0.4rem",
                                                            }}
                                                        />
                                                        <b>
                                                            {Math.trunc(
                                                                completionRate
                                                            )}
                                                            %
                                                        </b>{" "}
                                                        cerradas del total de
                                                        órdenes.
                                                    </div>
                                                    <div>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                width: "10px",
                                                                height: "10px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    "#f97316",
                                                                marginRight:
                                                                    "0.4rem",
                                                            }}
                                                        />
                                                        <b>
                                                            {Math.trunc(
                                                                openRate
                                                            )}
                                                            %
                                                        </b>{" "}
                                                        en estado abierto.
                                                    </div>
                                                    <div>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                width: "10px",
                                                                height: "10px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    "#3b82f6",
                                                                marginRight:
                                                                    "0.4rem",
                                                            }}
                                                        />
                                                        <b>
                                                            {Math.trunc(
                                                                processRate
                                                            )}
                                                            %
                                                        </b>{" "}
                                                        en diagnóstico /
                                                        reparación.
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginTop: "0.3rem",
                                                            fontSize: "0.75rem",
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        Estos porcentajes se
                                                        calculan sobre el total
                                                        de órdenes registradas.
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
                                            gridTemplateColumns:
                                                "minmax(0, 2.2fr) minmax(0, 1.8fr)",
                                            gap: "1.25rem",
                                        }}
                                    >
                                        {/* Técnicos asignados (detalle por técnico) */}
                                        <div
                                            style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: "12px",
                                                padding: "0.75rem 1rem 1rem",
                                                border: "1px solid #e5e7eb",
                                                boxShadow:
                                                    "0 8px 24px rgba(15,23,42,0.06)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "0.6rem",
                                                }}
                                            >
                                                <h2
                                                    style={{
                                                        fontSize: "0.95rem",
                                                        fontWeight: 600,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    Técnicos asignados
                                                </h2>
                                                <span
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        color: "#6b7280",
                                                    }}
                                                >
                                                    {dashboardData.tecnicos.length}{" "}
                                                    técnicos
                                                </span>
                                            </div>

                                            {/* “Tarjetas” por técnico */}
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "repeat(auto-fit, minmax(260px, 1fr))",
                                                    gap: "0.75rem",
                                                    marginTop: "0.4rem",
                                                }}
                                            >
                                                {dashboardData.tecnicos.map(
                                                    (t) => (
                                                        <div
                                                            key={
                                                                t.tecnicoCedula
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "10px",
                                                                border: "1px solid #e5e7eb",
                                                                padding:
                                                                    "0.6rem 0.75rem",
                                                                backgroundColor:
                                                                    "#f9fafb",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    alignItems:
                                                                        "center",
                                                                    marginBottom:
                                                                        "0.15rem",
                                                                }}
                                                            >
                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 600,
                                                                            fontSize:
                                                                                "0.9rem",
                                                                            color: "#111827",
                                                                        }}
                                                                    >
                                                                        {
                                                                            t.tecnicoNombre
                                                                        }
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "0.75rem",
                                                                            color: "#6b7280",
                                                                        }}
                                                                    >
                                                                        {
                                                                            t.tecnicoCedula
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(4, minmax(0, 1fr))",
                                                                    gap: "0.35rem",
                                                                    fontSize:
                                                                        "0.75rem",
                                                                    marginTop:
                                                                        "0.4rem",
                                                                }}
                                                            >
                                                                <TecnicoMetric
                                                                    label="Total"
                                                                    value={
                                                                        t.totalOrdenes
                                                                    }
                                                                />
                                                                <TecnicoMetric
                                                                    label="Abiertas"
                                                                    value={
                                                                        t.ordenesAbiertas
                                                                    }
                                                                    color="#f97316"
                                                                />
                                                                <TecnicoMetric
                                                                    label="Proceso"
                                                                    value={
                                                                        t.ordenesEnProceso
                                                                    }
                                                                    color="#3b82f6"
                                                                />
                                                                <TecnicoMetric
                                                                    label="Cerradas"
                                                                    value={
                                                                        t.ordenesCerradas
                                                                    }
                                                                    color="#22c55e"
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Top técnicos por órdenes (mini “gráfica” extra) */}
                                        <div
                                            style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: "12px",
                                                padding: "0.75rem 1rem 1rem",
                                                border: "1px solid #e5e7eb",
                                                boxShadow:
                                                    "0 8px 24px rgba(15,23,42,0.06)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <h2
                                                    style={{
                                                        fontSize: "0.95rem",
                                                        fontWeight: 600,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    Top técnicos por órdenes
                                                </h2>
                                                <span
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#6b7280",
                                                    }}
                                                >
                                                    Vista rápida
                                                </span>
                                            </div>

                                            {topTecnicos.length === 0 ? (
                                                <div
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        color: "#6b7280",
                                                        marginTop: "0.5rem",
                                                    }}
                                                >
                                                    No hay datos de técnicos
                                                    disponibles.
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "0.6rem",
                                                        marginTop: "0.4rem",
                                                    }}
                                                >
                                                    {topTecnicos.map((t, idx) => {
                                                        const maxTotal =
                                                            topTecnicos[0]
                                                                ?.totalOrdenes ||
                                                            1;

                                                        return (
                                                            <div
                                                                key={
                                                                    t.tecnicoCedula
                                                                }
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        marginBottom:
                                                                            "0.15rem",
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <div
                                                                            style={{
                                                                                fontWeight: 600,
                                                                                fontSize:
                                                                                    "0.9rem",
                                                                                color: "#111827",
                                                                            }}
                                                                        >
                                                                            {
                                                                                t.tecnicoNombre
                                                                            }
                                                                        </div>
                                                                        <div
                                                                            style={{
                                                                                fontSize:
                                                                                    "0.75rem",
                                                                                color: "#6b7280",
                                                                            }}
                                                                        >
                                                                            {
                                                                                t.tecnicoCedula
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            height:
                                                                                "8px",
                                                                            borderRadius:
                                                                                "999px",
                                                                            backgroundColor:
                                                                                "#e5e7eb",
                                                                            overflow:
                                                                                "hidden",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: `${(t.totalOrdenes /
                                                                                        maxTotal) *
                                                                                    100
                                                                                    }%`,
                                                                                height: "100%",
                                                                                borderRadius:
                                                                                    "999px",
                                                                                background:
                                                                                    "linear-gradient(90deg,#4f46e5,#22c55e)",
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span
                                                                        style={{
                                                                            fontSize:
                                                                                "0.8rem",
                                                                            color: "#111827",
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        {
                                                                            t.totalOrdenes
                                                                        }{" "}
                                                                        OT
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
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

                    {/* ===== SECCIÓN DE CITAS RENDERIZADA ===== */}
                    {activeSection === "citas" && <CitasModule />}

                    {/* {activeSection === "roles" && <RolModule />} */}
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
    isActive,
    onClick,
}: {
    label: string;
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
                }}
            >
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
            <div
                style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    fontWeight: 500,
                }}
            >
                {title}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                }}
            >
                <span
                    style={{
                        fontSize: "1.7rem",
                        fontWeight: 700,
                        color: "#0f172a",
                    }}
                >
                    {value}
                </span>
                {chipColor && (
                    <span
                        style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.5rem",
                            borderRadius: "999px",
                            backgroundColor: chipColor + "1a", // color con transparencia
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
            <div
                style={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontWeight: 600,
                    color: color || "#111827",
                }}
            >
                {value}
            </div>
        </div>
    );
}