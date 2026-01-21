import CatalogoForm from "./CatalogoForm";
import { CatalogoItem } from "@/services/catalogoService";

interface Props {
  item: CatalogoItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CatalogoModal({ item, onClose, onSaved }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {item ? "Editar ítem" : "Nuevo ítem"}
        </h2>

        <CatalogoForm item={item} onSaved={onSaved} />

        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-gray-500">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
