"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../lib/api";
import { invalidateBackendConfigCache } from "../lib/config";
import { Settings, Key, Globe, Palette, Bell, Shield, Clock, Save, RefreshCw, Eye, EyeOff, Check, X, Info, AlertCircle, Server, Mail, Database, Loader2 } from "lucide-react";

/* =========================
   Helpers
========================= */
function getAuthToken(): string | null {
    const direct =
        localStorage.getItem("token") || localStorage.getItem("nb.auth.token");

    if (direct) return direct.replace(/^Bearer\s+/i, "").trim();

    try {
        const raw = localStorage.getItem("nb.auth");
        if (!raw) return null;
        const obj = JSON.parse(raw);
        const tk =
            obj?.token ||
            obj?.accessToken ||
            obj?.jwt ||
            obj?.data?.token ||
            obj?.data?.accessToken;

        if (!tk) return null;
        return String(tk).replace(/^Bearer\s+/i, "").trim();
    } catch {
        return null;
    }
}

/* =========================
   Tipos e Interfaces
========================= */
type ValueType = "STRING" | "NUMBER" | "BOOLEAN" | "URL" | "EMAIL" | "PASSWORD";
type ConfigSource = "frontend" | "backend";

interface ConfigurationProperty {
    id: number;
    key: string;
    value: string | null;
    category: string;
    description: string;
    isSensitive: boolean;
    isEditable: boolean;
    valueType: ValueType;
    updatedAt?: string;
    updatedBy?: string;
    source?: ConfigSource;
}

interface FrontendConfig {
    key: string;
    label: string;
    description: string;
    type: "text" | "password" | "number" | "boolean" | "select" | "url";
    defaultValue: string;
    options?: { label: string; value: string }[];
    placeholder?: string;
    sensitive?: boolean;
    required?: boolean;
    category: string;
}

interface ConfigurationsResponse {
    success: boolean;
    data: Record<string, ConfigurationProperty[]>;
    categories: string[];
}

interface UpdateConfigurationDTO {
    id: number;
    value: string;
}

interface BulkUpdateDTO {
    configurations: UpdateConfigurationDTO[];
}

/* =========================
   Constantes - Configuraciones Frontend
========================= */
const FRONTEND_CONFIGS: FrontendConfig[] = [
    // Integraciones
    {
        key: "RECAPTCHA_SITE_KEY",
        label: "reCAPTCHA Site Key",
        description: "Clave pública de Google reCAPTCHA v2 para proteger formularios",
        type: "text",
        defaultValue: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
        placeholder: "6Le...",
        required: true,
        category: "Frontend",
    },
    {
        key: "API_BASE_URL",
        label: "URL del Backend API",
        description: "Dirección base del servidor backend",
        type: "url",
        defaultValue: process.env.NEXT_PUBLIC_API_URL || "",
        placeholder: "https://api.example.com",
        required: true,
        category: "Frontend",
    },
    // Aplicación
    {
        key: "APP_NAME",
        label: "Nombre de la Aplicación",
        description: "Nombre mostrado en encabezados",
        type: "text",
        defaultValue: "Newbie Data Control",
        placeholder: "Mi Aplicación",
        category: "Frontend",
    },
    {
        key: "COMPANY_NAME",
        label: "Nombre de la Empresa",
        description: "Nombre comercial para reportes",
        type: "text",
        defaultValue: "Newbie Soft",
        placeholder: "Mi Empresa S.A.",
        category: "Frontend",
    },
    // UI
    {
        key: "SIDEBAR_STYLE",
        label: "Estilo del Sidebar",
        description: "Comportamiento del menú lateral",
        type: "select",
        defaultValue: "auto",
        options: [
            { label: "Auto (hover)", value: "auto" },
            { label: "Siempre expandido", value: "expanded" },
            { label: "Siempre colapsado", value: "collapsed" },
        ],
        category: "Frontend",
    },
    {
        key: "DATE_FORMAT",
        label: "Formato de Fecha",
        description: "Formato para mostrar fechas",
        type: "select",
        defaultValue: "DD/MM/YYYY",
        options: [
            { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
            { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
            { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
        ],
        category: "Frontend",
    },
    {
        key: "ITEMS_PER_PAGE",
        label: "Items por Página",
        description: "Registros por página en listados",
        type: "number",
        defaultValue: "10",
        placeholder: "10",
        category: "Frontend",
    },
    // Notificaciones
    {
        key: "NOTIFY_NEW_CITA",
        label: "Notificar nuevas citas",
        description: "Alerta al crear una nueva cita",
        type: "boolean",
        defaultValue: "true",
        category: "Frontend",
    },
    {
        key: "NOTIFY_SOUND",
        label: "Sonido de notificación",
        description: "Reproducir sonido en notificaciones",
        type: "boolean",
        defaultValue: "false",
        category: "Frontend",
    },
    // Sesión
    {
        key: "SESSION_TIMEOUT",
        label: "Timeout de sesión (min)",
        description: "Minutos antes de cerrar sesión por inactividad",
        type: "number",
        defaultValue: "30",
        placeholder: "30",
        category: "Frontend",
    },
    {
        key: "AUTO_REFRESH_INTERVAL",
        label: "Auto-refresh (seg)",
        description: "Segundos entre actualizaciones (0 = off)",
        type: "number",
        defaultValue: "60",
        placeholder: "60",
        category: "Frontend",
    },
];

const CONFIG_API = `${API_BASE_URL}/api/v1/configurations`;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    "Frontend": <Globe className="w-5 h-5" />,
    "Aplicación": <Settings className="w-5 h-5" />,
    "Base de Datos": <Database className="w-5 h-5" />,
    "Seguridad": <Shield className="w-5 h-5" />,
    "Correo SMTP": <Mail className="w-5 h-5" />,
    "Servicios Externos": <Key className="w-5 h-5" />,
    "default": <Server className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
    "Frontend": "#7c3aed",
    "Aplicación": "#6366f1",
    "Base de Datos": "#059669",
    "Seguridad": "#dc2626",
    "Correo SMTP": "#0891b2",
    "Servicios Externos": "#2563eb",
    "default": "#6b7280",
};

/* =========================
   Componente Principal
========================= */
export default function ConfiguracionesPage() {
    // Estados principales
    const [configurations, setConfigurations] = useState<Record<string, ConfigurationProperty[]>>({});
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>("Frontend");

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados de edición - separamos frontend y backend
    const [editedBackendValues, setEditedBackendValues] = useState<Record<number, string>>({});
    const [editedFrontendValues, setEditedFrontendValues] = useState<Record<string, string>>({});
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    // Estados de búsqueda
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ConfigurationProperty[] | null>(null);
    const [searching, setSearching] = useState(false);

    /* =========================
       Cargar configuraciones Frontend desde localStorage
    ========================= */
    const loadFrontendConfigs = useCallback(() => {
        const frontendConfigs: ConfigurationProperty[] = FRONTEND_CONFIGS.map((cfg, idx) => ({
            id: -1000 - idx, // IDs negativos para distinguir de backend
            key: cfg.key,
            value: localStorage.getItem(`config.${cfg.key}`) || cfg.defaultValue,
            category: "Frontend",
            description: cfg.description,
            isSensitive: cfg.sensitive || false,
            isEditable: true,
            valueType: cfg.type === "boolean" ? "BOOLEAN" : cfg.type === "number" ? "NUMBER" : cfg.type === "password" ? "PASSWORD" : "STRING",
            source: "frontend" as ConfigSource,
        }));

        return { "Frontend": frontendConfigs };
    }, []);

    /* =========================
       Cargar configuraciones Backend desde API
    ========================= */
    const loadBackendConfigurations = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            // Sin token, solo cargamos frontend
            const frontendData = loadFrontendConfigs();
            setConfigurations(frontendData);
            setCategories(["Frontend"]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${CONFIG_API}?maskSensitive=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    // Sin permisos, solo frontend
                    const frontendData = loadFrontendConfigs();
                    setConfigurations(frontendData);
                    setCategories(["Frontend"]);
                    return;
                }
                throw new Error(`Error ${res.status} al cargar configuraciones`);
            }

            const json: ConfigurationsResponse = await res.json();

            if (json.success) {
                // Combinar frontend + backend
                const frontendData = loadFrontendConfigs();

                // Filtrar categorías irrelevantes del backend
                const relevantCategories = ["Aplicación", "Seguridad", "Correo SMTP", "Base de Datos", "Servicios Externos"];
                const filteredBackendData: Record<string, ConfigurationProperty[]> = {};

                Object.entries(json.data).forEach(([category, configs]) => {
                    if (relevantCategories.includes(category)) {
                        // Marcar como backend y filtrar propiedades no relevantes
                        filteredBackendData[category] = configs
                            .filter(cfg => !cfg.key.includes("debug") && !cfg.key.includes("actuator") && !cfg.key.includes("logging"))
                            .map(cfg => ({ ...cfg, source: "backend" as ConfigSource }));
                    }
                });

                const combinedData = { ...frontendData, ...filteredBackendData };
                const allCategories = ["Frontend", ...relevantCategories.filter(cat => filteredBackendData[cat]?.length > 0)];

                setConfigurations(combinedData);
                setCategories(allCategories);
            }
        } catch (err) {
            console.error("Error cargando configuraciones backend:", err);
            // Fallback a solo frontend
            const frontendData = loadFrontendConfigs();
            setConfigurations(frontendData);
            setCategories(["Frontend"]);
            setError(err instanceof Error ? err.message : "Error cargando configuraciones del servidor");
        } finally {
            setLoading(false);
        }
    }, [loadFrontendConfigs]);

    useEffect(() => {
        loadBackendConfigurations();
    }, [loadBackendConfigurations]);

    /* =========================
       Búsqueda
    ========================= */
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        const token = getAuthToken();
        if (!token) return;

        setSearching(true);
        setError(null);

        try {
            const res = await fetch(
                `${CONFIG_API}/search?q=${encodeURIComponent(searchQuery)}&maskSensitive=true`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error(`Error ${res.status} en búsqueda`);

            const json = await res.json();
            setSearchResults(json.data || []);
        } catch (err) {
            console.error("Error en búsqueda:", err);
            setError("Error al buscar configuraciones");
        } finally {
            setSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults(null);
    };

    /* =========================
       Edición de valores
    ========================= */
    const handleValueChange = (config: ConfigurationProperty, newValue: string) => {
        if (config.source === "frontend" || config.id < 0) {
            setEditedFrontendValues((prev) => ({
                ...prev,
                [config.key]: newValue,
            }));
        } else {
            setEditedBackendValues((prev) => ({
                ...prev,
                [config.id]: newValue,
            }));
        }
    };

    const getDisplayValue = (config: ConfigurationProperty): string => {
        if (config.source === "frontend" || config.id < 0) {
            if (editedFrontendValues[config.key] !== undefined) {
                return editedFrontendValues[config.key];
            }
        } else {
            if (editedBackendValues[config.id] !== undefined) {
                return editedBackendValues[config.id] ?? "";
            }
        }
        return config.value ?? "";
    };

    const hasConfigChanges = (config: ConfigurationProperty): boolean => {
        if (config.source === "frontend" || config.id < 0) {
            const edited = editedFrontendValues[config.key];
            if (edited === undefined) return false;
            return edited !== (config.value ?? "");
        } else {
            const edited = editedBackendValues[config.id];
            if (edited === undefined) return false;
            return edited !== (config.value ?? "");
        }
    };

    const discardChanges = (config: ConfigurationProperty) => {
        if (config.source === "frontend" || config.id < 0) {
            setEditedFrontendValues((prev) => {
                const updated = { ...prev };
                delete updated[config.key];
                return updated;
            });
        } else {
            setEditedBackendValues((prev) => {
                const updated = { ...prev };
                delete updated[config.id];
                return updated;
            });
        }
    };

    // Contar cambios pendientes
    const pendingFrontendChanges = Object.keys(editedFrontendValues).length;
    const pendingBackendChanges = Object.keys(editedBackendValues).length;
    const totalPendingChanges = pendingFrontendChanges + pendingBackendChanges;

    /* =========================
       Guardar configuraciones Frontend (localStorage)
    ========================= */
    const saveFrontendConfigs = useCallback(() => {
        Object.entries(editedFrontendValues).forEach(([key, value]) => {
            localStorage.setItem(`config.${key}`, value);

            // Disparar evento custom para que otros componentes se actualicen
            window.dispatchEvent(new CustomEvent("frontendConfigChanged", {
                detail: { key, value }
            }));
        });

        // Actualizar estado
        setConfigurations((prev) => {
            const updated = { ...prev };
            if (updated["Frontend"]) {
                updated["Frontend"] = updated["Frontend"].map((cfg) => {
                    if (editedFrontendValues[cfg.key] !== undefined) {
                        return { ...cfg, value: editedFrontendValues[cfg.key] };
                    }
                    return cfg;
                });
            }
            return updated;
        });

        setEditedFrontendValues({});
    }, [editedFrontendValues]);

    /* =========================
       Guardar configuración Backend individual
    ========================= */
    const saveBackendConfiguration = async (config: ConfigurationProperty) => {
        const token = getAuthToken();
        if (!token) return;

        const newValue = editedBackendValues[config.id];
        if (newValue === undefined || newValue === (config.value ?? "")) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`${CONFIG_API}/${config.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ value: newValue }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${res.status} al guardar`);
            }

            const json = await res.json();

            // Actualizar el estado local
            setConfigurations((prev) => {
                const updated = { ...prev };
                for (const category in updated) {
                    updated[category] = updated[category].map((c) =>
                        c.id === config.id ? { ...c, value: newValue } : c
                    );
                }
                return updated;
            });

            // Limpiar el valor editado
            discardChanges(config);

            setSuccessMessage(`Configuración "${config.key}" actualizada correctamente`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error guardando configuración:", err);
            setError(err instanceof Error ? err.message : "Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    /* =========================
       Guardar todos los cambios pendientes
    ========================= */
    const saveAllChanges = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // 1. Guardar cambios frontend
            if (pendingFrontendChanges > 0) {
                saveFrontendConfigs();
            }

            // 2. Guardar cambios backend
            if (pendingBackendChanges > 0) {
                const token = getAuthToken();
                if (token) {
                    const changedConfigs = Object.entries(editedBackendValues).map(([id, value]) => ({
                        id: parseInt(id),
                        value,
                    }));

                    const res = await fetch(`${CONFIG_API}/bulk`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ configurations: changedConfigs } as BulkUpdateDTO),
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.message || `Error ${res.status} al guardar backend`);
                    }

                    // Invalidar caché para que otros componentes lean los nuevos valores
                    invalidateBackendConfigCache();
                    setEditedBackendValues({});
                }
            }

            setSuccessMessage(`${totalPendingChanges} configuración(es) guardada(s) correctamente`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error guardando configuraciones:", err);
            setError(err instanceof Error ? err.message : "Error al guardar las configuraciones");
        } finally {
            setSaving(false);
        }
    };

    /* =========================
       Descartar todos los cambios
    ========================= */
    const discardAllChanges = () => {
        setEditedFrontendValues({});
        setEditedBackendValues({});
    };

    /* =========================
       Configuraciones a mostrar
    ========================= */
    const displayConfigurations = useMemo(() => {
        if (activeCategory && configurations[activeCategory]) {
            return configurations[activeCategory];
        }
        return [];
    }, [activeCategory, configurations]);

    /* =========================
       Render
    ========================= */
    return (
        <div className="min-h-full h-full bg-gradient-to-br from-slate-50 to-purple-50/30 p-4 lg:p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex-none bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-lg shadow-purple-500/5 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
                            <Settings className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Configuraciones</h1>
                            <p className="text-sm text-slate-500">Frontend y Backend • {categories.length} categorías</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {totalPendingChanges > 0 && (
                            <>
                                <button
                                    onClick={discardAllChanges}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Descartar
                                </button>
                                <button
                                    onClick={saveAllChanges}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Guardando..." : `Guardar (${totalPendingChanges})`}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => loadBackendConfigurations()}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                            title="Recargar configuraciones"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recargar
                        </button>
                    </div>
                </div>
            </div>

            {/* Mensajes */}
            {error && (
                <div className="flex-none bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="flex-none bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    {successMessage}
                </div>
            )}

            {/* Contenido principal */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                        <p className="text-slate-500">Cargando configuraciones...</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Sidebar de categorías */}
                    <div className="w-56 flex-shrink-0 flex flex-col gap-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                            Categorías
                        </div>
                        {categories.map((category) => {
                            const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
                            const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
                            const isActive = activeCategory === category;
                            const count = configurations[category]?.length || 0;
                            const categoryConfigs = configurations[category] || [];
                            const categoryHasChanges = categoryConfigs.some((c) => hasConfigChanges(c));
                            const isFrontend = category === "Frontend";

                            return (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                                        ? "bg-white shadow-md border border-purple-200"
                                        : "hover:bg-white/60 border border-transparent"
                                        }`}
                                >
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{
                                            backgroundColor: isActive ? `${color}15` : "#f1f5f9",
                                            color: isActive ? color : "#64748b",
                                        }}
                                    >
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate flex items-center gap-1 ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                                            {category}
                                            {categoryHasChanges && (
                                                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full" />
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate">
                                            {count} props • {isFrontend ? "Local" : "Servidor"}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Lista de configuraciones */}
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-lg shadow-purple-500/5 p-6 overflow-y-auto">
                        {activeCategory && (
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
                                <div
                                    className="p-2 rounded-lg"
                                    style={{
                                        backgroundColor: `${CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.default}15`,
                                        color: CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.default,
                                    }}
                                >
                                    {CATEGORY_ICONS[activeCategory] || CATEGORY_ICONS.default}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {activeCategory}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {displayConfigurations.length} propiedades •
                                        {activeCategory === "Frontend" ? " Guardado local" : " Guardado en servidor"}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {displayConfigurations.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    No hay configuraciones para mostrar
                                </div>
                            ) : (
                                displayConfigurations.map((config) => (
                                    <ConfigurationCard
                                        key={config.key}
                                        config={config}
                                        frontendConfig={FRONTEND_CONFIGS.find(fc => fc.key === config.key)}
                                        value={getDisplayValue(config)}
                                        hasChanges={hasConfigChanges(config)}
                                        showPassword={showPasswords[config.key] || false}
                                        saving={saving}
                                        onValueChange={(val) => handleValueChange(config, val)}
                                        onTogglePassword={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                [config.key]: !prev[config.key],
                                            }))
                                        }
                                        onSave={() => {
                                            if (config.source === "frontend" || config.id < 0) {
                                                // Guardar frontend individual
                                                localStorage.setItem(`config.${config.key}`, getDisplayValue(config));
                                                discardChanges(config);
                                                setSuccessMessage(`"${config.key}" guardado`);
                                                setTimeout(() => setSuccessMessage(null), 2000);
                                            } else {
                                                saveBackendConfiguration(config);
                                            }
                                        }}
                                        onDiscard={() => discardChanges(config)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer con info */}
            <div className="mt-4 pt-4 border-t border-purple-100">
                <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                    <span><Globe className="w-3 h-3 inline mr-1" /> <b>Frontend:</b> Guardado en navegador</span>
                    <span><Server className="w-3 h-3 inline mr-1" /> <b>Backend:</b> Guardado en servidor</span>
                    <span><Shield className="w-3 h-3 inline mr-1" /> Valores sensibles están enmascarados</span>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Componente ConfigurationCard
========================= */
interface ConfigurationCardProps {
    config: ConfigurationProperty;
    frontendConfig?: FrontendConfig;
    value: string;
    hasChanges: boolean;
    showPassword: boolean;
    saving: boolean;
    onValueChange: (value: string) => void;
    onTogglePassword: () => void;
    onSave: () => void;
    onDiscard: () => void;
}

function ConfigurationCard({
    config,
    frontendConfig,
    value,
    hasChanges,
    showPassword,
    saving,
    onValueChange,
    onTogglePassword,
    onSave,
    onDiscard,
}: ConfigurationCardProps) {
    const isPassword = config.valueType === "PASSWORD" || config.isSensitive || frontendConfig?.sensitive;
    const isBoolean = config.valueType === "BOOLEAN" || frontendConfig?.type === "boolean";
    const isNumber = config.valueType === "NUMBER" || frontendConfig?.type === "number";
    const isSelect = frontendConfig?.type === "select";
    const isFrontend = config.source === "frontend" || config.id < 0;

    const label = frontendConfig?.label || config.key;
    const description = frontendConfig?.description || config.description;

    return (
        <div
            className={`p-4 rounded-xl border transition-all ${hasChanges ? "border-purple-300 bg-purple-50/50" : "border-slate-100 bg-slate-50/50"
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{label}</span>
                        {isFrontend && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                Local
                            </span>
                        )}
                        {!isFrontend && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                Servidor
                            </span>
                        )}
                        {config.isSensitive && (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                Sensible
                            </span>
                        )}
                        {hasChanges && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                Modificado
                            </span>
                        )}
                        {!config.isEditable && (
                            <span className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded">
                                Solo lectura
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {description}
                    </p>
                </div>
            </div>

            {/* Input */}
            <div className="mt-3 flex items-center gap-2">
                {isBoolean ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => config.isEditable && onValueChange("true")}
                            disabled={!config.isEditable}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === "true"
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-green-300"
                                } ${!config.isEditable ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <Check className="w-4 h-4 inline mr-1" />
                            Activado
                        </button>
                        <button
                            onClick={() => config.isEditable && onValueChange("false")}
                            disabled={!config.isEditable}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === "false"
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-red-300"
                                } ${!config.isEditable ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <X className="w-4 h-4 inline mr-1" />
                            Desactivado
                        </button>
                    </div>
                ) : isSelect && frontendConfig?.options ? (
                    <select
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        disabled={!config.isEditable}
                        className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {frontendConfig.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="relative flex-1 max-w-md">
                        <input
                            type={isPassword && !showPassword ? "password" : isNumber ? "number" : "text"}
                            value={value}
                            onChange={(e) => onValueChange(e.target.value)}
                            disabled={!config.isEditable}
                            placeholder={frontendConfig?.placeholder || ""}
                            className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 font-mono focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                        {isPassword && (
                            <button
                                type="button"
                                onClick={onTogglePassword}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                )}

                {/* Botones de acción */}
                {hasChanges && config.isEditable && (
                    <div className="flex gap-2">
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium shadow-sm hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                            title="Guardar"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDiscard}
                            disabled={saving}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-all"
                            title="Descartar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Key técnica */}
            <div className="mt-2 text-xs text-slate-400 font-mono">
                {isFrontend ? `localStorage: config.${config.key}` : `backend: ${config.key}`}
            </div>
        </div>
    );
}