"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus } from "lucide-react";

const API_BASE = "http://localhost:8080/api/equipo";

interface Props {
    onClose: () => void;
}

export default function EquipoForm({ onClose }: Props): JSX.Element {
    const [nombre, setNombre] = useState<string>("");
    const [descripcion, setDescripcion] = useState<string>("");
    const [clienteCedula, setClienteCedula] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const token: string | null =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const crearEquipo = useCallback(async () => {
        if (!token) {
            setError("Token no encontrado. Inicie sesión nuevamente.");
            return;
        }

        if (!nombre || !clienteCedula) {
            setError("Debe ingresar el nombre y la cédula del cliente");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // ✅ Token en header
                },
                body: JSON.stringify({ nombre, descripcion, clienteCedula }),
            });

            if (!res.ok) throw new Error(`Error ${res.status} al crear equipo`);

            alert("✅ Equipo creado correctamente");
            onClose();
        } catch (e: any) {
            setError(e.message || "Error creando equipo");
        } finally {
            setLoading(false);
        }
    }, [nombre, descripcion, clienteCedula, token, onClose]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" /> Nuevo Equipo
                    </CardTitle>
                    <CardDescription>
                        Completa los datos para registrar un nuevo equipo.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Input
                        placeholder="Nombre del equipo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                    <Input
                        placeholder="Descripción"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                    />
                    <Input
                        placeholder="Cédula del cliente"
                        value={clienteCedula}
                        onChange={(e) => setClienteCedula(e.target.value)}
                    />

                    <Button onClick={crearEquipo} disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        Crear equipo
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
