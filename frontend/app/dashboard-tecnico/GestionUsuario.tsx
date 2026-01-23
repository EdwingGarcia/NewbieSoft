"use client";

import { useEffect, useState, useCallback, useMemo, JSX } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    X,
    ShieldCheck,
    ShieldAlert,
    Users,
    Phone,
    Mail,
    FilterX,
    Lock,
    ChevronLeft,  // Importado
    ChevronRight  // Importado
} from "lucide-react";

// --- API CONFIG ---
import { API_BASE_URL } from "@/app/lib/api";

const API_BASE = `${API_BASE_URL}/api/usuarios`;
const ROLES_API = `${API_BASE_URL}/roles`;
const ITEMS_PER_PAGE = 8; // Cantidad de clientes por página

// --- INTERFACES ---
interface Rol {
    idRol: number;
    nombre: string;
    descripcion?: string;
}

interface Usuario {
    cedula: string;
    nombre?: string;
    correo?: string;
    telefono?: string;
    direccion?: string;
    password?: string;
    rol?: Rol;
    estado?: boolean;
}

// --- UTILS ---
const getInitials = (name?: string) => {
    if (!name) return "C";
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-10) + "Aa1";
};

// Estilo fijo para clientes (Emerald/Verde)
const theme = {
    avatarBg: "bg-emerald-100 text-emerald-700",
};

export default function GestionUsuario(): JSX.Element {
    // --- ESTADOS ---
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal
    const [showForm, setShowForm] = useState(false);

    // Form Fields (Solo creación)
    const [cedula, setCedula] = useState("");
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [estado, setEstado] = useState(true);

    // El rol ID se setea internamente
    const [selectedRolId, setSelectedRolId] = useState<number | "">("");

    // Validaciones
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Search & Pagination
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // --- API LOGIC ---
    const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const getAuthHeaders = (): HeadersInit => {
        const token = getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchUsuarios = useCallback(async () => {
        if (!getToken()) return;
        setLoading(true);
        try {
            const res = await fetch(API_BASE, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Error obteniendo usuarios");
            setUsuarios(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        if (!getToken()) return;
        try {
            const res = await fetch(ROLES_API, { headers: getAuthHeaders() });
            if (res.ok) setRoles(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
    }, [fetchUsuarios, fetchRoles]);

    // Resetear página al buscar
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // --- LOGICA ROL CLIENTE ---
    const clientRoleId = useMemo(() => {
        const role = roles.find(r => r.nombre.toUpperCase().includes("CLIENTE"));
        return role ? role.idRol : "";
    }, [roles]);

    // --- HANDLERS ---
    const openCreate = () => {
        setCedula(""); setNombre(""); setCorreo(""); setTelefono(""); setDireccion("");
        setEstado(true);
        setSelectedRolId(clientRoleId);
        setFormErrors({});
        setShowForm(true);
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!cedula.trim()) errors.cedula = "La cédula es obligatoria.";
        else if (!/^\d{10}$/.test(cedula)) errors.cedula = "Debe tener 10 dígitos numéricos.";

        if (!selectedRolId) errors.rol = "Error: No se pudo asignar el rol de Cliente automáticamente.";

        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errors.correo = "Correo inválido.";
        if (telefono && !/^\d{9,10}$/.test(telefono)) errors.telefono = "Numérico (9-10 dígitos).";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const saveUsuario = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const rolObj = roles.find((r) => r.idRol === Number(selectedRolId));

            const payload: any = {
                cedula, nombre, correo, telefono, direccion, estado,
                rol: rolObj ? { idRol: rolObj.idRol, nombre: rolObj.nombre } : null,
                password: generateRandomPassword()
            };

            const res = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() as Record<string, string> },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());
            await fetchUsuarios();
            setShowForm(false);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- FILTROS (SOLO CLIENTES) ---
    const filteredClients = useMemo(() => {
        let data = usuarios.filter(u => u.rol?.nombre.toUpperCase().includes("CLIENTE"));

        const term = search.toLowerCase();
        if (search) {
            data = data.filter(u =>
                u.cedula.toLowerCase().includes(term) ||
                u.nombre?.toLowerCase().includes(term) ||
                u.correo?.toLowerCase().includes(term)
            );
        }
        return data;
    }, [usuarios, search]);

    // --- PAGINACIÓN LOGIC ---
    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const stats = useMemo(() => ({
        total: filteredClients.length,
        active: filteredClients.filter(u => u.estado).length
    }), [filteredClients]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 p-4 lg:p-6 gap-6">

            {/* HEADER */}
            <div className="flex-none flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-emerald-600" />
                        Gestión de Clientes
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>Total: <b>{stats.total}</b></span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-emerald-600">Activos: <b>{stats.active}</b></span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar cliente..."
                            className="pl-9 bg-white shadow-sm border-slate-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shrink-0 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex-none bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                    <ShieldAlert className="h-4 w-4" /> {error}
                </div>
            )}

            {/* LISTA DE CLIENTES (GRID) */}
            <div className="flex-1 w-full flex flex-col">
                {loading && usuarios.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                        <FilterX className="h-10 w-10 mb-2 opacity-50" />
                        <p>No se encontraron clientes.</p>
                        {search && <Button variant="link" onClick={() => setSearch("")}>Limpiar búsqueda</Button>}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 content-start">
                            {currentClients.map((u) => (
                                <div
                                    key={u.cedula}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group flex flex-col gap-3 relative"
                                >
                                    {/* Cabecera Tarjeta */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${theme.avatarBg}`}>
                                                {getInitials(u.nombre)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-slate-900 text-sm truncate max-w-[160px]" title={u.nombre}>
                                                    {u.nombre || "Sin Nombre"}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 font-mono tracking-tight">{u.cedula}</p>
                                            </div>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${u.estado ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-slate-300"}`} title={u.estado ? "Activo" : "Inactivo"} />
                                    </div>

                                    {/* Datos Rápidos */}
                                    <div className="text-[11px] text-slate-500 space-y-1.5 pl-1 pt-1">
                                        {u.correo ? (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                                <span className="truncate" title={u.correo}>{u.correo}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 italic">
                                                <Mail className="h-3.5 w-3.5 opacity-50 shrink-0" />
                                                <span>Sin correo</span>
                                            </div>
                                        )}
                                        {u.telefono ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                                <span className="truncate">{u.telefono}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 italic">
                                                <Phone className="h-3.5 w-3.5 opacity-50 shrink-0" />
                                                <span>Sin teléfono</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dirección (si existe) */}
                                    {u.direccion && (
                                        <div className="pt-2 mt-auto border-t border-slate-50 text-[10px] text-slate-400 truncate">
                                            {u.direccion}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* --- PAGINACIÓN --- */}
                        {filteredClients.length > ITEMS_PER_PAGE && (
                            <div className="mt-6 flex items-center justify-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-slate-300"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-slate-500">
                                    Página <span className="font-semibold text-slate-900">{currentPage}</span> de{" "}
                                    <span className="font-semibold text-slate-900">{totalPages}</span>
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-slate-300"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== MODAL CREAR NUEVO CLIENTE ===== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex justify-between p-6 border-b border-slate-100 bg-emerald-50/50 rounded-t-xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Registrar Nuevo Cliente</h2>
                                <p className="text-sm text-slate-500">Complete la información básica del cliente.</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Aviso de Rol */}
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-xs text-blue-700">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Este usuario se registrará automáticamente con el rol <b>CLIENTE</b>.</span>
                            </div>

                            {/* ID */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Cédula *</label>
                                <Input
                                    value={cedula}
                                    onChange={e => setCedula(e.target.value)}
                                    className={`mt-1 ${formErrors.cedula ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                    placeholder="Ej: 1712345678"
                                />
                                {formErrors.cedula && <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.cedula}</p>}
                            </div>

                            {/* Personal */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nombre Completo</label>
                                <Input value={nombre} onChange={e => setNombre(e.target.value)} className="mt-1" placeholder="Nombre del cliente" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Correo</label>
                                    <Input
                                        type="email"
                                        value={correo}
                                        onChange={e => setCorreo(e.target.value)}
                                        className={`mt-1 ${formErrors.correo ? "border-red-500" : ""}`}
                                        placeholder="correo@ejemplo.com"
                                    />
                                    {formErrors.correo && <p className="text-[10px] text-red-500 mt-1">{formErrors.correo}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Teléfono</label>
                                    <Input
                                        value={telefono}
                                        onChange={e => setTelefono(e.target.value)}
                                        className={`mt-1 ${formErrors.telefono ? "border-red-500" : ""}`}
                                        placeholder="0999999999"
                                    />
                                    {formErrors.telefono && <p className="text-[10px] text-red-500 mt-1">{formErrors.telefono}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Dirección</label>
                                <Input value={direccion} onChange={e => setDireccion(e.target.value)} className="mt-1" placeholder="Dirección del cliente" />
                            </div>

                            {/* Estado y Seguridad */}
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="text-xs text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-3 w-3 text-emerald-600" />
                                        La contraseña se genera automáticamente.
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 justify-end md:justify-start">
                                    <div
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all ${estado ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                                        onClick={() => setEstado(!estado)}
                                    >
                                        <label className={`text-sm font-medium cursor-pointer ${estado ? "text-emerald-700" : "text-slate-600"}`}>
                                            {estado ? "Cuenta Activa" : "Cuenta Inactiva"}
                                        </label>
                                        <div className={`relative w-9 h-5 rounded-full transition-colors ${estado ? "bg-emerald-500" : "bg-slate-300"}`}>
                                            <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${estado ? "translate-x-4" : "translate-x-0"}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-b-xl flex justify-end gap-3 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button onClick={saveUsuario} disabled={loading} className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Crear Cliente
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}