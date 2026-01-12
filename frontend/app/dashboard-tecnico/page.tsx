"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "../styles/Dashboard.module.css"; // puedes reusar el mismo CSS
import DashboardView from "./dashboard/DashboardView";
// Para las próximas vistas (las cargaremos luego)
const EquiposTecnicoModule = dynamic(
    () => import("./EquiposTecnicoPage"),
    { ssr: false }
);
const OrdenesTecnicoModule = dynamic(
                                       () => import("./OrdenesTrabajoTecnicoPage"),
                                       { ssr: false }
                                   );
const FichasTecnicoModule =  dynamic(
                                       () => import("./FichasTecnicoPage"),
                                       { ssr: false }
                                   );

type Section = "dashboard" | "ordenes" | "equipos" | "fichas";

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
                            label="Mis Fichas Técnicas"
                            active={activeSection === "fichas"}
                            onClick={() => setActiveSection("fichas")}
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
                    <span style={{ fontWeight: 600 }}>Panel Técnico</span>

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
                        🚪 Cerrar sesión
                    </button>
                </header>

                <section className={styles.content}>
                    {activeSection === "dashboard" && <DashboardView />}
                    {activeSection === "ordenes" && <OrdenesTecnicoModule />}
                    {activeSection === "equipos" && <EquiposTecnicoModule />}
                    {activeSection === "fichas" && <FichasTecnicoModule />}
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
        <li>
            <button
                onClick={onClick}
                style={{
                    width: "100%",
                    textAlign: "left",
                    background: active
                        ? "linear-gradient(90deg,#6366f1,#4f46e5)"
                        : "transparent",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "999px",
                    border: "none",
                    color: active ? "#fff" : "#e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                }}
            >
                {label}
            </button>
        </li>
    );
}
