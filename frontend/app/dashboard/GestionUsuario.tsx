"use client";

import { useEffect, useState, useCallback, useMemo, JSX } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    ShieldCheck,
    ShieldAlert,
    Users,
    UserCog,
    Phone,
    Mail,
    LayoutGrid,
    FilterX,
    Lock
} from "lucide-react";

// --- API CONFIG ---
import { API_BASE_URL } from "@/app/lib/api";

const API_BASE = `${API_BASE_URL}/api/usuarios`;
const ROLES_API = `${API_BASE_URL}/roles`;

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
    if (!name) return "U";
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

// Estilos de Roles
const getRoleTheme = (roleName: string) => {
    const lower = roleName.toLowerCase();
    if (lower.includes("admin")) return {
        borderTop: "border-t-indigo-500",
        textTitle: "text-indigo-700",
        iconColor: "text-indigo-600",
        badge: "bg-indigo-100 text-indigo-800",
        avatarBg: "bg-indigo-100 text-indigo-700",
        bgColumn: "bg-indigo-50/30"
    };
    if (lower.includes("tecnico") || lower.includes("técnico")) return {
        borderTop: "border-t-blue-500",
        textTitle: "text-blue-700",
        iconColor: "text-blue-600",
        badge: "bg-blue-100 text-blue-800",
        avatarBg: "bg-blue-100 text-blue-700",
        bgColumn: "bg-blue-50/30"
    };
    if (lower.includes("cliente")) return {
        borderTop: "border-t-emerald-500",
        textTitle: "text-emerald-700",
        iconColor: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-800",
        avatarBg: "bg-emerald-100 text-emerald-700",
        bgColumn: "bg-emerald-50/30"
    };
    return {
        borderTop: "border-t-slate-400",
        textTitle: "text-slate-700",
        iconColor: "text-slate-500",
        badge: "bg-slate-200 text-slate-800",
        avatarBg: "bg-slate-200 text-slate-700",
        bgColumn: "bg-slate-50/30"
    };
};

export default function GestionUsuario(): JSX.Element {
    // --- ESTADOS ---
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form Fields
    const [cedula, setCedula] = useState("");
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [password, setPassword] = useState("");
    const [estado, setEstado] = useState(true);
    const [selectedRolId, setSelectedRolId] = useState<number | "">("");

    // Validaciones
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Search
    const [search, setSearch] = useState("");

    // --- API LOGIC ---
    const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const getAuthHeaders = () => {
        const token = getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchUsuarios = useCallback(async () => {
        if (!getToken()) return;
        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            const authHeaders = getAuthHeaders();
            if (authHeaders.Authorization) {
                headers.Authorization = authHeaders.Authorization;
            }
            const res = await fetch(API_BASE, { headers });
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
            const headers: Record<string, string> = {};
            const authHeaders = getAuthHeaders();
            if (authHeaders.Authorization) {
                headers.Authorization = authHeaders.Authorization;
            }
            const res = await fetch(ROLES_API, { headers });
            if (res.ok) setRoles(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
    }, [fetchUsuarios, fetchRoles]);

    // --- LOGICA ROL CLIENTE ---
    const isSelectedRoleClient = useMemo(() => {
        if (!selectedRolId) return false;
        const rol = roles.find(r => r.idRol === Number(selectedRolId));
        return rol ? rol.nombre.toUpperCase().includes("CLIENTE") : false;
    }, [selectedRolId, roles]);

    useEffect(() => {
        if (isSelectedRoleClient && !isEditing) {
            setPassword("");
        }
    }, [isSelectedRoleClient, isEditing]);

    // --- HANDLERS ---
    const openCreate = () => {
        setIsEditing(false);
        setCedula(""); setNombre(""); setCorreo(""); setTelefono(""); setDireccion("");
        setPassword(""); setEstado(true); setSelectedRolId("");
        setFormErrors({});
        setShowForm(true);
    };

    const openEdit = (u: Usuario) => {
        setIsEditing(true);
        setCedula(u.cedula);
        setNombre(u.nombre || "");
        setCorreo(u.correo || "");
        setTelefono(u.telefono || "");
        setDireccion(u.direccion || "");
        setPassword("");
        setEstado(u.estado ?? true);
        setSelectedRolId(u.rol?.idRol ?? "");
        setFormErrors({});
        setShowForm(true);
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!cedula.trim()) errors.cedula = "La cédula es obligatoria.";
        else if (!/^\d{10}$/.test(cedula)) errors.cedula = "Debe tener 10 dígitos numéricos.";

        if (!selectedRolId) errors.rol = "Seleccione un rol.";

        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errors.correo = "Correo inválido.";
        if (telefono && !/^\d{9,10}$/.test(telefono)) errors.telefono = "Numérico (9-10 dígitos).";

        if (!isEditing && !isSelectedRoleClient && !password) errors.password = "Contraseña obligatoria.";

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
            };

            if (!isEditing) {
                if (isSelectedRoleClient) payload.password = generateRandomPassword();
                else if (password.trim()) payload.password = password;
            } else {
                if (password.trim()) payload.password = password;
            }

            const headers: Record<string, string> = { "Content-Type": "application/json" };
            const authHeaders = getAuthHeaders();
            if (authHeaders.Authorization) {
                headers.Authorization = authHeaders.Authorization;
            }

            const res = await fetch(isEditing ? `${API_BASE}/${cedula}` : API_BASE, {
                method: isEditing ? "PUT" : "POST",
                headers,
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

    const deleteUsuario = async (ced: string) => {
        if (!confirm("¿Eliminar usuario?")) return;
        try {
            const headers: Record<string, string> = {};
            const authHeaders = getAuthHeaders();
            if (authHeaders.Authorization) {
                headers.Authorization = authHeaders.Authorization;
            }
            await fetch(`${API_BASE}/${ced}`, { method: "DELETE", headers });
            fetchUsuarios();
        } catch (e) { alert("Error eliminando"); }
    };

    // --- FILTROS Y AGRUPACIÓN ---
    const filteredData = useMemo(() => {
        const term = search.toLowerCase();
        const data = search ? usuarios.filter(u =>
            u.cedula.toLowerCase().includes(term) ||
            u.nombre?.toLowerCase().includes(term) ||
            u.correo?.toLowerCase().includes(term)
        ) : usuarios;

        const groups: Record<string, Usuario[]> = {};
        data.forEach(user => {
            const role = user.rol?.nombre || "Sin Rol";
            if (!groups[role]) groups[role] = [];
            groups[role].push(user);
        });
        return groups;
    }, [usuarios, search]);

    const stats = useMemo(() => ({
        total: usuarios.length,
        active: usuarios.filter(u => u.estado).length
    }), [usuarios]);

    return (
        <div className="flex flex-col min-h-full h-full bg-gradient-to-br from-slate-50 to-purple-50/30 p-4 lg:p-6 gap-6">

            {/* HEADER */}
            <div className="flex-none flex flex-col gap-4 md:flex-row md:items-center justify-between rounded-xl border border-purple-100 bg-white px-5 py-4 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-500/30">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        Gestión de Usuarios
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-purple-600 font-medium">
                        <span>Total: <b>{stats.total}</b></span>
                        <span className="w-1 h-1 rounded-full bg-purple-300" />
                        <span className="text-purple-700">Activos: <b>{stats.active}</b></span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 bg-purple-50/50 shadow-sm border-purple-200 focus-visible:ring-purple-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    <Button onClick={openCreate} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25 shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex-none bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                    <ShieldAlert className="h-4 w-4" /> {error}
                </div>
            )}

            {/* DASHBOARD KANBAN */}
            <div className="flex-1 w-full">
                {loading && usuarios.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                ) : Object.keys(filteredData).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-purple-500 border-2 border-dashed border-purple-200 rounded-xl bg-white/50">
                        <FilterX className="h-10 w-10 mb-2 opacity-50" />
                        <p>No se encontraron resultados</p>
                        {search && <Button variant="link" onClick={() => setSearch("")}>Limpiar búsqueda</Button>}
                    </div>
                ) : (
                    // GRID DE COLUMNAS
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                        {Object.entries(filteredData).map(([roleName, users]) => {
                            const theme = getRoleTheme(roleName);
                            const RoleIcon = () => {
                                const lower = roleName.toLowerCase();
                                if (lower.includes("admin")) return <ShieldCheck className={`h-4 w-4 ${theme.iconColor}`} />;
                                if (lower.includes("tecnico")) return <UserCog className={`h-4 w-4 ${theme.iconColor}`} />;
                                return <Users className={`h-4 w-4 ${theme.iconColor}`} />;
                            };

                            return (
                                <div
                                    key={roleName}
                                    className={`flex flex-col rounded-xl border border-purple-100 overflow-hidden shadow-sm ${theme.bgColumn || 'bg-purple-50/30'}`}
                                >
                                    {/* Header de Columna */}
                                    <div className="flex-none flex items-center justify-between p-3 bg-white border-b border-purple-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md bg-purple-50 ${theme.textTitle}`}>
                                                <RoleIcon />
                                            </div>
                                            <h3 className={`font-bold text-sm uppercase tracking-wide ${theme.textTitle}`}>
                                                {roleName}
                                            </h3>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                                            {users.length}
                                        </span>
                                    </div>

                                    {/* ✅ CAMBIO 3: max-h-[450px]
                                        Esto limita la lista interna a aprox 3 tarjetas.
                                        Si hay más, aparece el scroll SOLO aquí.
                                        Si hay menos, la columna se hace pequeña. */}
                                    <div className="overflow-y-auto p-3 space-y-3 custom-scrollbar max-h-[450px] min-h-[100px]">
                                        {users.map((u) => (
                                            <div
                                                key={u.cedula}
                                                className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group flex flex-col gap-2"
                                            >
                                                {/* Cabecera Tarjeta */}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${theme.avatarBg}`}>
                                                            {getInitials(u.nombre)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-semibold text-slate-900 text-sm truncate w-36" title={u.nombre}>
                                                                {u.nombre || "Sin Nombre"}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-400 font-mono tracking-tight">{u.cedula}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${u.estado ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-slate-300"}`} title={u.estado ? "Activo" : "Inactivo"} />
                                                </div>

                                                {/* Datos Rápidos */}
                                                <div className="text-[11px] text-slate-500 space-y-1 pl-1">
                                                    {u.correo && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="h-3 w-3 text-slate-300" />
                                                            <span className="truncate max-w-[180px]" title={u.correo}>{u.correo}</span>
                                                        </div>
                                                    )}
                                                    {u.telefono && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3 text-slate-300" />
                                                            <span className="truncate">{u.telefono}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Botones Acciones */}
                                                <div className="flex items-center justify-end gap-2 pt-2 mt-1 border-t border-slate-50">
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUsuario(u.cedula)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ===== MODAL CREAR/EDITAR ===== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{isEditing ? "Editar Usuario" : "Registrar Nuevo Usuario"}</h2>
                                <p className="text-sm text-slate-500">Complete la información requerida.</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* ID & Rol */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Cédula</label>
                                    <Input
                                        value={cedula}
                                        onChange={e => setCedula(e.target.value)}
                                        disabled={isEditing}
                                        className={`mt-1 ${formErrors.cedula ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                        placeholder="Ej: 1712345678"
                                    />
                                    {formErrors.cedula && <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.cedula}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Rol</label>
                                    <select
                                        value={selectedRolId}
                                        onChange={e => setSelectedRolId(Number(e.target.value))}
                                        className={`mt-1 flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${formErrors.rol ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {roles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombre}</option>)}
                                    </select>
                                    {formErrors.rol && <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.rol}</p>}
                                </div>
                            </div>

                            {/* Personal */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nombre Completo</label>
                                <Input value={nombre} onChange={e => setNombre(e.target.value)} className="mt-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Correo</label>
                                    <Input
                                        type="email"
                                        value={correo}
                                        onChange={e => setCorreo(e.target.value)}
                                        className={`mt-1 ${formErrors.correo ? "border-red-500" : ""}`}
                                    />
                                    {formErrors.correo && <p className="text-[10px] text-red-500 mt-1">{formErrors.correo}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Teléfono</label>
                                    <Input
                                        value={telefono}
                                        onChange={e => setTelefono(e.target.value)}
                                        className={`mt-1 ${formErrors.telefono ? "border-red-500" : ""}`}
                                    />
                                    {formErrors.telefono && <p className="text-[10px] text-red-500 mt-1">{formErrors.telefono}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Dirección</label>
                                <Input value={direccion} onChange={e => setDireccion(e.target.value)} className="mt-1" />
                            </div>

                            {/* Security */}
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                                        {isEditing ? "Nueva Contraseña" : "Contraseña"}
                                        {isSelectedRoleClient && (
                                            <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 rounded flex items-center gap-1 border border-emerald-100">
                                                <ShieldCheck className="h-3 w-3" /> Auto-generada
                                            </span>
                                        )}
                                    </label>

                                    <div className="relative mt-1">
                                        <Input
                                            type="password"
                                            value={isSelectedRoleClient ? "" : password}
                                            onChange={e => setPassword(e.target.value)}
                                            className={`pr-8 ${formErrors.password ? "border-red-500" : ""} ${isSelectedRoleClient ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
                                            placeholder={isSelectedRoleClient ? "Se generará automáticamente" : "••••••"}
                                            disabled={isSelectedRoleClient}
                                        />
                                        {isSelectedRoleClient && (
                                            <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        )}
                                    </div>
                                    {formErrors.password && <p className="text-[10px] text-red-500 mt-1">{formErrors.password}</p>}
                                </div>

                                <div className="flex items-center gap-3 justify-end md:justify-start">
                                    <div
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all ${estado ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                                        onClick={() => setEstado(!estado)}
                                    >
                                        <label className={`text-sm font-medium cursor-pointer ${estado ? "text-emerald-700" : "text-slate-600"}`}>
                                            {estado ? "Usuario Activo" : "Usuario Inactivo"}
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
                            <Button onClick={saveUsuario} disabled={loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25">
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}