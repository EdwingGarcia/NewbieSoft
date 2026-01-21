import { API_BASE_URL } from "@/app/lib/api";

/* =========================
   Tipos
========================= */

export type TipoCatalogo = "PRODUCTO" | "SERVICIO";

export interface CostoOrdenItem {
  id: number;
  catalogoItemId: number;
  descripcion: string;
  tipo: TipoCatalogo;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

/* =========================
   Configuración base
========================= */

const BASE_URL = `${API_BASE_URL}/api/ordenes`;

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/* =========================
   Servicio de Costos
========================= */

export const costosService = {
 agregar: async (
  ordenId: number,
  catalogoItemId: number,
  cantidad: number
) => {
  const res = await fetch(
    `${API_BASE_URL}/api/ordenes/${ordenId}/costos`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        catalogoItemId,
        cantidad: Number(cantidad),
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text(); // 👈 DEBUG
    console.error("Backend error:", errorText);
    throw new Error("Error al agregar costo a la orden");
  }
},


  listarPorOrden: async (ordenId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/api/ordenes/${ordenId}/costos`,
      { headers: authHeaders() }
    );

    if (!res.ok) {
      throw new Error("Error al listar costos");
    }

    return res.json();
  },

  eliminar: async (ordenId: number, costoId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/api/ordenes/${ordenId}/costos/${costoId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error("Error al eliminar costo");
    }
  },

  actualizarCantidad: async (costoId: number, cantidad: number) => {
    const res = await fetch(
      `${API_BASE_URL}/api/ordenes/0/costos/${costoId}/cantidad`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ cantidad }),
      }
    );

    if (!res.ok) {
      throw new Error("Error al actualizar cantidad");
    }
  },
};
