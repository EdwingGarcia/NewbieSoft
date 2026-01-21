import { CatalogoItem } from "@/services/catalogoService";
import { Button } from "@/components/ui/button";

interface Props {
  items: CatalogoItem[];
  loading: boolean;
  onEditar: (item: CatalogoItem) => void;
  onEliminar: (id: number) => void;
}

export default function CatalogoTable({
  items,
  loading,
  onEditar,
  onEliminar,
}: Props) {
  if (loading) return <p>Cargando...</p>;

  if (items.length === 0) {
    return <p>No hay registros</p>;
  }

  return (
    <table className="w-full border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Tipo</th>
          <th className="p-2 text-left">Descripción</th>
          <th className="p-2 text-left">Costo</th>
          <th className="p-2 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t">
            <td className="p-2">{item.tipo}</td>
            <td className="p-2">{item.descripcion}</td>
            <td className="p-2">${item.costo.toFixed(2)}</td>
            <td className="p-2 text-center space-x-2">
              <Button variant="outline" onClick={() => onEditar(item)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => onEliminar(item.id)}>
                Eliminar
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
