'use client';
import { useRef, useState, useEffect } from 'react';

export default function FirmaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [acuerdo, setAcuerdo] = useState(true);

  // Configurar el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");

     const payload = {
       cliente: "Juan Pérez",
       equipo: "Equipo de Soporte",
       procedimiento: "Instalación de software",
       firma: dataUrl // 👈 aquí debe ir el base64
     };

    try {
      const response = await fetch('http://localhost:8080/api/firmas/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Confirmacion.pdf';
      link.click();

      alert('✅ PDF generado y enviado correctamente.');
    } catch (err) {
      console.error(err);
      alert('❌ Error al procesar la firma.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Confirmación de Procedimiento</h1>
      <div className="bg-white shadow-md rounded-lg p-6 w-96 text-center">
        <p><b>Equipo:</b> Equipo de calibración XYZ</p>
        <p><b>Procedimiento:</b> Revisión y recalibración de sensores.</p>

        <div className="mt-4">
          <label className="block mb-2">¿Está de acuerdo con el procedimiento propuesto?</label>

        </div>

        <div className="mt-4">
          <p className="mb-2"><b>Firma del cliente:</b></p>
          <canvas
            ref={canvasRef}
            width={350}
            height={150}
            className="border border-gray-400 bg-white rounded-md shadow-sm mx-auto"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={limpiar} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Limpiar
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Finalizar y Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
