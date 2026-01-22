import { useState } from "react";
import { API_BASE_URL } from "../../lib/api";
type Orden = {
  estado: string;
  fechaHoraIngreso: string;
  fechaHoraEntrega?: string;
};

export function useDashboard() {
  const [totalAsignadas, setTotalAsignadas] = useState(0);
  const [abiertas, setAbiertas] = useState(0);
  const [cerradas, setCerradas] = useState(0);
  const [tiempoPromedioHoras, setTiempoPromedioHoras] = useState("0");
  const [ordenesHoy, setOrdenesHoy] = useState(0);
  const [ordenesMes, setOrdenesMes] = useState(0);


  const cargarDatos = async () => {
    const token = localStorage.getItem("token");


    const res = await fetch(
      `${API_BASE_URL}/api/ordenes/mis-ordenes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const ordenes: Orden[] = await res.json();

    setTotalAsignadas(ordenes.length);

    const abiertas = ordenes.filter(o => o.estado !== "CERRADO");
    const cerradas = ordenes.filter(o => o.estado === "CERRADO");
    const hoy = new Date();
    const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const ordenesHoy = ordenes.filter(o =>
      new Date(o.fechaHoraIngreso) >= inicioDia
    );

    const ordenesMes = ordenes.filter(o =>
      new Date(o.fechaHoraIngreso) >= inicioMes
    );

    setOrdenesHoy(ordenesHoy.length);
    setOrdenesMes(ordenesMes.length);

    setAbiertas(abiertas.length);
    setCerradas(cerradas.length);

    // ⏱️ Promedio en HORAS
    const tiempos = cerradas
      .filter(o => o.fechaHoraEntrega)
      .map(o => {
        const inicio = new Date(o.fechaHoraIngreso).getTime();
        const fin = new Date(o.fechaHoraEntrega!).getTime();
        return (fin - inicio) / (1000 * 60 * 60);
      });

    if (tiempos.length > 0) {
      const promedio =
        tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      setTiempoPromedioHoras(promedio.toFixed(1));
    } else {
      setTiempoPromedioHoras("0");
    }
  };

  return {
    totalAsignadas,
    abiertas,
    cerradas,
    tiempoPromedioHoras,
    ordenesHoy,
    ordenesMes,
    cargarDatos,
  };

}
