"use client";

import { useEffect, useState } from "react";
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
const OrdenTrabajoModule = dynamic(
    () => import("./OrdenesTrabajoPage"),
    { ssr: false }
);
// const RolModule = dynamic(() => import("./GestionRol"), { ssr: false }); // opcional

type Section = "ordenes" | "fichas" | "equipo" | "usuarios" | "roles";

export default function DashboardPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<Section>("ordenes");

    // 🔑 Verificar sesión activa
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) router.push("/");
    }, [router]);

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
        <div className={styles.container}>
            {/* ===== Sidebar ===== */}
            <aside className={styles.sidebar}>
                <h2>Newbie Data Control</h2>
                <nav>
                    <ul>
                        <li
                            style={{
                                color: "#bbb",
                                fontWeight: "bold",
                                marginBottom: "1rem",
                                cursor: "default",
                            }}
                        >
                            Dashboard
                        </li>

                        {/* Secciones */}
                        <li
                            onClick={() => setActiveSection("ordenes")}
                            style={{
                                fontWeight:
                                    activeSection === "ordenes" ? "bold" : "normal",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Órdenes de Trabajo
                        </li>

                        <li
                            onClick={() => setActiveSection("equipo")}
                            style={{
                                fontWeight:
                                    activeSection === "equipo" ? "bold" : "normal",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Equipos
                        </li>

                        <li
                            onClick={() => setActiveSection("fichas")}
                            style={{
                                fontWeight:
                                    activeSection === "fichas" ? "bold" : "normal",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Fichas Técnicas
                        </li>

                        <li
                            onClick={() => setActiveSection("usuarios")}
                            style={{
                                fontWeight:
                                    activeSection === "usuarios" ? "bold" : "normal",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Usuarios
                        </li>

                        <li
                            onClick={() => setActiveSection("roles")}
                            style={{
                                fontWeight:
                                    activeSection === "roles" ? "bold" : "normal",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Crear Rol
                        </li>
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
                            color: "#edededff",
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
                    {activeSection === "ordenes" && <OrdenTrabajoModule />}
                    {activeSection === "fichas" && <FichaTecnicaModule />}
                    {activeSection === "equipo" && <EquipoModule />}
                    {activeSection === "usuarios" && <UsuarioModule />}
                    {/* {activeSection === "roles" && <RolModule />} */}
                </section>
            </main>
        </div>
    );
}
