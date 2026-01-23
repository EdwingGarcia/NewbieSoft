export type TipoCatalogo = "PRODUCTO" | "SERVICIO";

/**
 * Ítem de costo YA ADAPTADO PARA UI
 * (no es el modelo backend)
 */
export interface ItemCosto {
  id: number;              // id del costo en la OT
  ordenId: number;
  catalogoItemId: number;

  descripcion: string;
  tipo: TipoCatalogo;

  cantidad: number;
  costoUnitario: number;
  total: number;
}

/**
 * Ítem del catálogo para búsqueda
 */
export interface CatalogoItemUI {
  id: number;
  descripcion: string;
  tipo: TipoCatalogo;
  costo: number;
}
