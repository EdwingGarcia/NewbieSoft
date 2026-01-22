import { ItemCosto } from "./types";

export const calcularSubtotal = (items: ItemCosto[]): number =>
  items.reduce((acc, i) => acc + i.cantidad * i.costoUnitario, 0);

export const calcularIVA = (subtotal: number): number =>
  +(subtotal * 0.15).toFixed(2);

export const calcularTotal = (subtotal: number, iva: number): number =>
  +(subtotal + iva).toFixed(2);
