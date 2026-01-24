"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";

type OrdenDetalle = {
    ordenId: number;
    numeroOrden?: string;
    clienteNombre?: string;
    equipoModelo?: string | null;
    equipoId?: number | string | null;
    problemaReportado?: string | null;
};

export default function FirmaClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const ordenId = searchParams.get("ordenId");
    const modo = searchParams.get("modo");

    const [orden, setOrden] = useState<OrdenDetalle | null>(null);
    const [loading, setLoading] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // ====== Configurar canvas ======
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
    }, []);

    // ====== Cargar orden ======
    useEffect(() => {
        if (!ordenId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("No tienes sesión iniciada.");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/ordenes/${ordenId}/detalle`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    if (res.status === 401) throw new Error("Sesión expirada o inválida");
                    throw new Error("No se pudo cargar la orden");
                }

                const data: OrdenDetalle = await res.json();
                setOrden(data);
            } catch (err: any) {
                console.error("ERROR CARGANDO ORDEN:", err);
                alert(err?.message ?? "Error cargando orden");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [ordenId]);

    // ====== Dibujo ======
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const limpiar = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // ====== Enviar firmas ======
    const handleSubmit = async () => {
        if (!orden) return;

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const firmaBase64 = canvas.toDataURL("image/png");

        const endpoint = modo === "recibo" ? "/api/firmas/recibo" : "/api/firmas/conformidad";

        const payload = {
            ordenId: orden.ordenId,
            numeroOrden: orden.numeroOrden,
            cliente: orden.clienteNombre,
            equipo: orden.equipoModelo ?? orden.equipoId,
            procedimiento: orden.problemaReportado,
            modo: modo,
            firma: firmaBase64,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${modo === "recibo" ? "Recibo" : "Conformidad"}_OT_${orden.ordenId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            alert("✅ Firma registrada y PDF generado correctamente");
            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            alert("❌ Error al procesar la firma. Revisa la consola.");
        }
    };

    // ====== UI ======
    if (loading) {
        return <div className="p-6 text-center text-lg">Cargando información...</div>;
    }

    if (!orden) {
        return (
            <div className="p-6 text-center text-red-600">
                No se pudo cargar la información de la orden o no tienes permisos.
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-6">
                {modo === "recibo" ? "Firma de Recibo Conforme" : "Confirmación de Procedimiento"}
            </h1>

            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">
                <p>
                    <b>Equipo:</b> {orden.equipoModelo ?? orden.equipoId ?? "-"}
                </p>
                <p>
                    <b>Procedimiento:</b> {orden.problemaReportado ?? "-"}
                </p>
                <p>
                    <b>Cliente:</b> {orden.clienteNombre ?? "-"}
                </p>

                <div className="mt-4">
                    <label className="block mb-2">
                        {modo === "recibo"
                            ? "Firma de recibo conforme (servicio entregado)"
                            : "¿Está de acuerdo con el procedimiento propuesto?"}
                    </label>
                </div>

                <div className="mt-4">
                    <p className="mb-2">
                        <b>Firma digital:</b>
                    </p>

                    <canvas
                        ref={canvasRef}
                        width={350}
                        height={150}
                        className="border border-gray-400 bg-white rounded-md shadow-sm mx-auto touch-none"
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
                    <button
                        onClick={limpiar}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        type="button"
                    >
                        Limpiar
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        type="button"
                    >
                        Finalizar y Enviar
                    </button>
                </div>
            </div>
        </div>
    );
}
