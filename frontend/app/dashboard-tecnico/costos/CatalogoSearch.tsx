"use client";

import { useEffect, useState } from "react";
import { catalogoService } from "@/services/catalogoService";
import { CatalogoItemUI } from "./types";

interface Props {
  onAdd: (item: CatalogoItemUI) => void;
}

export default function CatalogoSearch({ onAdd }: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CatalogoItemUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const data = await catalogoService.listar(search);
        let filtered = data;
        if (tipoFiltro !== "todos") {
          filtered = data.filter((i) => i.tipo === tipoFiltro.toUpperCase());
        }
        setItems(
          filtered.map((i) => ({
            id: i.id,
            descripcion: i.descripcion,
            tipo: i.tipo,
            costo: i.costo,
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [search, tipoFiltro]);

  return (
    <div className="border rounded-md p-4 bg-white">

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Buscar producto o servicio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-2 py-2"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="producto">Producto</option>
          <option value="servicio">Servicio</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      <ul
        className="space-y-2 max-h-80 overflow-y-auto"
        style={{ minHeight: items.length > 0 ? '3.5rem' : undefined }}
      >
        {items.slice(0, 6).map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center border rounded px-3 py-2"
          >
            <div>
              <div className="font-medium">{item.descripcion}</div>
              <div className="text-xs text-gray-500">
                {item.tipo} — ${item.costo.toFixed(2)}
              </div>
            </div>
            <button
              className="px-3 py-1 bg-indigo-600 text-white rounded"
              onClick={() => onAdd(item)}
            >
              +
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
