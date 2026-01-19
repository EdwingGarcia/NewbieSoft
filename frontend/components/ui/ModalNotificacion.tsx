"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ModalNotificacionProps {
    otId: number;
    onClose: () => void;
}

export default function ModalNotificacion({
    otId,
    onClose,
}: ModalNotificacionProps) {
    const [mensaje, setMensaje] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const enviarNotificacion = async (): Promise<void> => {
        if (!mensaje.trim()) return;

        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            const tecnicoNombre = localStorage.getItem("nombreUsuario") || "Técnico";

            const response = await fetch(
                `${API_BASE_URL}/api/notificaciones/ot/${otId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ mensaje, tecnicoNombre }),
                }
            );

            if (!response.ok) {
                alert("Error al enviar notificación");
                return;
            }

            alert("Correo enviado correctamente ✔️");
            onClose();
        } catch {
            alert("Fallo al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean): void => {
        if (!open) onClose();
    };

    return (
        <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar notificación</DialogTitle>
                </DialogHeader>

                <div className="mt-3">
                    <label className="text-sm font-medium">Mensaje al cliente:</label>
                    <Textarea
                        value={mensaje}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setMensaje(e.target.value)
                        }
                        placeholder="Escribe aquí el mensaje..."
                        className="mt-2"
                        rows={4}
                    />
                </div>

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
