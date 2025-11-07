"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/Dashboard.module.css";
import dynamic from "next/dynamic";

// Carga dinámica del módulo de Ficha Técnica
const FichaTecnicaModule = dynamic(() => import("./FichasTecnicasPage"), { ssr: false });

export default function DashboardPage() {
    const router = useRouter();

    // 🧭 Verificación de sesión (token)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) router.push("/");
    }, [router]);

    // 🔹 Cerrar sesión correctamente
    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            if (token) {
                await fetch("http://localhost:8080/api/auth/logout", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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
        <div className={styles.container}>
            {/* ===== Sidebar ===== */}
            <aside className={styles.sidebar}>
                <h2>Newbie Data Control</h2>
                <nav>
                    <ul>
                        <li>Dashboard</li>
                        <li>Crear rol</li>
                        <li>Crear usuario</li>
                        <li>Agendar visita</li>
                        <li>Historial</li>
                        <li>Ajustes</li>
                        <li style={{ fontWeight: "bold", color: "#fff" }}>Ficha Técnica</li>
                    </ul>
                </nav>
            </aside>

            {/* ===== Main content ===== */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <span>Administrador</span> |{" "}
                    <button
                        onClick={handleLogout}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#0070f3",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                            textDecoration: "underline",
                        }}
                    >
                        Cerrar sesión
                    </button>
                </header>

                {/* ===== Contenido dinámico ===== */}
                <section className={styles.content}>
                    <h1>Gestión de Fichas Técnicas 🧰</h1>
                    <FichaTecnicaModule />
                </section>
            </main>
        </div>
    );
}
