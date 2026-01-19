import { Suspense } from "react";
import FirmaClient from "./FirmaClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-lg">Cargando...</div>}>
      <FirmaClient />
    </Suspense>
  );
}
