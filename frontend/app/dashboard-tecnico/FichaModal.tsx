"use client";

import React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  widthClassName?: string; // ej: "max-w-6xl"
};

export default function FichaModal({
  open,
  title,
  children,
  onClose,
  widthClassName = "max-w-6xl",
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div
        className={`relative w-[95vw] ${widthClassName} max-h-[92vh] overflow-y-auto rounded-xl bg-white shadow-2xl`}
      >
        {/* Header modal estilo admin */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-5 py-4">
          <div>
            {title && (
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                {title}
              </h2>
            )}
            {!title && (
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                Detalle
              </h2>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
