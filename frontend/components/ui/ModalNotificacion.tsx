"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "/components/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface ModalNotificacionProps {
    otId: number;
    onClose: () => void;
}

export default function ModalNotificacion({ otId, onClose }: ModalNotificacionProps) {
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

    const enviarNotificacion = async () => {
        if (!mensaje.trim()) return;

        try {
            setLoading(true);

            const response = await fetch(`http://localhost:8080/api/notificaciones/ot/${otId}`, {
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

            if (!response.ok) {
                alert("Error al enviar notificación");
            } else {
                alert("Correo enviado correctamente ✔️");
                onClose();
            }

        } catch (error) {
            alert("Fallo al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar notificación</DialogTitle>
                </DialogHeader>

                {/* TEXTAREA */}
                <div className="mt-3">
                    <label className="text-sm font-medium">Mensaje al cliente:</label>
                    <Textarea
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Escribe aquí el mensaje..."
                        className="mt-2"
                        rows={4}
                    />
                </div>

                {/* BOTON ENVIAR */}
                <div className="flex justify-end mt-4">
                    <Button
                        disabled={loading}
                        onClick={enviarNotificacion}
                        className="flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" /> Enviar
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
