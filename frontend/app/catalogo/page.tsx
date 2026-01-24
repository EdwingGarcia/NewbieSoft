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
    <div className="min-h-full h-full bg-gradient-to-br from-slate-50 to-purple-50/30 p-6 lg:p-8">
      <div className="h-full space-y-6">

        {/* === ENCABEZADO === */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-purple-100 bg-white px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-600" />
              Catálogo de Productos
            </h1>
            <p className="mt-1 text-sm text-purple-600 font-medium">
              Gestiona los productos y servicios disponibles en el sistema.
            </p>
          </div>

          <Button
            onClick={onNuevo}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25"
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo Ítem
          </Button>
        </div>

        {/* === BARRA DE FILTROS Y ACCIONES === */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-lg border border-purple-100 bg-white p-4 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 bg-purple-50/50 border-purple-200 focus-visible:ring-purple-400"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => cargarCatalogo()}
              disabled={loading}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={() => cargarCatalogo()} className="bg-purple-600 hover:bg-purple-700 text-white">
              Buscar
            </Button>
          </div>
        </div>

        {/* === TABLA DE DATOS === */}
        <div className="overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm flex-1">
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