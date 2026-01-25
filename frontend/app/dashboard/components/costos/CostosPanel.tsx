"use client";

import { useEffect, useState } from "react";
import CatalogoSearch from "./CatalogoSearch";
import CostosTable from "./CostosTable";
import TotalesResumen from "./TotalesResumen";
import { costosService } from "@/services/costosService";
import { ItemCosto, CatalogoItemUI } from "./types";

type CostosPanelProps = {
  ordenId: number;
  estado: string | null;
};

export default function CostosPanel({ ordenId, estado }: CostosPanelProps) {
  const [items, setItems] = useState<ItemCosto[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     Cargar costos desde backend
  ========================= */
  const cargarCostos = async () => {
    setLoading(true);
    try {
      const data = await costosService.listarPorOrden(ordenId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCostos();
  }, [ordenId]);

  /* =========================
     Agregar item (desde catálogo)
     - Si existe → suma cantidad
     - Si no existe → crea fila
  ========================= */
  const handleAddItem = async (item: CatalogoItemUI) => {
    const existente = items.find(
      (i) =>
        i.descripcion === item.descripcion &&
        i.tipo === item.tipo
    );

    if (existente) {
      // 👉 ya existe → aumentar cantidad
      await costosService.actualizarCantidad(
        existente.id,
        existente.cantidad + 1
      );
    } else {
      // 👉 no existe → crear nuevo
      await costosService.agregar(
        ordenId,
        item.id,
        1
      );
    }

    await cargarCostos();
  };

  /* =========================
     Cambiar cantidad
  ========================= */
  const handleChangeCantidad = async (
    costoId: number,
    cantidad: number
  ) => {
    if (cantidad <= 0) return;

    await costosService.actualizarCantidad(costoId, cantidad);
    await cargarCostos();
  };

  /* =========================
     Eliminar item
  ========================= */
  const handleRemoveItem = async (costoId: number) => {
    await costosService.eliminar(ordenId, costoId);
    await cargarCostos();
  };

  /* =========================
     Render
  ========================= */
  return (
    <>
      <div className="mb-6">
        <CatalogoSearch onAdd={handleAddItem} />
      </div>
      <div className="space-y-6">
        <CostosTable
          items={items}
          onRemove={handleRemoveItem}
          onChangeCantidad={handleChangeCantidad}
        />
        <TotalesResumen
          items={items}
          ordenId={ordenId}
          estado={estado}
        />
        {loading && (
          <p className="text-sm text-gray-500">Actualizando costos…</p>
        )}
      </div>
    </>
  );
}
