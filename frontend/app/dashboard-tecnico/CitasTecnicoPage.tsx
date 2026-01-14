"use client";

import { useEffect, useState } from "react";

/* =========================
   Tipos
========================= */
interface Cita {
    id: number;
    fechaProgramada?: string;
    motivo?: string;
    estado?: string;
    usuario?: {
        nombre?: string;
        cedula?: string;
    };
}

/* =========================
   Helpers auth
========================= */
function getAuthToken(): string | null {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("nb.auth.token")
    );
}

function getCedulaTecnico(): string | null {
    return localStorage.getItem("cedula");
}

/* =========================
   Componente principal
========================= */
export default function CitasTecnicoPage() {
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const token = getAuthToken();
    const tecnicoCedula = getCedulaTecnico();

    /* =========================
       Fetch citas del técnico
    ========================= */
    const fetchCitas = async () => {
        if (!token || !tecnicoCedula) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `http://localhost:8080/api/citas/tecnico/${tecnicoCedula}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Error al cargar citas");

            const data = await res.json();
            setCitas(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar tus citas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitas();
    }, []);

    /* =========================
       Acciones
    ========================= */
    const actualizarEstado = async (citaId: number, estado: "COMPLETADA" | "CANCELADA") => {
        if (!token) return;

        setUpdatingId(citaId);

        try {
            const res = await fetch(
                `http://localhost:8080/api/citas/${citaId}/completar`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ estado }),
                }
            );

            if (!res.ok) throw new Error("No se pudo actualizar la cita");

            setCitas((prev) =>
                prev.map((c) =>
                    c.id === citaId ? { ...c, estado } : c
                )
            );
        } catch (err) {
            console.error(err);
            alert("Error actualizando la cita");
        } finally {
            setUpdatingId(null);
        }
    };

    /* =========================
       Render
    ========================= */
    return (
        <div style={{ padding: "1rem" }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>
                Mis Citas
            </h1>

            {loading && <p>Cargando citas...</p>}

            {error && (
                <div style={{ color: "#b91c1c", marginBottom: "1rem" }}>
                    {error}
                </div>
            )}

            {!loading && citas.length === 0 && (
                <p>No tienes citas asignadas.</p>
            )}

            <div style={{ display: "grid", gap: "0.75rem" }}>
                {citas.map((cita) => {
                    const estado = (cita.estado || "").toUpperCase();
                    const disabled = estado !== "PENDIENTE";

                    return (
                        <div
                            key={cita.id}
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                padding: "0.75rem",
                                background: "#fff",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.4rem",
                            }}
                        >
                            <strong>{cita.motivo || "Cita técnica"}</strong>

                            <span style={{ fontSize: "0.85rem", color: "#374151" }}>
                                Cliente: {cita.usuario?.nombre || "—"} ({cita.usuario?.cedula})
                            </span>

                            <span style={{ fontSize: "0.85rem", color: "#374151" }}>
                                Fecha:{" "}
                                {cita.fechaProgramada
                                    ? new Date(cita.fechaProgramada).toLocaleString()
                                    : "—"}
                            </span>

                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color:
                                        estado === "COMPLETADA"
                                            ? "#166534"
                                            : estado === "CANCELADA"
                                            ? "#991b1b"
                                            : "#1e40af",
                                }}
                            >
                                Estado: {estado}
                            </span>

                            {/* Acciones */}
                            {estado === "PENDIENTE" && (
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                                    <button
                                        disabled={updatingId === cita.id}
                                        onClick={() => actualizarEstado(cita.id, "COMPLETADA")}
                                        style={{
                                            padding: "0.3rem 0.6rem",
                                            background: "#16a34a",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ✔ Completada
                                    </button>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
