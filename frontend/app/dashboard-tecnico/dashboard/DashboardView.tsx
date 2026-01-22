"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "../../styles/Dashboard.module.css";
import KpiCard from "./KpiCard";
import { useDashboard } from "./useDashboard";
import { API_BASE_URL } from "../../lib/api";
import {
  Wrench,
  CheckCircle,
  ClipboardList,
  Clock,
  Calendar,
  CalendarDays,
} from "lucide-react";

/* =========================
   Interfaces
========================= */
interface Cita {
  id: number;
  usuario?: {
    cedula?: string;
    nombre?: string;
    correo?: string;
    telefono?: string;
    direccion?: string;
  };
  tecnico?: {
    cedula?: string;
    nombre?: string;
  };
  fechaProgramada?: string;
  fechaCreacion?: string;
  motivo?: string;
  estado?: string;
  [key: string]: any;
}

/* =========================
   Helpers
========================= */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const getCitaDateObj = (c: Cita) => {
  const raw = c.fechaProgramada ?? c.fechaCreacion;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const normalizeEstado = (e?: string) => (e ?? "").toUpperCase().trim();

const isCompletada = (c: Cita) => {
  const e = normalizeEstado(c.estado);
  return e === "COMPLETADA" || e === "COMPLETADO";
};

const isPendiente = (c: Cita) => normalizeEstado(c.estado) === "PENDIENTE";

const formatCitaDate = (c: Cita) => {
  const raw = c.fechaProgramada ?? c.fechaCreacion;
  if (!raw) return "Sin fecha";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString();
};

const getCitaTitle = (c: Cita) => c.motivo || `Cita #${c.id}`;

const getCitaSubtitle = (c: Cita) => {
  const nombre = c.usuario?.nombre;
  const cedula = c.usuario?.cedula;
  const clienteLabel = nombre
    ? cedula
      ? `Cliente: ${nombre} (${cedula})`
      : `Cliente: ${nombre}`
    : cedula
      ? `Cliente: ${cedula}`
      : null;
  const parts = [clienteLabel].filter(Boolean).join(" • ");
  return parts || "—";
};

/* =========================
   Componente Principal
========================= */
export default function DashboardView({
  onGoCitas,
}: {
  onGoCitas: () => void;
}) {
  const {
    totalAsignadas,
    abiertas,
    cerradas,
    tiempoPromedioHoras,
    ordenesHoy,
    ordenesMes,
    cargarDatos,
  } = useDashboard();

  // Estados de citas
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasLoading, setCitasLoading] = useState(false);
  const [citasError, setCitasError] = useState<string | null>(null);
  const [citasActionError, setCitasActionError] = useState<string | null>(null);
  const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);
  const [citasView, setCitasView] = useState<"PENDIENTES" | "COMPLETADAS">("PENDIENTES");
  const [userCedula, setUserCedula] = useState<string>("");

  /* ===== KPIs ===== */
  useEffect(() => {
    cargarDatos();
  }, []);

  /* ===== CARGAR CITAS ===== */
  useEffect(() => {
    const cargarCitas = async () => {
      try {
        setCitasLoading(true);
        setCitasError(null);

        const token = localStorage.getItem("token");
        const cedula = localStorage.getItem("cedula") || "";

        setUserCedula(cedula);

        if (!token || !cedula) {
          setCitas([]);
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/api/citas/tecnico/${cedula}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Error ${res.status} al cargar citas`);
        }

        const json = await res.json();
        const arr: Cita[] = Array.isArray(json) ? json : json?.data ?? [];
        setCitas(arr);
      } catch (e) {
        console.error("Error cargando citas:", e);
        setCitasError("No se pudieron cargar las citas del técnico.");
        setCitas([]);
      } finally {
        setCitasLoading(false);
      }
    };

    cargarCitas();
  }, []);

  /* ===== MARCAR CITA COMO COMPLETADA ===== */
  const marcarCitaComoCompletada = async (citaId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setUpdatingCitaId(citaId);
    setCitasActionError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/citas/${citaId}/completar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: "COMPLETADA" }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Error ${res.status} actualizando cita. ${msg}`);
      }

      setCitas((prev) =>
        prev.map((c) => (c.id === citaId ? { ...c, estado: "COMPLETADA" } : c))
      );
    } catch (e) {
      console.error(e);
      setCitasActionError("No se pudo marcar la cita como completada.");
    } finally {
      setUpdatingCitaId(null);
    }
  };

  /* ===== FILTRAR CITAS HOY/MAÑANA ===== */
  const { hoy, manana } = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date(today.getTime() + 24 * 60 * 60 * 1000));

    const base =
      citasView === "PENDIENTES"
        ? citas.filter(isPendiente)
        : citas.filter(isCompletada);

    const sortByTime = (a: Cita, b: Cita) => {
      const da = getCitaDateObj(a)?.getTime() ?? 0;
      const db = getCitaDateObj(b)?.getTime() ?? 0;
      return da - db;
    };

    const hoyArr = base
      .filter((c) => {
        const d = getCitaDateObj(c);
        return d ? isSameDay(d, today) : false;
      })
      .sort(sortByTime);

    const mananaArr = base
      .filter((c) => {
        const d = getCitaDateObj(c);
        return d ? isSameDay(d, tomorrow) : false;
      })
      .sort(sortByTime);

    return { hoy: hoyArr, manana: mananaArr };
  }, [citas, citasView]);

  return (
    <div>
      <h1>Resumen del técnico</h1>

      {/* ===== KPI GRID ===== */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="OTs asignadas"
          value={totalAsignadas}
          icon={<ClipboardList size={28} />}
        />

        <KpiCard
          title="OTs abiertas"
          value={abiertas}
          icon={<Wrench size={28} />}
        />

        <KpiCard
          title="OTs cerradas"
          value={cerradas}
          icon={<CheckCircle size={28} />}
        />

        <KpiCard
          title="Tiempo promedio por OT"
          value={`${tiempoPromedioHoras} h`}
          icon={<Clock size={28} />}
        />

        <KpiCard
          title="Órdenes hoy"
          value={ordenesHoy}
          icon={<Calendar size={28} />}
        />

        <KpiCard
          title="Órdenes este mes"
          value={ordenesMes}
          icon={<CalendarDays size={28} />}
        />
      </div>

      {/* ===== CITAS DEL TÉCNICO ===== */}
      <div
        style={{
          marginTop: "1.25rem",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "0.8rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
              Citas del técnico
            </h2>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.15rem" }}>
              Técnico: <b>{userCedula}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={() => setCitasView("PENDIENTES")}
                style={{
                  border: "1px solid #e5e7eb",
                  background:
                    citasView === "PENDIENTES"
                      ? "linear-gradient(90deg,#111827,#1f2937)"
                      : "#fff",
                  color:
                    citasView === "PENDIENTES"
                      ? "#fff"
                      : "#111827",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Pendientes
              </button>

              <button
                onClick={() => setCitasView("COMPLETADAS")}
                style={{
                  border: "1px solid #e5e7eb",
                  background:
                    citasView === "COMPLETADAS"
                      ? "linear-gradient(90deg,#16a34a,#22c55e)"
                      : "#fff",
                  color:
                    citasView === "COMPLETADAS"
                      ? "#fff"
                      : "#111827",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Completadas
              </button>
            </div>

            <button
              onClick={onGoCitas}
              style={{
                background: "linear-gradient(90deg,#6366f1,#4f46e5)",
                borderRadius: "999px",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "0.45rem 0.9rem",
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              Ver módulo completo
            </button>
          </div>
        </div>

        {citasLoading && (
          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Cargando citas…</div>
        )}

        {citasError && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "#b91c1c",
              backgroundColor: "#fee2e2",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              border: "1px solid #fecaca",
              marginBottom: "0.75rem",
            }}
          >
            {citasError}
          </div>
        )}

        {citasActionError && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "#b91c1c",
              backgroundColor: "#fee2e2",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              border: "1px solid #fecaca",
              marginBottom: "0.75rem",
            }}
          >
            {citasActionError}
          </div>
        )}

        {!citasLoading && !citasError && (
          <>
            {hoy.length === 0 && manana.length === 0 ? (
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                {citasView === "PENDIENTES"
                  ? "No hay citas pendientes para hoy o mañana."
                  : "No hay citas completadas para hoy o mañana."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* HOY */}
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Hoy ({hoy.length})
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {hoy.slice(0, 8).map((c, idx) => {
                      const estado = (c.estado ?? "").toUpperCase();
                      const isDone = estado === "COMPLETADA" || estado === "COMPLETADO";
                      const isUpdating = updatingCitaId === c.id;

                      return (
                        <div
                          key={String(c.id ?? `hoy-${idx}`)}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            padding: "0.75rem 0.85rem",
                            backgroundColor: "#f9fafb",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>
                              {getCitaTitle(c)}
                            </div>

                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.12rem 0.45rem",
                                borderRadius: "999px",
                                backgroundColor: isDone ? "#dcfce7" : "#e0e7ff",
                                color: isDone ? "#166534" : "#3730a3",
                                fontWeight: 800,
                                height: "fit-content",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.estado ?? "CITA"}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.78rem", color: "#374151" }}>
                            <b>Fecha:</b> {formatCitaDate(c)}
                          </div>

                          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                            {getCitaSubtitle(c)}
                          </div>

                          {citasView === "PENDIENTES" && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.35rem" }}>
                              <button
                                onClick={() => marcarCitaComoCompletada(c.id)}
                                disabled={!c.id || isDone || isUpdating}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  background: isDone
                                    ? "#f3f4f6"
                                    : "linear-gradient(90deg,#111827,#1f2937)",
                                  color: isDone ? "#6b7280" : "#ffffff",
                                  padding: "0.35rem 0.75rem",
                                  borderRadius: "10px",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  cursor: isDone ? "not-allowed" : "pointer",
                                  opacity: isUpdating ? 0.75 : 1,
                                }}
                                title={isDone ? "Ya está completada" : "Marcar como completada"}
                              >
                                {isUpdating ? "Actualizando..." : "Completada"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {hoy.length > 8 && (
                    <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#6b7280" }}>
                      Mostrando 8 de {hoy.length} citas de hoy.
                    </div>
                  )}
                </div>

                {/* MAÑANA */}
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Mañana ({manana.length})
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {manana.slice(0, 8).map((c, idx) => {
                      const estado = (c.estado ?? "").toUpperCase();
                      const isDone = estado === "COMPLETADA" || estado === "COMPLETADO";
                      const isUpdating = updatingCitaId === c.id;

                      return (
                        <div
                          key={String(c.id ?? `manana-${idx}`)}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            padding: "0.75rem 0.85rem",
                            backgroundColor: "#f9fafb",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>
                              {getCitaTitle(c)}
                            </div>

                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.12rem 0.45rem",
                                borderRadius: "999px",
                                backgroundColor: isDone ? "#dcfce7" : "#e0e7ff",
                                color: isDone ? "#166534" : "#3730a3",
                                fontWeight: 800,
                                height: "fit-content",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.estado ?? "CITA"}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.78rem", color: "#374151" }}>
                            <b>Fecha:</b> {formatCitaDate(c)}
                          </div>

                          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                            {getCitaSubtitle(c)}
                          </div>

                          {citasView === "PENDIENTES" && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.35rem" }}>
                              <button
                                onClick={() => marcarCitaComoCompletada(c.id)}
                                disabled={!c.id || isDone || isUpdating}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  background: isDone
                                    ? "#f3f4f6"
                                    : "linear-gradient(90deg,#111827,#1f2937)",
                                  color: isDone ? "#6b7280" : "#ffffff",
                                  padding: "0.35rem 0.75rem",
                                  borderRadius: "10px",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  cursor: isDone ? "not-allowed" : "pointer",
                                  opacity: isUpdating ? 0.75 : 1,
                                }}
                                title={isDone ? "Ya está completada" : "Marcar como completada"}
                              >
                                {isUpdating ? "Actualizando..." : "Completada"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {manana.length > 8 && (
                    <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#6b7280" }}>
                      Mostrando 8 de {manana.length} citas de mañana.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}