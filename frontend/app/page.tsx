"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./styles/login.css";

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
            const response = await fetch("http://localhost:8081/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ correo, password }),
            });

            if (!response.ok) {
                throw new Error("Credenciales incorrectas");
            }

            const data = await response.json();
            console.log("✅ Login exitoso:", data);

            // Guardar el token
            localStorage.setItem("token", data.token);

            setMensaje("✅ Login exitoso, redirigiendo...");
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error: any) {
            console.error("❌ Error en login:", error);
            setMensaje("Usuario o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Iniciar sesión</h1>
                <p>
                    Ingresa tus credenciales para iniciar sesión. <br />
                    Si no las tienes, solicítalas al administrador.
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                >
                    <div>
                        <label>Correo electrónico*</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Cargando..." : "Ingresar"}
                    </button>

                    {mensaje && (
                        <p
                            style={{
                                textAlign: "center",
                                marginTop: "1rem",
                                color: "#fff",
                                fontWeight: 500,
                            }}
                        >
                            {mensaje}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
