"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/app/utils/auth";
import "./styles/login.css";
import { API_BASE_URL } from "../app/lib/api";
export default function Home() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        setMensaje("Verificando credenciales...");

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ correo, password }),
            });

            if (!response.ok) throw new Error("Credenciales incorrectas");

            const data = await response.json();
            console.log("✅ Login exitoso:", data);

            // Guardar sesión
            localStorage.setItem("token", data.token);
            localStorage.setItem("rol", data.rol);
            localStorage.setItem("cedula", data.cedula);

            document.cookie = `token=${data.token}; path=/`;
            document.cookie = `rol=${data.rol}; path=/`;
            document.cookie = `cedula=${data.cedula}; path=/`;

            setMensaje("Accediendo al panel...");

            setTimeout(() => {
                if (data.rol === "ROLE_ADMIN") {
                    router.push("/dashboard");
                } else if (data.rol === "ROLE_TECNICO") {
                    router.push("/dashboard-tecnico");
                } else {
                    router.push("/");
                }
            }, 900);

        } catch (error) {
            console.error("❌ Error en login:", error);
            setMensaje("Usuario o contraseña incorrectos");
        }

    };

    return (
        <div className="login-container">
            {/* CONTENIDO INTERNO (se mantiene igual) */}
            <div className="w-full max-w-5xl grid gap-8 md:grid-cols-[1.2fr_1fr] items-center px-6">

                {/* PANEL IZQUIERDO */}
                <div className="hidden md:flex flex-col gap-6 text-slate-50">

                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                        <span className="inline-block h-[1px] w-6 bg-slate-500" />
                        Newbie Data Control
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-semibold text-slate-50 leading-snug">
                            Sistema interno de<br />gestión de soporte técnico
                        </h1>
                        <p className="text-sm text-slate-300 max-w-md leading-relaxed">
                            Optimiza y centraliza todo el flujo técnico: desde el ingreso del
                            equipo hasta la entrega final. Diseñado para brindar control y eficiencia.
                        </p>
                    </div>

                    <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/50 px-4 py-4 text-sm text-slate-200 leading-relaxed shadow-lg">
                        <p>
                            Bienvenido al entorno administrativo de <strong>NewbieCore</strong>.
                            Este acceso es exclusivo para personal autorizado.
                        </p>
                        <p className="mt-2 text-slate-400 text-[12px]">
                            Todas las acciones realizadas quedan registradas para auditorías internas.
                        </p>
                    </div>

                    <div className="mt-1 flex flex-col gap-2 text-[11px] text-slate-300">
                        <span className="uppercase tracking-[0.2em] text-slate-400">
                            Flujo general
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 border border-slate-700 bg-slate-950/40 rounded-sm text-[11px]">
                                Ingreso
                            </span>
                            <span>→</span>
                            <span className="px-2 py-1 border border-slate-700 bg-slate-950/40 rounded-sm text-[11px]">
                                Diagnóstico
                            </span>
                            <span>→</span>
                            <span className="px-2 py-1 border border-slate-700 bg-slate-950/40 rounded-sm text-[11px]">
                                Reparación
                            </span>
                            <span>→</span>
                            <span className="px-2 py-1 border border-slate-700 bg-slate-950/40 rounded-sm text-[11px]">
                                Cierre / Entrega
                            </span>
                        </div>
                    </div>

                </div>

                {/* PANEL DERECHO – LOGIN */}
                <div className="bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-sm px-6 py-6 rounded-md">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-slate-50">
                            Iniciar sesión
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Autenticación requerida para acceder al panel.
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin();
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-200">
                                Correo electrónico *
                            </label>
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                placeholder="admin@newbie.com"
                                required
                                className="w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-200">
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? "Verificando..." : "Ingresar"}
                        </button>

                        {mensaje && (
                            <p className="mt-3 text-center text-xs font-medium text-slate-200">
                                {mensaje}
                            </p>
                        )}
                    </form>

                    <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="text-[11px] text-slate-500">
                            NewbieCore © Sistema interno corporativo.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
