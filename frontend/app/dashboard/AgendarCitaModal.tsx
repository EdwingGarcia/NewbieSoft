'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Search, Check, Calendar, Loader2, User, ChevronDown, Wrench } from 'lucide-react';

// --- INTERFACES ---
interface Rol {
    id: number;
    nombre: string;
}

interface Usuario {
    cedula: string;
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    rol?: Rol;
}

interface Props {
    onCitaCreated: () => void;
}

export default function AgendarCitaModal({ onCitaCreated }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados del formulario
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');

    // --- LOGICA DE CLIENTES ---
    const [listaClientes, setListaClientes] = useState<Usuario[]>([]);
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Usuario | null>(null);
    const [showDropCliente, setShowDropCliente] = useState(false);

    // --- LOGICA DE TÉCNICOS ---
    const [listaTecnicos, setListaTecnicos] = useState<Usuario[]>([]);
    const [busquedaTecnico, setBusquedaTecnico] = useState("");
    const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<Usuario | null>(null);
    const [showDropTecnico, setShowDropTecnico] = useState(false);

    const [loadingData, setLoadingData] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // 1. Cargar Usuarios
    useEffect(() => {
        if (open) {
            const fetchCombos = async () => {
                setLoadingData(true);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;

                    const resUsers = await fetch("http://localhost:8080/api/usuarios", {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (resUsers.ok) {
                        const usuarios: Usuario[] = await resUsers.json();
                        setListaClientes(usuarios.filter(u => u.rol?.nombre === "ROLE_CLIENTE"));
                        setListaTecnicos(usuarios.filter(u => u.rol?.nombre === "ROLE_TECNICO" || u.rol?.nombre === "ROLE_ADMIN"));
                    }
                } catch (err) {
                    console.error("Error cargando usuarios:", err);
                    setError("No se pudo cargar la lista de usuarios.");
                } finally {
                    setLoadingData(false);
                }
            };
            fetchCombos();
        } else {
            limpiarFormulario();
        }
    }, [open]);

    // 2. Filtros
    const filtrarUsuarios = (lista: Usuario[], busqueda: string) => {
        const termino = busqueda.toLowerCase();
        return lista.filter(u => {
            const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
            return nombreCompleto.includes(termino) || u.cedula.includes(termino);
        });
    };

    // 3. Cerrar dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropCliente(false);
                setShowDropTecnico(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // 4. Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!clienteSeleccionado || !fecha || !hora || !motivo) {
            setError('Todos los campos son obligatorios.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Formato ISO: YYYY-MM-DDTHH:MM:SS
            const fechaHoraInicio = `${fecha}T${hora}:00`;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/citas/agendar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    // --- MAPPING SEGÚN TU DTO JAVA ---
                    usuarioId: clienteSeleccionado.cedula,
                    fechaHoraInicio: fechaHoraInicio, // <--- CAMBIO CLAVE AQUÍ
                    motivo: motivo,

                    // OJO: Si tu DTO Java 'CitaRequest' NO tiene tecnicoId, esto será ignorado por el backend
                    // Asegúrate de agregar 'private String tecnicoId;' en tu clase Java.
                    tecnicoId: tecnicoSeleccionado ? tecnicoSeleccionado.cedula : null
                })
            });

            if (response.ok) {
                setOpen(false);
                onCitaCreated();
            } else {
                const txt = await response.text();
                console.error("Error del servidor:", txt);
                setError('Error al agendar. Verifique los datos.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const limpiarFormulario = () => {
        setFecha(''); setHora(''); setMotivo('');
        setBusquedaCliente(''); setClienteSeleccionado(null);
        setBusquedaTecnico(''); setTecnicoSeleccionado(null);
        setError(null);
    };

    // Renderizador de Items
    const renderDropdownItem = (u: Usuario, onSelect: (u: Usuario) => void) => (
        <div
            key={u.cedula}
            onClick={() => onSelect(u)}
            className="px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors"
        >
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                    {u.nombre} {u.apellido || ''}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={10} /> {u.email}
                </span>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                {u.cedula}
            </span>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-sm transition-all"
                    style={{ borderRadius: "0px", fontWeight: 600 }}
                >
                    <Calendar className="mr-2 h-4 w-4" /> Nueva Cita
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] bg-white text-slate-900 border border-slate-200 shadow-2xl p-0 gap-0" style={{ borderRadius: "0px" }}>

                <DialogHeader className="bg-slate-50 p-6 border-b border-slate-100">
                    <DialogTitle className="text-slate-800 text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                        Agendar Servicio Técnico
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5" ref={wrapperRef}>

                    {error && (
                        <Alert variant="destructive" className="bg-red-50 border border-red-200 text-red-700 rounded-none">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">

                        {/* 1. COMBOBOX CLIENTE */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <User size={12} /> Cliente *
                            </label>
                            <div className={`relative flex items-center border bg-white transition-all ${showDropCliente ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300'}`} style={{ borderRadius: "0px" }}>
                                <Search className="absolute left-3 text-slate-400 h-4 w-4 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder={loadingData ? "Cargando..." : "Buscar cliente..."}
                                    value={busquedaCliente}
                                    onChange={(e) => {
                                        setBusquedaCliente(e.target.value);
                                        setShowDropCliente(true);
                                        setShowDropTecnico(false);
                                        if (e.target.value === "") setClienteSeleccionado(null);
                                    }}
                                    onFocus={() => { setShowDropCliente(true); setShowDropTecnico(false); }}
                                    className="w-full pl-10 pr-8 py-2.5 text-sm outline-none bg-transparent text-slate-900"
                                />
                                <div className="absolute right-3 pointer-events-none">
                                    {clienteSeleccionado ? <Check className="h-4 w-4 text-emerald-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                </div>
                            </div>
                            {showDropCliente && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 border-t-0 shadow-lg max-h-[180px] overflow-y-auto z-50 mt-1">
                                    {filtrarUsuarios(listaClientes, busquedaCliente).length > 0 ?
                                        filtrarUsuarios(listaClientes, busquedaCliente).map(u => renderDropdownItem(u, (sel) => {
                                            setClienteSeleccionado(sel);
                                            setBusquedaCliente(`${sel.nombre} ${sel.apellido || ''} - ${sel.cedula}`);
                                            setShowDropCliente(false);
                                        }))
                                        : <div className="p-4 text-center text-xs text-slate-500">Sin resultados</div>}
                                </div>
                            )}
                        </div>

                        {/* 2. COMBOBOX TÉCNICO */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Wrench size={12} /> Técnico Asignado (Opcional)
                            </label>
                            <div className={`relative flex items-center border bg-white transition-all ${showDropTecnico ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300'}`} style={{ borderRadius: "0px" }}>
                                <Search className="absolute left-3 text-slate-400 h-4 w-4 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder={loadingData ? "Cargando..." : "Buscar técnico..."}
                                    value={busquedaTecnico}
                                    onChange={(e) => {
                                        setBusquedaTecnico(e.target.value);
                                        setShowDropTecnico(true);
                                        setShowDropCliente(false);
                                        if (e.target.value === "") setTecnicoSeleccionado(null);
                                    }}
                                    onFocus={() => { setShowDropTecnico(true); setShowDropCliente(false); }}
                                    className="w-full pl-10 pr-8 py-2.5 text-sm outline-none bg-transparent text-slate-900"
                                />
                                <div className="absolute right-3 pointer-events-none">
                                    {tecnicoSeleccionado ? <Check className="h-4 w-4 text-emerald-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                </div>
                            </div>
                            {showDropTecnico && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 border-t-0 shadow-lg max-h-[180px] overflow-y-auto z-50 mt-1">
                                    {filtrarUsuarios(listaTecnicos, busquedaTecnico).length > 0 ?
                                        filtrarUsuarios(listaTecnicos, busquedaTecnico).map(u => renderDropdownItem(u, (sel) => {
                                            setTecnicoSeleccionado(sel);
                                            setBusquedaTecnico(`${sel.nombre} ${sel.apellido || ''} - ${sel.cedula}`);
                                            setShowDropTecnico(false);
                                        }))
                                        : <div className="p-4 text-center text-xs text-slate-500">Sin resultados</div>}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* FECHA Y HORA */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha *</label>
                            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={new Date().toISOString().split('T')[0]} className="rounded-none border-slate-300 focus:ring-0 focus:border-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hora *</label>
                            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded-none border-slate-300 focus:ring-0 focus:border-blue-500" />
                        </div>
                    </div>

                    {/* MOTIVO */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle del Servicio *</label>
                        <Textarea
                            placeholder="Describa el problema técnico..."
                            className="min-h-[100px] rounded-none border-slate-300 focus:ring-0 focus:border-blue-500 font-mono text-sm transition-colors"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button
                            type="submit"
                            disabled={loading || !clienteSeleccionado}
                            className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderRadius: "0px" }}
                        >
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Asignando...</> : 'Confirmar Asignación'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}