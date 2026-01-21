import { API_BASE_URL } from "@/app/lib/api";

/* =========================
   Tipos (Contrato backend)
========================= */

export type TipoCatalogo = "PRODUCTO" | "SERVICIO";

export interface CatalogoItem {
  id: number;
  tipo: TipoCatalogo;
  descripcion: string;
  costo: number;
  activo: boolean;
}

/* =========================
   Configuración base
========================= */

const BASE_URL = `${API_BASE_URL}/api/catalogo`;

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
   Servicio de Catálogo
========================= */

export const catalogoService = {
  // 🔍 Listar / buscar
  listar: async (search?: string): Promise<CatalogoItem[]> => {
    const url = search
      ? `${BASE_URL}?search=${encodeURIComponent(search)}`
      : BASE_URL;

    const res = await fetch(url, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error("Error al obtener el catálogo");
    }

    return res.json();
  },

  // ➕ Crear
  crear: async (data: {
    tipo: TipoCatalogo;
    descripcion: string;
    costo: number;
  }): Promise<CatalogoItem> => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Error al crear ítem de catálogo");
    }

    return res.json();
  },

  // ✏️ Actualizar
  actualizar: async (
    id: number,
    data: Partial<Omit<CatalogoItem, "id">>
  ): Promise<CatalogoItem> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Error al actualizar ítem de catálogo");
    }

    return res.json();
  },

  // 🗑️ Eliminación lógica
  eliminar: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error("Error al eliminar ítem de catálogo");
    }
  },
};
