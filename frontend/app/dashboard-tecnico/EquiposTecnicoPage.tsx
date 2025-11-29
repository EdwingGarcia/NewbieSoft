"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, FileUp, X } from "lucide-react";
import XmlUploader from "../dashboard/XmlUploader";

interface Equipo {
    id?: number;
    numeroSerie?: string;
    modelo?: string;
    marca?: string;
    cedulaCliente?: string;
    hardwareJson?: Record<string, any>;
}

const API_BASE = "http://localhost:8080/api/equipo";

export default function EquiposTecnicoPage(): JSX.Element {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<Equipo | null>(null);
    const [showXml, setShowXml] = useState(false);
    const [search, setSearch] = useState("");
    const [hardwareSearch, setHardwareSearch] = useState("");

    const getToken = (): string | null =>
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    /** 🔥 SOLO EQUIPOS DEL TÉCNICO */
    const fetchEquiposTecnico = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setError("Token no encontrado");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/mis-equipos`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok)
                throw new Error(`Error ${res.status} al obtener equipos del técnico`);

            const data: Equipo[] = await res.json();
            setEquipos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEquiposTecnico();
    }, [fetchEquiposTecnico]);

    const verDetalles = async (id: number) => {
        const token = getToken();
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("No se pudo cargar el detalle del equipo");

            const data = await res.json();
            setDetalle(data);
            setHardwareSearch("");
        } catch (e: any) {
            alert(e.message);
        }
    };

    const filteredEquipos = equipos.filter((eq) => {
        const term = search.toLowerCase();
        return (
            (eq.numeroSerie ?? "").toLowerCase().includes(term) ||
            (eq.modelo ?? "").toLowerCase().includes(term) ||
            (eq.marca ?? "").toLowerCase().includes(term) ||
            (eq.cedulaCliente ?? "").toLowerCase().includes(term)
        );
    });

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Mis Equipos 💻</h1>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Equipos asignados</CardTitle>
                            <CardDescription>
                                Solo los equipos registrados para este técnico.
                            </CardDescription>
                        </div>

                        <div className="relative w-64">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="pl-7"
                            />
                            <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredEquipos.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">
                            No tienes equipos asignados aún.
                        </p>
                    ) : (
                        <table className="w-full text-sm border rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Número Serie</th>
                                    <th className="px-4 py-2 text-left">Modelo</th>
                                    <th className="px-4 py-2 text-left">Marca</th>
                                    <th className="px-4 py-2 text-left">Cliente</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEquipos.map((eq) => (
                                    <tr
                                        key={eq.id}
                                        onClick={() => verDetalles(eq.id!)}
                                        className="hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="px-4 py-2">{eq.numeroSerie}</td>
                                        <td className="px-4 py-2">{eq.modelo}</td>
                                        <td className="px-4 py-2">{eq.marca}</td>
                                        <td className="px-4 py-2">{eq.cedulaCliente}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* --------------------------- Detalle Modal --------------------------- */}
            {detalle && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-[90vw] max-w-4xl p-6 relative">
                        <button
                            className="absolute right-4 top-3 text-gray-600"
                            onClick={() => setDetalle(null)}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-xl font-semibold mb-4">
                            Equipo #{detalle.id}
                        </h2>

                        <p><strong>Número Serie:</strong> {detalle.numeroSerie}</p>
                        <p><strong>Modelo:</strong> {detalle.modelo}</p>
                        <p><strong>Marca:</strong> {detalle.marca}</p>
                        <p><strong>Cédula Cliente:</strong> {detalle.cedulaCliente}</p>

                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={() => setShowXml(true)}
                            >
                                <FileUp className="h-4 w-4" />
                                Cargar XML
                            </Button>
                        </div>

                        {showXml && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg relative max-w-lg w-full">
                                    <button
                                        onClick={() => setShowXml(false)}
                                        className="absolute right-3 top-2 text-gray-600"
                                    >
                                        <X />
                                    </button>

                                    <XmlUploader equipoId={detalle.id!} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
