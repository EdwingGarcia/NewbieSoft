"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface Props {
    otId: number;
    open: boolean;
    onClose: () => void;
}

export default function ModalNotificacion({ otId, open, onClose }: Props) {
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const enviar = async () => {
        if (!mensaje.trim()) return;
        setLoading(true);

        try {
            const resp = await fetch(`http://localhost:8080/api/notificaciones/ot/${otId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    mensaje,
                    tecnicoNombre: localStorage.getItem("nombreUsuario") || "Técnico",
                }),
            });

            if (resp.ok) {
                alert("Enviado correctamente ✔️");
                onClose();
            } else {
                alert("Error al enviar");
            }
        } catch (e) {
            alert("Servidor no disponible");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-xl animate-fade-in">
                <h2 className="text-xl font-semibold mb-3">Enviar notificación</h2>

                <textarea
                    className="w-full border rounded p-2"
                    rows={4}
                    placeholder="Escribe el mensaje…"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                />

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded hover:bg-gray-100"
                    >
                        Cancelar
                    </button>

                    <button
                        disabled={loading}
                        onClick={enviar}
                        className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 disabled:bg-blue-300"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" /> Enviar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
