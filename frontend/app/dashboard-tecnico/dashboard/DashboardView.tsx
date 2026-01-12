"use client";

import { useEffect } from "react";
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

export default function DashboardView() {
    const {
    totalAsignadas,
    abiertas,
    cerradas,
    tiempoPromedioHoras,
    ordenesHoy,
    ordenesMes,
    cargarDatos,
    } = useDashboard();


  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div>
        <h1>Resumen del técnico</h1>

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


    </div>
  );
}
