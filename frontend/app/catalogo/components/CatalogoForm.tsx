import { useState } from "react";
import { catalogoService, CatalogoItem, TipoCatalogo } from "@/services/catalogoService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react"; // Asegúrate de tener lucide-react o usa un <span>$</span>

interface Props {
  item: CatalogoItem | null;
  onSaved: () => void;
}

export default function CatalogoForm({ item, onSaved }: Props) {
  const [tipo, setTipo] = useState<TipoCatalogo>(item?.tipo || "PRODUCTO");
  const [descripcion, setDescripcion] = useState(item?.descripcion || "");

  // Manejamos el costo como string temporalmente para permitir escribir "10." sin que se borre
  const [costo, setCosto] = useState<string | number>(item?.costo || "");

  const guardar = async () => {
    const costoFinal = Number(costo);

    if (!descripcion || costoFinal <= 0) {
      alert("Complete todos los campos correctamente");
      return;
    }

    const payload = {
      tipo,
      descripcion,
      costo: costoFinal,
    };

    try {
      if (item) {
        await catalogoService.actualizar(item.id, payload);
      } else {
        await catalogoService.crear(payload);
      }
      onSaved();
    } catch (error) {
      console.error("Error al guardar", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoCatalogo)}
          className="w-full border border-input bg-background p-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="PRODUCTO">Producto</option>
          <option value="SERVICIO">Servicio</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Descripción</label>
        <Input
          placeholder="Ej: Servicio Técnico"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Costo / Precio</label>
        <div className="relative">
          {/* Icono de moneda posicionado absolutamente */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
          </div>

          <Input
            type="number"
            placeholder="0.00"
            className="pl-9" // Padding a la izquierda para que el texto no pise el icono
            value={costo}
            min="0"
            step="0.01" // ¡IMPORTANTE! Esto permite escribir decimales cómodamente
            onChange={(e) => setCosto(e.target.value)}
            // Truco para evitar que el scroll del mouse cambie el número accidentalmente
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={guardar} className="w-full">
          {item ? "Actualizar Ítem" : "Crear Ítem"}
        </Button>
      </div>
    </div>
  );
}