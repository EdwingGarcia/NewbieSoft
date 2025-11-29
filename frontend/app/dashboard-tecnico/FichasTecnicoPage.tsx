"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface FichaTecnicaDTO {
    id: number;
    equipoNombre: string;
    fechaCreacion: string;
    tecnicoId: string;
}

export default function FichasTecnicoPage() {
    const [fichas, setFichas] = useState<FichaTecnicaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const raw = localStorage.getItem("nb.auth");

        if (!token || !raw) {
            window.location.href = "/";
            return;
        }

        const auth = JSON.parse(raw);
        const cedula = auth.cedula;

        const cargar = async () => {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/fichas/tecnico/${cedula}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (res.status === 204) {
                    setFichas([]);
                    setLoading(false);
                    return;
                }

                if (!res.ok) throw new Error(`Error ${res.status}`);

                const data = await res.json();
                setFichas(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        cargar();
    }, []);

    if (loading) return <p>Cargando fichas…</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">Mis Fichas Técnicas</h1>

            {fichas.length === 0 ? (
                <p>No tienes fichas técnicas registradas.</p>
            ) : (
                <table className="min-w-full bg-white border border-gray-300 rounded-md">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-2">ID</th>
                            <th className="p-2">Equipo</th>
                            <th className="p-2">Fecha</th>
                            <th className="p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fichas.map((f) => (
                            <tr key={f.id} className="border-b">
                                <td className="p-2 text-center">{f.id}</td>
                                <td className="p-2">{f.equipoNombre}</td>
                                <td className="p-2">
                                    {new Date(f.fechaCreacion).toLocaleString()}
                                </td>
                                <td className="p-2 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            window.location.href = `/dashboard-tecnico/ficha?id=${f.id}`
                                        }
                                    >
                                        Ver
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
