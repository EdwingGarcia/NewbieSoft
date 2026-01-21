import { useState } from "react";
import { catalogoService, CatalogoItem, TipoCatalogo } from "@/services/catalogoService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  item: CatalogoItem | null;
  onSaved: () => void;
}

export default function CatalogoForm({ item, onSaved }: Props) {
  const [tipo, setTipo] = useState<TipoCatalogo>(item?.tipo || "PRODUCTO");
  const [descripcion, setDescripcion] = useState(item?.descripcion || "");
  const [costo, setCosto] = useState(item?.costo || 0);

  const guardar = async () => {
    if (!descripcion || costo <= 0) {
      alert("Complete todos los campos");
      return;
    }

    if (item) {
      await catalogoService.actualizar(item.id, {
        tipo,
        descripcion,
        costo,
      });
    } else {
      await catalogoService.crear({
        tipo,
        descripcion,
        costo,
      });
    }

    onSaved();
  };

  return (
    <div className="space-y-4">
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoCatalogo)}
        className="w-full border p-2 rounded"
      >
        <option value="PRODUCTO">Producto</option>
        <option value="SERVICIO">Servicio</option>
      </select>

      <Input
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      <Input
        type="number"
        placeholder="Costo"
        value={costo}
        onChange={(e) => setCosto(Number(e.target.value))}
      />

      <Button onClick={guardar} className="w-full">
        Guardar
      </Button>
    </div>
  );
}
