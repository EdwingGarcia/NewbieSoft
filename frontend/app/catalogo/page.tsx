"use client";

import { useEffect, useState } from "react";
import { catalogoService, CatalogoItem } from "@/services/catalogoService";
import CatalogoTable from "./components/CatalogoTable";
import CatalogoModal from "./components/CatalogoModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Package,
  RefreshCw
} from "lucide-react";

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
      // Podrías usar un Toast aquí en lugar de alert
      alert("Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  // Permitir buscar al presionar Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      cargarCatalogo();
    }
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
    if (!confirm("¿Estás seguro de eliminar este ítem?")) return;
    try {
      await catalogoService.eliminar(id);
      cargarCatalogo();
    } catch (error) {
      alert("No se pudo eliminar");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* === ENCABEZADO === */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-slate-600" />
              Catálogo de Productos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestiona los productos y servicios disponibles en el sistema.
            </p>
          </div>

          <Button
            onClick={onNuevo}
            className="bg-slate-900 hover:bg-slate-800 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo Ítem
          </Button>
        </div>

        {/* === BARRA DE FILTROS Y ACCIONES === */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => cargarCatalogo()}
              disabled={loading}
              className="border-slate-200 text-slate-600"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={() => cargarCatalogo()} variant="secondary">
              Buscar
            </Button>
          </div>
        </div>

        {/* === TABLA DE DATOS === */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Si tienes un estado de "Vacío" puedes manejarlo aquí */}
          {items.length === 0 && !loading ? (
            <div className="p-10 text-center text-slate-500">
              No se encontraron productos.
            </div>
          ) : (
            <CatalogoTable
              items={items}
              loading={loading}
              onEditar={onEditar}
              onEliminar={onEliminado}
            />
          )}
        </div>

        {/* === MODAL === */}
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
    </div>
  );
}