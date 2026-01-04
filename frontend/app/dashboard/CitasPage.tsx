'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
// Importamos el Modal que creamos anteriormente
import AgendarCitaModal from './AgendarCitaModal';

// Definición de la interfaz basada en tu Backend
interface CitaAdmin {
    id: number;
    usuario: {
        cedula: string;
        nombre: string;
        apellido: string;
        email: string;
        telefono?: string;
    };
    fechaProgramada: string;
    motivo: string;
    estado: string; // PENDIENTE, CONFIRMADA, FINALIZADA, CANCELADA
    fechaCreacion: string;
}

export default function CitasPage() {
    const [citas, setCitas] = useState<CitaAdmin[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    // --- 1. CARGA DE DATOS ---
    const fetchCitas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Ajusta la URL si tu puerto es diferente
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/citas/todas`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // Ordenar por fecha descendente (la más reciente primero)
                const sorted = data.sort((a: CitaAdmin, b: CitaAdmin) =>
                    new Date(b.fechaProgramada).getTime() - new Date(a.fechaProgramada).getTime()
                );
                setCitas(sorted);
            } else {
                console.error("Error al obtener citas");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitas();
    }, []);

    // --- 2. LÓGICA DE FILTRADO ---
    const citasFiltradas = useMemo(() => {
        return citas.filter(cita => {
            const termino = busqueda.toLowerCase();
            const matchTexto =
                cita.usuario.nombre.toLowerCase().includes(termino) ||
                cita.usuario.apellido.toLowerCase().includes(termino) ||
                cita.usuario.cedula.includes(termino);

            const matchEstado = filtroEstado === 'TODOS' || cita.estado === filtroEstado;

            return matchTexto && matchEstado;
        });
    }, [citas, busqueda, filtroEstado]);

    // --- 3. ACTUALIZACIÓN DE ESTADO ---
    const handleActualizarEstado = async (id: number, nuevoEstado: string) => {
        // Optimismo UI: Actualizamos la vista inmediatamente
        setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));

        try {
            const token = localStorage.getItem('token');
            // NOTA: Asegúrate de crear este endpoint en tu backend si no existe, 
            // o usa repo.save() en un controller nuevo.
            /* await fetch(`http://localhost:8080/api/citas/${id}/estado`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            */
            console.log(`Cita ${id} actualizada a ${nuevoEstado} (Simulado en frontend)`);
        } catch (error) {
            console.error("Error actualizando estado", error);
            fetchCitas(); // Revertir cambios si falla
        }
    };

    // Helper para colores de estado
    const getBadgeColor = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CONFIRMADA': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'FINALIZADA': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELADA': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 p-2">
            {/* Header y Filtros */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Citas</h2>
                    <p className="text-sm text-gray-500">Administra y programa las solicitudes de soporte.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
                    {/* Botón Modal para Crear Cita Manualmente */}
                    <AgendarCitaModal onCitaCreated={fetchCitas} />

                    {/* Buscador */}
                    <Input
                        placeholder="Buscar por nombre o cédula..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full sm:w-64"
                    />

                    {/* Filtro Dropdown */}
                    <Select onValueChange={setFiltroEstado} defaultValue="TODOS">
                        <SelectTrigger className="w-full sm:w-40 text-black border-gray-300">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                            <SelectItem value="TODOS">Todos</SelectItem>
                            <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                            <SelectItem value="CONFIRMADA">Confirmadas</SelectItem>
                            <SelectItem value="FINALIZADA">Finalizadas</SelectItem>
                            <SelectItem value="CANCELADA">Canceladas</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Botón Recargar */}
                    <Button onClick={fetchCitas} variant="outline" title="Recargar lista">
                        ↻
                    </Button>
                </div>
            </div>

            {/* Grid de Citas */}
            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">Cargando citas...</p>
                </div>
            ) : citasFiltradas.length === 0 ? (
                <Card className="border-dashed border-2 bg-gray-50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="text-4xl mb-4">📅</span>
                        <h3 className="text-lg font-medium text-gray-900">No se encontraron citas</h3>
                        <p className="text-gray-500">No hay citas que coincidan con tus filtros.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {citasFiltradas.map((cita) => (
                        <Card key={cita.id} className="flex flex-col hover:shadow-md transition-shadow border-t-4 border-t-blue-600">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase">Programada para</p>
                                        <p className="text-lg font-bold text-gray-800 capitalize">
                                            {new Date(cita.fechaProgramada).toLocaleDateString('es-ES', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <Badge className={`border ${getBadgeColor(cita.estado)}`}>
                                        {cita.estado}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4 pb-4">
                                <div className="bg-gray-50 p-3 rounded-md space-y-1 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-400 uppercase">Datos del Cliente</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {cita.usuario.nombre} {cita.usuario.apellido}
                                    </p>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                            🆔 <span>{cita.usuario.cedula}</span>
                                        </p>
                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                            📧 <span className="truncate">{cita.usuario.email}</span>
                                        </p>
                                        {cita.usuario.telefono && (
                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                📞 <span>{cita.usuario.telefono}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Motivo del Soporte</p>
                                    <p className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3 line-clamp-3">
                                        "{cita.motivo}"
                                    </p>
                                </div>
                            </CardContent>

                            {/* FOOTER CON BOTONES CORREGIDOS */}
                            <CardFooter className="pt-3 pb-3 border-t bg-gray-50">
                                {cita.estado === 'PENDIENTE' && (
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-none text-xs sm:text-sm"
                                            onClick={() => handleActualizarEstado(cita.id, 'CANCELADA')}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs sm:text-sm"
                                            onClick={() => handleActualizarEstado(cita.id, 'CONFIRMADA')}
                                        >
                                            Confirmar
                                        </Button>
                                    </div>
                                )}

                                {cita.estado === 'CONFIRMADA' && (
                                    <Button
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                        onClick={() => handleActualizarEstado(cita.id, 'FINALIZADA')}
                                    >
                                        Marcar como Finalizada
                                    </Button>
                                )}

                                {(cita.estado === 'FINALIZADA' || cita.estado === 'CANCELADA') && (
                                    <div className="w-full text-center">
                                        <p className="text-xs text-gray-400">
                                            Ticket cerrado
                                        </p>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}