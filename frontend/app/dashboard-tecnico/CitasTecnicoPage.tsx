"use client";

import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../lib/api";
import { X, Clock, User, UserCog, Mail, MapPin, Phone, Search, Filter } from "lucide-react";

/* =========================
   Tipos
========================= */
interface Usuario {
    cedula: string;
    nombre: string;
    correo: string;
    telefono: string;
    direccion: string;
}

interface Tecnico {
    cedula: string;
    nombre: string;
    correo: string;
    apellido?: string;
}

interface Cita {
    id: number;
    fechaProgramada: string;
    fechaCreacion: string;
    motivo: string;
    estado: string;
    usuario: Usuario;
    tecnico: Tecnico;
}

/* =========================
   Helpers
========================= */
function getAuthToken(): string | null {
    return localStorage.getItem("token") || localStorage.getItem("nb.auth.token");
}

function getCedulaTecnico(): string | null {
    return localStorage.getItem("cedula");
}

const InfoItem = ({ label, value, icon, monospace }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode; monospace?: boolean }) => (
    <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
        {icon && <div style={{ marginTop: "2px", color: "#64748b" }}>{icon}</div>}
        <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 500, fontFamily: monospace ? "monospace" : "inherit", wordBreak: "break-word" }}>{value || "—"}</span>
        </div>
    </div>
);

/* =========================
   MODAL (Detalle)
========================= */
function CitaDetailModal({ cita, onClose }: { cita: Cita; onClose: () => void }) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const estado = (cita.estado ?? "").toUpperCase();
    const estadoStyles = estado === "COMPLETADA" ? { bg: "#dcfce7", border: "#86efac", text: "#166534" } :
        estado === "CANCELADA" ? { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" } :
            { bg: "#e0e7ff", border: "#c7d2fe", text: "#3730a3" };

    return (
        <div role="dialog" aria-modal="true" onClick={onClose} style={{
            position: "fixed", inset: 0, width: "100vw", height: "100vh",
            background: "rgba(2, 6, 23, 0.6)", backdropFilter: "blur(4px)",
            zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                width: "100%", maxWidth: "750px", borderRadius: "16px",
                backgroundColor: "#fff", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh"
            }}>
                <div style={{ padding: "1rem 1.5rem", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700 }}>CITA #{String(cita.id).padStart(4, "0")}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Detalle de Servicio</div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer" }}><X size={18} /></button>
                </div>
                <div style={{ padding: "1.5rem", overflowY: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, marginBottom: "0.4rem" }}>ESTADO</div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", borderRadius: "99px", background: estadoStyles.bg, border: `1px solid ${estadoStyles.border}`, color: estadoStyles.text, fontWeight: 700, fontSize: "0.8rem" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: estadoStyles.text }} />{cita.estado}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, marginBottom: "0.4rem" }}>FECHA</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 600 }}>
                                <Clock size={16} color="#3b82f6" />{new Date(cita.fechaProgramada).toLocaleString("es-ES")}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                        <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                            <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}><User size={16} /> CLIENTE</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <InfoItem label="Nombre" value={cita.usuario.nombre} />
                                <InfoItem label="Cédula" value={cita.usuario.cedula} monospace />
                                <InfoItem label="Correo" value={cita.usuario.correo} icon={<Mail size={14} />} />
                                <InfoItem label="Teléfono" value={cita.usuario.telefono} icon={<Phone size={14} />} monospace />
                                <InfoItem label="Dirección" value={cita.usuario.direccion} icon={<MapPin size={14} />} />
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}><UserCog size={16} /> TÉCNICO</h4>
                                <InfoItem label="Nombre" value={cita.tecnico.nombre} />
                            </div>
                            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", flex: 1 }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>MOTIVO</h4>
                                <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.6, background: "#f1f5f9", padding: "0.75rem", borderRadius: "8px" }}>{cita.motivo}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "0.5rem 1.5rem", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, cursor: "pointer", color: "#0f172a" }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}

/* =========================
   PÁGINA PRINCIPAL
========================= */
export default function CitasTecnicoPage() {
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const token = getAuthToken();
    const tecnicoCedula = getCedulaTecnico();

    const fetchCitas = async () => {
        if (!token || !tecnicoCedula) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/citas/tecnico/${tecnicoCedula}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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

    useEffect(() => { fetchCitas(); }, []);

    const actualizarEstado = async (citaId: number, estado: "COMPLETADA" | "CANCELADA", e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!token) return;
        setUpdatingId(citaId);
        try {
            const res = await fetch(`${API_BASE_URL}/api/citas/${citaId}/completar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ estado }),
            });
            if (!res.ok) throw new Error("Error actualizando");
            setCitas((prev) => prev.map((c) => c.id === citaId ? { ...c, estado } : c));
        } catch (err) {
            console.error(err);
            alert("Error actualizando la cita");
        } finally {
            setUpdatingId(null);
        }
    };

    const citasFiltradas = useMemo(() => {
        if (!searchTerm) return citas;
        const lowerTerm = searchTerm.toLowerCase();
        return citas.filter((c) => {
            const fullString = `${c.motivo} ${c.usuario.nombre} ${c.usuario.cedula} ${c.usuario.direccion} ${c.usuario.correo} ${c.id}`.toLowerCase();
            return fullString.includes(lowerTerm);
        });
    }, [citas, searchTerm]);

    const now = new Date();
    const citasAtrasadas: Cita[] = [];
    const citasPendientes: Cita[] = [];
    const citasCompletadas: Cita[] = [];

    citasFiltradas.forEach((cita) => {
        const estado = (cita.estado || "").toUpperCase();
        const fechaCita = new Date(cita.fechaProgramada);
        if (estado === "COMPLETADA") citasCompletadas.push(cita);
        else if (estado === "PENDIENTE") {
            if (fechaCita < now) citasAtrasadas.push(cita);
            else citasPendientes.push(cita);
        }
    });

    const renderCard = (cita: Cita, esAtrasada: boolean = false) => {
        const estado = (cita.estado || "").toUpperCase();
        return (
            <div
                key={cita.id}
                onDoubleClick={() => setSelectedCita(cita)}
                title="Doble clic para ver detalles"
                style={{
                    border: esAtrasada ? "1px solid #f87171" : "1px solid #e2e8f0",
                    borderLeft: esAtrasada ? "5px solid #dc2626" : "1px solid #e2e8f0",
                    borderRadius: "10px", padding: "1rem", background: "#fff",
                    display: "flex", flexDirection: "column", gap: "0.6rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    cursor: "pointer", userSelect: "none", transition: "transform 0.1s ease-in-out"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <strong style={{ fontSize: '0.9rem', color: "#1e293b", lineHeight: 1.3 }}>{cita.motivo || "Cita técnica"}</strong>
                    {esAtrasada && <span style={{ fontSize: "0.65rem", background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px", fontWeight: "800" }}>ATRASADA</span>}
                </div>
                <div style={{ padding: "0.5rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "0.8rem", color: "#334155", display: "block", fontWeight: 600 }}>👤 {cita.usuario.nombre}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>ID: {cita.usuario.cedula}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}><MapPin size={10} /> {cita.usuario.direccion}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={12} /> {new Date(cita.fechaProgramada).toLocaleString("es-ES")}
                </span>
                {estado !== "COMPLETADA" && (
                    <div style={{ marginTop: "0.5rem" }}>
                        <button disabled={updatingId === cita.id} onClick={(e) => actualizarEstado(cita.id, "COMPLETADA", e)} style={{ width: "100%", padding: "0.6rem", background: esAtrasada ? "#dc2626" : "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", opacity: updatingId === cita.id ? 0.7 : 1, fontWeight: 700, fontSize: '0.8rem', boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
                            {updatingId === cita.id ? "Guardando..." : "✔ Marcar como Completada"}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ====== CONFIGURACIÓN DE SCROLL ======
    // 600px es aprox la altura de 3 tarjetas estándar + espaciado.
    const columnScrollStyle: React.CSSProperties = {
        maxHeight: "600px",
        overflowY: "auto",
        paddingRight: "5px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
    };

    return (
        <div style={{ padding: "1.5rem", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

            {/* Buscador */}
            <div style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Tablero de Citas</h1>
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>Mostrando <b>{citasFiltradas.length}</b> de {citas.length}</div>
                </div>
                <div style={{ position: "relative", width: "100%", maxWidth: "500px" }}>
                    <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}><Search size={18} /></div>
                    <input type="text" placeholder="Buscar por cliente, cédula, dirección..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 2.5rem", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "0.95rem", boxShadow: "0 2px 5px rgba(0,0,0,0.02)", outline: "none" }} />
                </div>
            </div>

            {loading && <p>Cargando citas...</p>}
            {error && <div style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</div>}

            {!loading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", alignItems: "start", flex: 1 }}>

                    {/* Columna Atrasadas */}
                    <div style={{ background: "#fff", padding: "1rem", borderRadius: "16px", border: "1px solid #fca5a5", boxShadow: "0 10px 15px -3px rgba(220, 38, 38, 0.05)" }}>
                        <h2 style={{ fontSize: "1rem", color: "#b91c1c", marginBottom: "1rem", display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, paddingBottom: "0.5rem", borderBottom: "1px dashed #fca5a5" }}>
                            🚨 Atrasadas <span style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{citasAtrasadas.length}</span>
                        </h2>
                        <div className="custom-scroll" style={columnScrollStyle}>
                            {citasAtrasadas.length === 0 && <span style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", padding: "1rem" }}>¡Al día! No hay citas atrasadas.</span>}
                            {citasAtrasadas.map(c => renderCard(c, true))}
                        </div>
                    </div>

                    {/* Columna Pendientes */}
                    <div style={{ background: "#fff", padding: "1rem", borderRadius: "16px", border: "1px solid #bfdbfe", boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.05)" }}>
                        <h2 style={{ fontSize: "1rem", color: "#1d4ed8", marginBottom: "1rem", display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, paddingBottom: "0.5rem", borderBottom: "1px dashed #bfdbfe" }}>
                            ⏳ Próximas <span style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{citasPendientes.length}</span>
                        </h2>
                        <div className="custom-scroll" style={columnScrollStyle}>
                            {citasPendientes.length === 0 && <span style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", padding: "1rem" }}>No tienes citas pendientes.</span>}
                            {citasPendientes.map(c => renderCard(c, false))}
                        </div>
                    </div>

                    {/* Columna Completadas */}
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "16px", border: "1px solid #cbd5e1", opacity: 0.9 }}>
                        <h2 style={{ fontSize: "1rem", color: "#15803d", marginBottom: "1rem", display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, paddingBottom: "0.5rem", borderBottom: "1px dashed #86efac" }}>
                            ✅ Historial <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{citasCompletadas.length}</span>
                        </h2>
                        <div className="custom-scroll" style={columnScrollStyle}>
                            {citasCompletadas.length === 0 && <span style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", padding: "1rem" }}>Historial vacío.</span>}
                            {citasCompletadas.map(c => renderCard(c, false))}
                        </div>
                    </div>
                </div>
            )}
            {selectedCita && <CitaDetailModal cita={selectedCita} onClose={() => setSelectedCita(null)} />}

            <style jsx global>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
            `}</style>
        </div>
    );
}