'use client';

import { useState } from 'react';
// CORRECCIÓN: Eliminamos DialogFooter de los imports para evitar el error
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface Props {
    onCitaCreated: () => void;
}

export default function AgendarCitaModal({ onCitaCreated }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [cedula, setCedula] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!cedula || !fecha || !hora || !motivo) {
            setError('Todos los campos son obligatorios');
            setLoading(false);
            return;
        }

        const fechaHoraInicio = `${fecha}T${hora}:00`;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/citas/agendar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    usuarioId: cedula,
                    fechaHoraInicio: fechaHoraInicio,
                    motivo: motivo
                })
            });

            if (response.ok) {
                setOpen(false);
                limpiarFormulario();
                onCitaCreated();
            } else {
                const txt = await response.text();
                try {
                    const errJson = JSON.parse(txt);
                    setError(errJson.message || 'Error al guardar la cita');
                } catch {
                    setError('Error: Verifique que la cédula del cliente exista.');
                }
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const limpiarFormulario = () => {
        setCedula('');
        setFecha('');
        setHora('');
        setMotivo('');
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    + Nueva Cita
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white text-black">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">Agendar Nueva Cita</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cédula del Cliente</label>
                        <Input
                            placeholder="Ej: 1723456789"
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            maxLength={10}
                            className="text-black"
                        />
                        <p className="text-xs text-gray-500">El cliente debe estar registrado previamente.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Fecha</label>
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hora</label>
                            <Input
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                                className="text-black"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Motivo de la visita</label>
                        <Textarea
                            placeholder="Describa el problema del equipo..."
                            className="min-h-[100px] text-black"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                    </div>

                    {/* CORRECCIÓN: Usamos un div normal en lugar de DialogFooter */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                            {loading ? 'Guardando...' : 'Confirmar Agendamiento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}