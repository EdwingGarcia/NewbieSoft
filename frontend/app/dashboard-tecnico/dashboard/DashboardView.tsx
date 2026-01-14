"use client";

import { useEffect, useState } from "react";
import styles from "../../styles/Dashboard.module.css";
import KpiCard from "./KpiCard";
import { useDashboard } from "./useDashboard";

import {
  Wrench,
  CheckCircle,
  ClipboardList,
  Clock,
  Calendar,
  CalendarDays,
} from "lucide-react";

type Cita = {
  id: number;
  motivo?: string;
  fechaProgramada: string;
  usuario?: {
    nombre?: string;
  };
};

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

  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  /* ===== KPIs ===== */
  useEffect(() => {
    cargarDatos();
  }, []);

  /* ===== CITAS DEL DÍA ===== */
  useEffect(() => {
    const cargarCitasHoy = async () => {
      try {
        setLoadingCitas(true);

        const token = localStorage.getItem("token");
        const cedula = localStorage.getItem("cedula");

        if (!token || !cedula) return;

        const res = await fetch(
          `http://localhost:8080/api/citas/tecnico/${cedula}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const data: Cita[] = await res.json();
        const hoy = new Date().toDateString();

        const filtradas = data.filter((c) => {
          const fecha = new Date(c.fechaProgramada);
          return fecha.toDateString() === hoy;
        });

        setCitasHoy(filtradas);
      } catch (e) {
        console.error("Error cargando citas del día", e);
      } finally {
        setLoadingCitas(false);
      }
    };

    cargarCitasHoy();
  }, []);

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

      {/* ===== CITAS DEL DÍA ===== */}
      <div
        style={{
          marginTop: "2rem",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "1.5rem",
          boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Citas programadas para hoy
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Recordatorio de servicios asignados
            </p>
          </div>

          <span
           onClick={onGoCitas}
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#4f46e5",
              cursor: "pointer",
            }}
          >
            Ver todas mis citas →
          </span>
        </div>

        {loadingCitas ? (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Cargando citas…
          </p>
        ) : citasHoy.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            No tienes citas programadas para hoy.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {citasHoy.map((cita) => (
              <div
                key={cita.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "1rem",
                  background: "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <strong style={{ fontSize: "0.95rem" }}>
                  {cita.motivo || "Cita técnica"}
                </strong>

                <span style={{ fontSize: "0.8rem", color: "#374151" }}>
                  🕒{" "}
                  {new Date(cita.fechaProgramada).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Cliente: {cita.usuario?.nombre ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
