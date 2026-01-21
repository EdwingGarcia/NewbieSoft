"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../lib/api";

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
   Constantes
========================= */
const CONFIG_API = `${API_BASE_URL}/api/v1/configurations`;

const CATEGORY_ICONS: Record<string, string> = {
    "Aplicación": "🏢",
    "Base de Datos": "🗄️",
    "Seguridad": "🔒",
    "Correo SMTP": "📧",
    "Logging": "📋",
    "Archivos": "📁",
    "Servicios Externos": "🔗",
    "Actuator": "📊",
    "default": "⚙️",
};

const CATEGORY_COLORS: Record<string, string> = {
    "Aplicación": "#6366f1",
    "Base de Datos": "#059669",
    "Seguridad": "#dc2626",
    "Correo SMTP": "#0891b2",
    "Logging": "#7c3aed",
    "Archivos": "#ea580c",
    "Servicios Externos": "#2563eb",
    "Actuator": "#84cc16",
    "default": "#6b7280",
};

/* =========================
   Componente Principal
========================= */
export default function ConfiguracionesPage() {
    // Estados principales
    const [configurations, setConfigurations] = useState<Record<string, ConfigurationProperty[]>>({});
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados de edición
    const [editedValues, setEditedValues] = useState<Record<number, string>>({});
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

    // Estados de búsqueda
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ConfigurationProperty[] | null>(null);
    const [searching, setSearching] = useState(false);

    /* =========================
       Cargar configuraciones
    ========================= */
    const loadConfigurations = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${CONFIG_API}?maskSensitive=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    throw new Error("No tienes permisos para acceder a las configuraciones");
                }
                throw new Error(`Error ${res.status} al cargar configuraciones`);
            }

            const json: ConfigurationsResponse = await res.json();

            if (json.success) {
                setConfigurations(json.data);
                setCategories(json.categories || Object.keys(json.data));

                // Seleccionar primera categoría si no hay ninguna activa
                if (!activeCategory && json.categories?.length > 0) {
                    setActiveCategory(json.categories[0]);
                }
            }
        } catch (err) {
            console.error("Error cargando configuraciones:", err);
            setError(err instanceof Error ? err.message : "No se pudieron cargar las configuraciones");
        } finally {
            setLoading(false);
        }
    }, [activeCategory]);

    useEffect(() => {
        loadConfigurations();
    }, []);

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
    const handleValueChange = (configId: number, newValue: string) => {
        setEditedValues((prev) => ({
            ...prev,
            [configId]: newValue,
        }));
    };

    const getDisplayValue = (config: ConfigurationProperty): string => {
        if (editedValues[config.id] !== undefined) {
            return editedValues[config.id] ?? "";
        }
        return config.value ?? "";
    };

    const hasChanges = (configId: number, originalValue: string | null): boolean => {
        const editedValue = editedValues[configId];
        if (editedValue === undefined) return false;
        return editedValue !== (originalValue ?? "");
    };

    const discardChanges = (configId: number) => {
        setEditedValues((prev) => {
            const updated = { ...prev };
            delete updated[configId];
            return updated;
        });
    };

    /* =========================
       Guardar configuración individual
    ========================= */
    const saveConfiguration = async (config: ConfigurationProperty) => {
        const token = getAuthToken();
        if (!token) return;

        const newValue = editedValues[config.id];
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
            discardChanges(config.id);

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
        const token = getAuthToken();
        if (!token) return;

        const changedConfigs = Object.entries(editedValues).map(([id, value]) => ({
            id: parseInt(id),
            value,
        }));

        if (changedConfigs.length === 0) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
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
                throw new Error(errorData.message || `Error ${res.status} al guardar`);
            }

            // Recargar configuraciones
            await loadConfigurations();

            // Limpiar valores editados
            setEditedValues({});

            setSuccessMessage(`${changedConfigs.length} configuraciones actualizadas correctamente`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error guardando configuraciones:", err);
            setError(err instanceof Error ? err.message : "Error al guardar las configuraciones");
        } finally {
            setSaving(false);
        }
    };

    /* =========================
       Configuraciones a mostrar
    ========================= */
    const displayConfigurations = useMemo(() => {
        if (searchResults !== null) {
            return searchResults;
        }
        if (activeCategory && configurations[activeCategory]) {
            return configurations[activeCategory];
        }
        return [];
    }, [searchResults, activeCategory, configurations]);

    const pendingChangesCount = Object.keys(editedValues).length;

    /* =========================
       Estilos
    ========================= */
    const cardStyle: React.CSSProperties = {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1.25rem",
        border: "1px solid #e5e7eb",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "0.6rem 0.8rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        fontSize: "0.85rem",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        fontFamily: "monospace",
    };

    const buttonPrimaryStyle: React.CSSProperties = {
        background: "linear-gradient(90deg, #6366f1, #4f46e5)",
        borderRadius: "999px",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        padding: "0.5rem 1rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        transition: "opacity 0.2s",
    };

    const buttonSecondaryStyle: React.CSSProperties = {
        background: "#fff",
        borderRadius: "999px",
        border: "1px solid #e5e7eb",
        color: "#374151",
        cursor: "pointer",
        padding: "0.5rem 1rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        transition: "all 0.2s",
    };

    /* =========================
       Render
    ========================= */
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            height: "calc(100vh - 120px)", // Altura total menos header
            overflow: "hidden",
        }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                    flexShrink: 0,
                }}
            >
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        ⚙️ Configuraciones del Sistema
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
                        Administra las configuraciones de la aplicación
                    </p>
                </div>

                {/* Botón guardar todos los cambios */}
                {pendingChangesCount > 0 && (
                    <button
                        style={{
                            ...buttonPrimaryStyle,
                            background: "linear-gradient(90deg, #16a34a, #22c55e)",
                        }}
                        onClick={saveAllChanges}
                        disabled={saving}
                    >
                        {saving ? "Guardando..." : `💾 Guardar ${pendingChangesCount} cambio(s)`}
                    </button>
                )}
            </div>

            {/* Mensajes de error/éxito */}
            {error && (
                <div
                    style={{
                        fontSize: "0.85rem",
                        color: "#b91c1c",
                        backgroundColor: "#fee2e2",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        border: "1px solid #fecaca",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    <span>❌ {error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {successMessage && (
                <div
                    style={{
                        fontSize: "0.85rem",
                        color: "#166534",
                        backgroundColor: "#dcfce7",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        border: "1px solid #bbf7d0",
                        flexShrink: 0,
                    }}
                >
                    ✅ {successMessage}
                </div>
            )}

            {/* Barra de búsqueda */}
            <div style={{ ...cardStyle, padding: "1rem", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Buscar configuraciones por clave o descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            style={{
                                ...inputStyle,
                                fontFamily: "inherit",
                                paddingRight: searchQuery ? "2.5rem" : "0.8rem",
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                style={{
                                    position: "absolute",
                                    right: "0.5rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                    fontSize: "1rem",
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        style={buttonPrimaryStyle}
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                    >
                        {searching ? "Buscando..." : "🔍 Buscar"}
                    </button>
                </div>

                {searchResults !== null && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#6b7280" }}>
                        Se encontraron <b>{searchResults.length}</b> resultado(s) para "{searchQuery}"
                        <button
                            onClick={clearSearch}
                            style={{
                                marginLeft: "0.5rem",
                                background: "none",
                                border: "none",
                                color: "#4f46e5",
                                cursor: "pointer",
                                textDecoration: "underline",
                            }}
                        >
                            Limpiar búsqueda
                        </button>
                    </div>
                )}
            </div>

            {/* Contenido principal */}
            {loading ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p style={{ color: "#6b7280" }}>Cargando configuraciones...</p>
                </div>
            ) : (
                <div style={{
                    display: "flex",
                    gap: "1.25rem",
                    flex: 1,
                    minHeight: 0, // Importante para que flex funcione con overflow
                    overflow: "hidden",
                }}>
                    {/* Sidebar de categorías */}
                    {searchResults === null && (
                        <div
                            style={{
                                width: "220px",
                                flexShrink: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                overflowY: "auto",
                                paddingRight: "0.5rem",
                            }}
                        >
                            <div style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#6b7280",
                                marginBottom: "0.25rem",
                                position: "sticky",
                                top: 0,
                                backgroundColor: "#f5f5ff",
                                paddingBottom: "0.5rem",
                                zIndex: 1,
                            }}>
                                CATEGORÍAS
                            </div>
                            {categories.map((category) => {
                                const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
                                const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
                                const isActive = activeCategory === category;
                                const count = configurations[category]?.length || 0;

                                return (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.6rem",
                                            padding: "0.65rem 0.85rem",
                                            borderRadius: "10px",
                                            border: isActive ? `2px solid ${color}` : "1px solid #e5e7eb",
                                            background: isActive ? `${color}10` : "#fff",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: "0.85rem",
                                                    fontWeight: isActive ? 600 : 500,
                                                    color: isActive ? color : "#374151",
                                                }}
                                            >
                                                {category}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                                {count} propiedades
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Lista de configuraciones */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        paddingRight: "0.5rem",
                        minHeight: 0,
                    }}>
                        {searchResults === null && activeCategory && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "1rem",
                                    position: "sticky",
                                    top: 0,
                                    backgroundColor: "#f5f5ff",
                                    paddingBottom: "0.75rem",
                                    paddingTop: "0.25rem",
                                    zIndex: 1,
                                }}
                            >
                                <span style={{ fontSize: "1.25rem" }}>
                                    {CATEGORY_ICONS[activeCategory] || CATEGORY_ICONS.default}
                                </span>
                                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                                    {activeCategory}
                                </h2>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        padding: "0.15rem 0.5rem",
                                        borderRadius: "999px",
                                        backgroundColor: "#f3f4f6",
                                        color: "#6b7280",
                                    }}
                                >
                                    {displayConfigurations.length} propiedades
                                </span>
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "1rem" }}>
                            {displayConfigurations.length === 0 ? (
                                <div style={{ ...cardStyle, textAlign: "center", padding: "2rem" }}>
                                    <p style={{ color: "#6b7280" }}>No hay configuraciones para mostrar</p>
                                </div>
                            ) : (
                                displayConfigurations.map((config) => (
                                    <ConfigurationCard
                                        key={config.id}
                                        config={config}
                                        value={getDisplayValue(config)}
                                        hasChanges={hasChanges(config.id, config.value)}
                                        showPassword={showPasswords[config.id] || false}
                                        saving={saving}
                                        onValueChange={(val) => handleValueChange(config.id, val)}
                                        onTogglePassword={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                [config.id]: !prev[config.id],
                                            }))
                                        }
                                        onSave={() => saveConfiguration(config)}
                                        onDiscard={() => discardChanges(config.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Info footer */}
            <div
                style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#64748b",
                    flexShrink: 0, // No permitir que se encoja
                }}
            >
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div>
                        <span style={{ marginRight: "0.35rem" }}>🔒</span>
                        <b>Valores sensibles</b> están enmascarados por seguridad
                    </div>
                    <div>
                        <span style={{ marginRight: "0.35rem" }}>✏️</span>
                        Solo las propiedades <b>editables</b> pueden modificarse
                    </div>
                    <div>
                        <span style={{ marginRight: "0.35rem" }}>📝</span>
                        Los cambios se registran en el <b>log de auditoría</b>
                    </div>
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
    value,
    hasChanges,
    showPassword,
    saving,
    onValueChange,
    onTogglePassword,
    onSave,
    onDiscard,
}: ConfigurationCardProps) {
    const isPassword = config.valueType === "PASSWORD" || config.isSensitive;
    const isBoolean = config.valueType === "BOOLEAN";
    const isNumber = config.valueType === "NUMBER";

    const getTypeLabel = (type: ValueType): string => {
        const labels: Record<ValueType, string> = {
            STRING: "Texto",
            NUMBER: "Número",
            BOOLEAN: "Booleano",
            URL: "URL",
            EMAIL: "Email",
            PASSWORD: "Contraseña",
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: ValueType): string => {
        const colors: Record<ValueType, string> = {
            STRING: "#6b7280",
            NUMBER: "#2563eb",
            BOOLEAN: "#7c3aed",
            URL: "#0891b2",
            EMAIL: "#ea580c",
            PASSWORD: "#dc2626",
        };
        return colors[type] || "#6b7280";
    };

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                padding: "1rem",
                border: hasChanges ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                transition: "border-color 0.2s",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <code
                            style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: "#0f172a",
                                backgroundColor: "#f1f5f9",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                            }}
                        >
                            {config.key}
                        </code>

                        <span
                            style={{
                                fontSize: "0.7rem",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "999px",
                                backgroundColor: `${getTypeColor(config.valueType)}15`,
                                color: getTypeColor(config.valueType),
                                fontWeight: 600,
                            }}
                        >
                            {getTypeLabel(config.valueType)}
                        </span>

                        {config.isSensitive && (
                            <span
                                style={{
                                    fontSize: "0.7rem",
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: "999px",
                                    backgroundColor: "#fef2f2",
                                    color: "#dc2626",
                                    fontWeight: 600,
                                }}
                            >
                                🔒 Sensible
                            </span>
                        )}

                        {!config.isEditable && (
                            <span
                                style={{
                                    fontSize: "0.7rem",
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: "999px",
                                    backgroundColor: "#f3f4f6",
                                    color: "#6b7280",
                                    fontWeight: 600,
                                }}
                            >
                                🔐 Solo lectura
                            </span>
                        )}

                        {hasChanges && (
                            <span
                                style={{
                                    fontSize: "0.7rem",
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: "999px",
                                    backgroundColor: "#fef3c7",
                                    color: "#d97706",
                                    fontWeight: 600,
                                }}
                            >
                                ● Modificado
                            </span>
                        )}
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.35rem 0 0 0" }}>
                        {config.description}
                    </p>
                </div>
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {isBoolean ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button
                            onClick={() => config.isEditable && onValueChange("true")}
                            disabled={!config.isEditable}
                            style={{
                                padding: "0.4rem 0.8rem",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                background: value === "true" ? "#22c55e" : "#fff",
                                color: value === "true" ? "#fff" : "#374151",
                                cursor: config.isEditable ? "pointer" : "not-allowed",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                transition: "all 0.2s",
                            }}
                        >
                            ✓ true
                        </button>
                        <button
                            onClick={() => config.isEditable && onValueChange("false")}
                            disabled={!config.isEditable}
                            style={{
                                padding: "0.4rem 0.8rem",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                background: value === "false" ? "#ef4444" : "#fff",
                                color: value === "false" ? "#fff" : "#374151",
                                cursor: config.isEditable ? "pointer" : "not-allowed",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                transition: "all 0.2s",
                            }}
                        >
                            ✗ false
                        </button>
                    </div>
                ) : (
                    <div style={{ flex: 1, position: "relative" }}>
                        <input
                            type={isPassword && !showPassword ? "password" : isNumber ? "number" : "text"}
                            value={value ?? ""}
                            onChange={(e) => onValueChange(e.target.value)}
                            disabled={!config.isEditable}
                            style={{
                                width: "100%",
                                padding: "0.55rem 0.75rem",
                                paddingRight: isPassword ? "2.5rem" : "0.75rem",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                fontSize: "0.85rem",
                                fontFamily: "monospace",
                                backgroundColor: config.isEditable ? "#fff" : "#f9fafb",
                                color: config.isEditable ? "#0f172a" : "#6b7280",
                                outline: "none",
                                transition: "border-color 0.2s",
                            }}
                            placeholder={isPassword ? "••••••••" : ""}
                        />
                        {isPassword && (
                            <button
                                onClick={onTogglePassword}
                                style={{
                                    position: "absolute",
                                    right: "0.5rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                    fontSize: "0.9rem",
                                }}
                                title={showPassword ? "Ocultar" : "Mostrar"}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        )}
                    </div>
                )}

                {/* Botones de acción */}
                {hasChanges && config.isEditable && (
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            style={{
                                padding: "0.45rem 0.75rem",
                                borderRadius: "6px",
                                border: "none",
                                background: "linear-gradient(90deg, #16a34a, #22c55e)",
                                color: "#fff",
                                cursor: saving ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                opacity: saving ? 0.7 : 1,
                            }}
                            title="Guardar cambio"
                        >
                            {saving ? "..." : "💾"}
                        </button>
                        <button
                            onClick={onDiscard}
                            disabled={saving}
                            style={{
                                padding: "0.45rem 0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                color: "#6b7280",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                            }}
                            title="Descartar cambio"
                        >
                            ↩️
                        </button>
                    </div>
                )}
            </div>

            {/* Metadata */}
            {config.updatedAt && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#9ca3af" }}>
                    Última actualización: {new Date(config.updatedAt).toLocaleString()}
                    {config.updatedBy && ` por ${config.updatedBy}`}
                </div>
            )}
        </div>
    );
}