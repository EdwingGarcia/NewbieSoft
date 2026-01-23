"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "../styles/Dashboard.module.css";
import DashboardView from "./dashboard/DashboardView";

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

// ✅ NUEVO: Módulo de Gestión de Usuarios
const GestionUsuarioModule = dynamic(
    () => import("../dashboard-tecnico/GestionUsuario"), // Asegúrate de que la ruta sea correcta según tu estructura
    { ssr: false }
);

// Agregamos "usuarios" al tipo
type Section = "dashboard" | "ordenes" | "equipos" | "citas" | "usuarios";

export default function DashboardTecnico() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<Section>("dashboard");

    // Leer cookie del rol
    const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1] || null;
    };

    useEffect(() => {
        const token = getCookie("token");
        const rol = getCookie("rol");

        if (!token) return router.push("/");

        if (rol !== "ROLE_TECNICO") {
            // seguridad adicional
            return router.push("/dashboard");
        }
    }, []);

    const handleLogout = () => {
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "rol=; path=/; max-age=0";
        document.cookie = "cedula=; path=/; max-age=0";
        router.push("/");
    };

    return (
        <div className={styles.container}>

            {/* ===== SIDEBAR DEL TÉCNICO ===== */}
            <aside
                className={styles.sidebar}
                style={{
                    background: "linear-gradient(180deg, #111827, #1f2937)",
                    color: "#f9fafb",
                }}
            >
                <h2 style={{ fontWeight: 700, marginBottom: "1.5rem" }}>
                    Técnico – Newbie
                </h2>

                <nav>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        <SidebarItem
                            label="Dashboard"
                            active={activeSection === "dashboard"}
                            onClick={() => setActiveSection("dashboard")}
                        />
                        <SidebarItem
                            label="Mis Órdenes"
                            active={activeSection === "ordenes"}
                            onClick={() => setActiveSection("ordenes")}
                        />
                        <SidebarItem
                            label="Mis Equipos"
                            active={activeSection === "equipos"}
                            onClick={() => setActiveSection("equipos")}
                        />
                        <SidebarItem
                            label="Mis Citas"
                            active={activeSection === "citas"}
                            onClick={() => setActiveSection("citas")}
                        />

                        {/* ✅ NUEVO ITEM EN SIDEBAR */}
                        <div style={{ margin: "1rem 0", borderTop: "1px solid rgba(255,255,255,0.1)" }}></div>

                        <SidebarItem
                            label="Gestión Usuarios"
                            active={activeSection === "usuarios"}
                            onClick={() => setActiveSection("usuarios")}
                        />
                    </ul>
                </nav>
            </aside>

            {/* ===== MAIN ===== */}
            <main className={styles.main}>
                <header
                    className={styles.header}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.8rem 1rem",
                        background: "linear-gradient(90deg, #111827, #1f2937)",
                        color: "#f9fafb",
                    }}
                >
                    <span style={{ fontWeight: 600 }}>
                        {activeSection === "dashboard" && "Reaaaan"}
                        {activeSection === "ordenes" && "Gestión de Órdenes"}
                        {activeSection === "equipos" && "Inventario de Equipos"}
                        {activeSection === "citas" && "Agenda de Citas"}
                        {activeSection === "usuarios" && "Administración de Usuarios"}
                    </span>

                    <button
                        onClick={handleLogout}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(255,255,255,0.3)",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        Cerrar sesión
                    </button>
                </header>

                <section className={styles.content}>
                    {activeSection === "dashboard" && (
                        <DashboardView onGoCitas={() => setActiveSection("citas")} />
                    )}
                    {activeSection === "ordenes" && <OrdenesTecnicoModule />}
                    {activeSection === "equipos" && <EquiposTecnicoModule />}
                    {activeSection === "citas" && <CitasTecnicoModule />}
                    {/* ✅ RENDERIZADO DE USUARIOS */}
                    {activeSection === "usuarios" && <GestionUsuarioModule />}
                </section>
            </main>
        </div>
    );
}

/* ======================
   SidebarItem componente
   ====================== */
function SidebarItem({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <li style={{ marginBottom: "0.5rem" }}>
            <button
                onClick={onClick}
                style={{
                    width: "100%",
                    textAlign: "left",
                    background: active
                        ? "linear-gradient(90deg, #6366f1, #4f46e5)" // Indigo gradient
                        : "transparent",
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    color: active ? "#fff" : "#9ca3af", // Gray-400 for inactive
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                }}
                onMouseOver={(e) => {
                    if (!active) e.currentTarget.style.color = "#f3f4f6"; // Gray-100
                }}
                onMouseOut={(e) => {
                    if (!active) e.currentTarget.style.color = "#9ca3af";
                }}
            >
                {label}
            </button>
        </li>
    );
}