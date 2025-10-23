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
                    <span>Administrador</span> | <a href="/login">Cerrar sesión</a>
                </header>
                <section className={styles.content}>
                    <h1>Bienvenido al Dashboard 🎉</h1>
                    <p>Contenido vacío por ahora.</p>
                </section>
            </main>
        </div>
    );
}
