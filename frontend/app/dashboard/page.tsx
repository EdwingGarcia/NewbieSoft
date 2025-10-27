"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/Dashboard.module.css";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) router.push("/");
    }, [router]);

    // 🔹 Función para cerrar sesión correctamente
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
            // Limpia cualquier dato del login
            localStorage.removeItem("token");
            localStorage.removeItem("nb.auth");
            localStorage.removeItem("nb.auth.token");

            // Redirige al inicio o login
            router.push("/");
        }
    };

    return (
        <div className={styles.container}>
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
                    </ul>
                </nav>
            </aside>

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

                <section className={styles.content}>
                    <h1>Bienvenido al Dashboard 🎉</h1>
                    <p>Contenido vacío por ahora.</p>
                </section>
            </main>
        </div>
    );
}
