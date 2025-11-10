"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    ShieldCheck,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api/usuarios";
const ROLES_API = "http://localhost:8080/roles";

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

export default function GestionUsuario(): JSX.Element {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Campos usuario
    const [cedula, setCedula] = useState("");
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [password, setPassword] = useState("");
    const [estado, setEstado] = useState(true);
    const [selectedRolId, setSelectedRolId] = useState<number | "">("");

    const [search, setSearch] = useState("");

    const getToken = (): string | null =>
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const getAuthHeaders = () => {
        const token = getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // ===== fetch usuarios =====
    const fetchUsuarios = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setError("No se encontró token. Inicie sesión nuevamente.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(API_BASE, {
                headers: {
                    ...getAuthHeaders(),
                },
            });
            if (!res.ok) throw new Error("Error al obtener usuarios");
            const data: Usuario[] = await res.json();
            setUsuarios(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    }, []);

    // ===== fetch roles =====
    const fetchRoles = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(ROLES_API, {
                headers: {
                    ...getAuthHeaders(),
                },
            });
            if (!res.ok) throw new Error("Error al cargar roles");
            const data: Rol[] = await res.json();
            setRoles(data);
        } catch (e) {
            console.warn("No se pudieron cargar los roles", e);
        }
    }, []);

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
    }, [fetchUsuarios, fetchRoles]);

    // ===== abrir crear =====
    const openCreate = () => {
        setIsEditing(false);
        setCedula("");
        setNombre("");
        setCorreo("");
        setTelefono("");
        setDireccion("");
        setPassword("");
        setEstado(true);
        setSelectedRolId("");
        setShowForm(true);
    };

    // ===== abrir editar =====
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
        setShowForm(true);
    };

    // ===== guardar =====
    const saveUsuario = async () => {
        const token = getToken();
        if (!token) {
            setError("No se encontró token.");
            return;
        }

        if (!cedula) {
            setError("La cédula es obligatoria.");
            return;
        }
        if (!isEditing && !password) {
            setError("La contraseña es obligatoria para crear.");
            return;
        }
        if (!selectedRolId) {
            setError("Debes seleccionar un rol.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const rolObj = roles.find((r) => r.idRol === Number(selectedRolId));

            const payload: any = {
                cedula,
                nombre,
                correo,
                telefono,
                direccion,
                estado,
                rol: rolObj
                    ? {
                        idRol: rolObj.idRol,
                        nombre: rolObj.nombre,
                        descripcion: rolObj.descripcion ?? rolObj.nombre,
                    }
                    : null,
            };

            if (!isEditing || password.trim() !== "") {
                payload.password = password;
            }

            const res = await fetch(
                isEditing ? `${API_BASE}/${cedula}` : API_BASE,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                // si es 401/403 lo decimos claro
                if (res.status === 401 || res.status === 403) {
                    throw new Error("No autorizado. Revisa tu sesión.");
                }
                throw new Error(txt || "Error guardando usuario");
            }

            await fetchUsuarios();
            setShowForm(false);
        } catch (err: any) {
            setError(err.message || "Error guardando usuario");
        } finally {
            setLoading(false);
        }
    };

    // ===== eliminar =====
    const deleteUsuario = async (ced: string) => {
        if (!confirm("¿Seguro que deseas desactivar/eliminar este usuario?")) return;
        const token = getToken();
        if (!token) {
            setError("No se encontró token.");
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/${ced}`, {
                method: "DELETE",
                headers: {
                    ...getAuthHeaders(),
                },
            });
            if (!res.ok) throw new Error("Error al eliminar usuario");
            await fetchUsuarios();
        } catch (err: any) {
            setError(err.message || "Error al eliminar");
        }
    };

    // ===== filtro front =====
    const filteredUsuarios = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return usuarios;
        return usuarios.filter((u) => {
            return (
                u.cedula?.toLowerCase().includes(term) ||
                (u.nombre || "").toLowerCase().includes(term) ||
                (u.correo || "").toLowerCase().includes(term)
            );
        });
    }, [usuarios, search]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-sm text-gray-500">
                        Listar, crear, editar y desactivar usuarios.
                    </p>
                </div>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Nuevo usuario
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Usuarios registrados</CardTitle>
                            <CardDescription>
                                Datos provenientes de <code>/api/usuarios</code>
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Input
                                placeholder="Buscar por cédula, nombre..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-9 text-sm"
                            />
                            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                        </div>
                    ) : filteredUsuarios.length === 0 ? (
                        <div className="text-gray-500 text-center py-6">
                            {search ? "No hay coincidencias" : "No hay usuarios registrados"}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Cédula</th>
                                        <th className="px-4 py-2 text-left">Nombres</th>
                                        <th className="px-4 py-2 text-left">Email</th>
                                        <th className="px-4 py-2 text-left">Teléfono</th>
                                        <th className="px-4 py-2 text-left">Dirección</th>
                                        <th className="px-4 py-2 text-left">Estado</th>
                                        <th className="px-4 py-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsuarios.map((u) => (
                                        <tr key={u.cedula} className="border-t">
                                            <td className="px-4 py-2 font-medium">{u.cedula}</td>
                                            <td className="px-4 py-2">{u.nombre || "—"}</td>
                                            <td className="px-4 py-2">{u.correo || "—"}</td>
                                            <td className="px-4 py-2">{u.telefono || "—"}</td>
                                            <td className="px-4 py-2">{u.direccion || "—"}</td>
                                            <td className="px-4 py-2">
                                                {u.estado ?? true ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                                        <ShieldCheck className="h-3 w-3" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 flex gap-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => openEdit(u)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => deleteUsuario(u.cedula)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ===== Modal crear/editar ===== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-xl relative shadow-xl">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-lg font-semibold mb-4">
                            {isEditing ? "Editar usuario" : "Nuevo usuario"}
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-600">Cédula *</label>
                                <Input
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    disabled={isEditing}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Nombre</label>
                                <Input
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Correo</label>
                                <Input
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600">Teléfono</label>
                                    <Input
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Dirección</label>
                                    <Input
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* combo de roles */}
                            <div>
                                <label className="text-xs text-gray-600">Rol *</label>
                                <select
                                    value={selectedRolId}
                                    onChange={(e) =>
                                        setSelectedRolId(e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                                >
                                    <option value="">-- Selecciona un rol --</option>
                                    {roles.map((r) => (
                                        <option key={r.idRol} value={r.idRol}>
                                            {r.nombre} {r.descripcion ? `(${r.descripcion})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* password */}
                            <div>
                                <label className="text-xs text-gray-600">
                                    {isEditing ? "Password (opcional)" : "Password *"}
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEditing ? "Dejar vacío para no cambiar" : ""}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="estado"
                                    type="checkbox"
                                    checked={estado}
                                    onChange={(e) => setEstado(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="estado" className="text-sm">
                                    Usuario activo
                                </label>
                            </div>

                            <Button
                                onClick={saveUsuario}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
