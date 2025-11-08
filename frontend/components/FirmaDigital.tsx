"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  width?: number;
  height?: number;
  className?: string;
  onSave?: (dataUrl: string) => void; // "data:image/png;base64,..."
  lineWidth?: number;
};

export default function FirmaDigital({
  width = 600,
  height = 200,
  className = "",
  onSave,
  lineWidth = 2,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    const start = (x: number, y: number) => {
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (x: number, y: number) => {
      if (!drawing.current) return;
      ctx.lineTo(x, y);
      ctx.stroke();
      setIsEmpty(false);
    };

    const end = () => { drawing.current = false; ctx.closePath(); };

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e instanceof TouchEvent) {
        const t = e.touches[0] || e.changedTouches[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      } else {
        const m = e as MouseEvent;
        return { x: m.clientX - rect.left, y: m.clientY - rect.top };
      }
    };

    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); const { x, y } = getPos(e); start(x, y); };
    const onMouseMove = (e: MouseEvent) => { e.preventDefault(); const { x, y } = getPos(e); draw(x, y); };
    const onMouseUp   = (e: MouseEvent) => { e.preventDefault(); end(); };

    const onTouchStart = (e: TouchEvent) => { const { x, y } = getPos(e); start(x, y); };
    const onTouchMove  = (e: TouchEvent) => { const { x, y } = getPos(e); draw(x, y); };
    const onTouchEnd   = () => end();

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [width, height, lineWidth]);

  const handleClear = () => {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (!onSave) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="border-2 border-dashed rounded-2xl p-2 bg-white">
        <canvas ref={canvasRef} className="w-full h-auto touch-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleClear} className="px-4 py-2 rounded-xl shadow border">
          Limpiar
        </button>
        <button onClick={handleSave} className="px-4 py-2 rounded-xl shadow border" disabled={isEmpty}>
          Usar firma
        </button>
      </div>
      {isEmpty && <p className="text-sm opacity-70">Dibuja tu firma en el recuadro.</p>}
    </div>
  );
}
