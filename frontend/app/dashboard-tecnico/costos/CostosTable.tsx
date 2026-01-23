"use client";

import { ItemCosto } from "./types";

type Props = {
  items: ItemCosto[];
  onChangeCantidad: (costoId: number, cantidad: number) => void;
  onRemove: (costoId: number) => void;
};

export default function CostosTable({
  items,
  onChangeCantidad,
  onRemove,
}: Props) {
  return (
    <div className="border rounded-md bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2">Item</th>
            <th className="text-center px-3 py-2 w-28">Cant.</th>
            <th className="text-right px-3 py-2 w-24">Unit.</th>
            <th className="text-right px-3 py-2 w-24">Total</th>
            <th className="text-center px-3 py-2 w-12"></th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const total =
              typeof item.total === "number"
                ? item.total
                : item.costoUnitario * item.cantidad;

            return (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">
                  <div className="font-medium">{item.descripcion}</div>
                  <div className="text-xs text-gray-500">{item.tipo}</div>
                </td>

                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    min={1}
                    className="w-20 border rounded px-2 py-1 text-center"
                    value={item.cantidad}
                    onChange={(e) =>
                      onChangeCantidad(item.id, Number(e.target.value))
                    }
                  />
                </td>

                <td className="px-3 py-2 text-right">
                  ${item.costoUnitario.toFixed(2)}
                </td>

                <td className="px-3 py-2 text-right font-semibold">
                  ${total.toFixed(2)}
                </td>

                {/* ✅ BOTÓN MENOS */}
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-red-600 hover:text-red-800 text-xl font-bold"
                    title="Eliminar"
                  >
                    −
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
