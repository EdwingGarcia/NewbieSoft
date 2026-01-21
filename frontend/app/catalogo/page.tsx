"use client";

import { useEffect, useState } from "react";
import { catalogoService, CatalogoItem } from "@/services/catalogoService";
import CatalogoTable from "./components/CatalogoTable";
import CatalogoModal from "./components/CatalogoModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CatalogoPage() {
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [itemEdit, setItemEdit] = useState<CatalogoItem | null>(null);

  const cargarCatalogo = async () => {
    try {
      setLoading(true);
      const data = await catalogoService.listar(search);
      setItems(data);
    } catch (err) {
      alert("Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const onBuscar = () => {
    cargarCatalogo();
  };

  const onNuevo = () => {
    setItemEdit(null);
    setModalOpen(true);
  };

  const onEditar = (item: CatalogoItem) => {
    setItemEdit(item);
    setModalOpen(true);
  };

  const onEliminado = async (id: number) => {
    if (!confirm("¿Eliminar este ítem?")) return;
    await catalogoService.eliminar(id);
    cargarCatalogo();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Catálogo de Productos y Servicios</h1>

      {/* Barra superior */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Buscar por descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={onBuscar}>Buscar</Button>
        <Button onClick={onNuevo}>+ Nuevo</Button>
      </div>

      {/* Tabla */}
      <CatalogoTable
        items={items}
        loading={loading}
        onEditar={onEditar}
        onEliminar={onEliminado}
      />

      {/* Modal */}
      {modalOpen && (
        <CatalogoModal
          item={itemEdit}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            cargarCatalogo();
          }}
        />
      )}
    </div>
  );
}
