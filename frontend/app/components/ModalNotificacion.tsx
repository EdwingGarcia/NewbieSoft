"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { fetchAPI } from "../lib/api"; // Importamos el helper centralizado

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
            // fetchAPI combina API_BASE_URL + el endpoint que le pases.
            await fetchAPI(`/api/notificaciones/ot/${otId}`, {
                method: "POST",
                headers: {
                    // Content-Type se agrega automáticamente en fetchAPI, solo pasamos Auth
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    mensaje,
                    tecnicoNombre: localStorage.getItem("nombreUsuario") || "Técnico",
                }),
            });

            // Si fetchAPI no lanza error, significa que la respuesta fue exitosa (resp.ok)
            alert("Enviado correctamente ✔️");
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error al enviar");
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