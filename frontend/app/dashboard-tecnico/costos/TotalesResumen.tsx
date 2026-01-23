"use client";

import { ItemCosto } from "./types";
import {
  calcularSubtotal,
  calcularIVA,
  calcularTotal,
} from "./helpers";

type TotalesResumenProps = {
  items: ItemCosto[];
  ordenId: number;
  estado: string | null;
};

export default function TotalesResumen({
  items,
  ordenId,
  estado,
}: TotalesResumenProps) {
  const subtotal = calcularSubtotal(items);
  const iva = calcularIVA(subtotal);
  const total = calcularTotal(subtotal, iva);

  return (
    <div className="border rounded-md p-4 bg-white space-y-2">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span>IVA (15%)</span>
        <span>${iva.toFixed(2)}</span>
      </div>

      <div className="flex justify-between font-bold text-lg pt-2 border-t">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="pt-2 text-xs text-gray-500">
        Orden #{ordenId} — Estado: {estado ?? "—"}
      </div>
    </div>
  );
}
