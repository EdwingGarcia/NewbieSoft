"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "../styles/Dashboard.module.css";
import DashboardView from "./dashboard/DashboardView";

// Importar sistema de configuración (igual que dashboard admin)
import { useSidebarStyle, useAppName, useSessionMonitor, useAutoRefresh } from "../lib/useConfig";

// --- MÓDULOS DINÁMICOS ---
const EquiposTecnicoModule = dynamic(
    () => import("./EquiposTecnicoPage"),
    { ssr: false }
);
const OrdenesTecnicoModule = dynamic(
    () => import("./OrdenesTrabajoTecnicoPage"),
    { ssr: false }
);
const CitasTecnicoModule = dynamic(
    () => import("./CitasTecnicoPage"),
    { ssr: false }
);
const GestionUsuarioModule = dynamic(
    () => import("./GestionUsuario"),
    { ssr: false }
);

type Section = "dashboard" | "ordenes" | "equipos" | "citas" | "usuarios";

export default function DashboardTecnico() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<Section>("dashboard");
    
    // Usar hooks de configuración (igual que dashboard admin)
    const sidebarStyle = useSidebarStyle();
    const appName = useAppName();
    const [sidebarHovered, setSidebarHovered] = useState(false);
    
    // Calcular si el sidebar está expandido basado en el estilo configurado
    const isSidebarExpanded = 
        sidebarStyle === "expanded" ? true : 
        sidebarStyle === "collapsed" ? false : 
        sidebarHovered; // "auto" mode: expandir solo en hover

    // Leer cookie del rol
    const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1] || null;
    };

    // Monitor de sesión - cierra sesión por inactividad
    const handleSessionTimeout = useCallback(() => {
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "rol=; path=/; max-age=0";
        document.cookie = "cedula=; path=/; max-age=0";
        router.push("/?timeout=1");
    }, [router]);
    
    useSessionMonitor(handleSessionTimeout);

    useEffect(() => {
        const token = getCookie("token");
        const rol = getCookie("rol");

        if (!token) return router.push("/");

        if (rol !== "ROLE_TECNICO") {
            return router.push("/dashboard");
        }
    }, [router]);

    const handleLogout = () => {
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "rol=; path=/; max-age=0";
        document.cookie = "cedula=; path=/; max-age=0";
        router.push("/");
    };

    return (
        <div
            className={styles.container}
            style={{ backgroundColor: "#f5f5ff", color: "#111827" }}
        >
            {/* ===== Sidebar con mismo diseño que dashboard admin ===== */}
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
                            label="Mis Órdenes"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                            isActive={activeSection === "ordenes"}
                            onClick={() => setActiveSection("ordenes")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Mis Equipos"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                            isActive={activeSection === "equipos"}
                            onClick={() => setActiveSection("equipos")}
                            collapsed={!isSidebarExpanded}
                        />

                        <SidebarItem
                            label="Mis Citas"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
                            isActive={activeSection === "citas"}
                            onClick={() => setActiveSection("citas")}
                            collapsed={!isSidebarExpanded}
                        />

                        {/* Separador visual */}
                        <li style={{ flex: 1 }} />

                        {/* Usuarios al final del sidebar */}
                        <SidebarItem
                            label="Gestión Usuarios"
                            iconSvg={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                            isActive={activeSection === "usuarios"}
                            onClick={() => setActiveSection("usuarios")}
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
                            🔧 Panel de Técnico
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
                    {activeSection === "dashboard" && (
                        <DashboardView onGoCitas={() => setActiveSection("citas")} />
                    )}
                    {activeSection === "ordenes" && <OrdenesTecnicoModule />}
                    {activeSection === "equipos" && <EquiposTecnicoModule />}
                    {activeSection === "citas" && <CitasTecnicoModule />}
                    {activeSection === "usuarios" && <GestionUsuarioModule />}
                </section>
            </main>
        </div>
    );
}

/* ======================
   SidebarItem componente (mismo estilo que dashboard admin)
   ====================== */
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