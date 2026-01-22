// lib/configurationService.ts

import { API_BASE_URL } from "../lib/api";

// ==================== TIPOS ====================

export type ValueType = "STRING" | "NUMBER" | "BOOLEAN" | "PASSWORD" | "URL" | "EMAIL";

export interface ConfigurationProperty {
    id: number;
    key: string;
    value: string | null;
    maskedValue: string;
    description: string;
    category: string;
    isSensitive: boolean;
    isEditable: boolean;
    valueType: ValueType;
    updatedAt: string;
    updatedBy: string;
}

export interface UpdateConfigurationDTO {
    id: number;
    value: string;
}

export interface BulkUpdateConfigurationDTO {
    configurations: UpdateConfigurationDTO[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    categories?: string[];
    total?: number;
    updatedCount?: number;
}

export type GroupedConfigurations = Record<string, ConfigurationProperty[]>;

// ==================== HELPERS ====================

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    const direct = localStorage.getItem("token") || localStorage.getItem("nb.auth.token");
    if (direct) return direct.replace(/^Bearer\s+/i, "").trim();

    try {
        const raw = localStorage.getItem("nb.auth");
        if (!raw) return null;
        const obj = JSON.parse(raw);
        const tk = obj?.token || obj?.accessToken || obj?.jwt || obj?.data?.token || obj?.data?.accessToken;
        if (!tk) return null;
        return String(tk).replace(/^Bearer\s+/i, "").trim();
    } catch {
        return null;
    }
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            // Limpiar tokens y redirigir
            localStorage.removeItem("token");
            localStorage.removeItem("nb.auth");
            localStorage.removeItem("nb.auth.token");
            window.location.href = "/";
            throw new Error("No autorizado");
        }

        const errorText = await response.text().catch(() => "");
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json();
}

// ==================== API SERVICE ====================

const CONFIGURATIONS_API = `${API_BASE_URL}/api/v1/configurations`;
// Definimos la ruta del endpoint de administración para el refresh
const ADMIN_API = `${API_BASE_URL}/api/v1/configurations/admin`;

export const configurationService = {
    /**
     * Obtiene todas las configuraciones agrupadas por categoría
     */
    async getAllGrouped(maskSensitive = true): Promise<ApiResponse<GroupedConfigurations>> {
        return fetchWithAuth<ApiResponse<GroupedConfigurations>>(
            `${CONFIGURATIONS_API}?maskSensitive=${maskSensitive}`
        );
    },

    /**
     * Obtiene todas las configuraciones como lista
     */
    async getAllList(maskSensitive = true): Promise<ApiResponse<ConfigurationProperty[]>> {
        return fetchWithAuth<ApiResponse<ConfigurationProperty[]>>(
            `${CONFIGURATIONS_API}/list?maskSensitive=${maskSensitive}`
        );
    },

    /**
     * Obtiene configuraciones por categoría
     */
    async getByCategory(category: string, maskSensitive = true): Promise<ApiResponse<ConfigurationProperty[]>> {
        return fetchWithAuth<ApiResponse<ConfigurationProperty[]>>(
            `${CONFIGURATIONS_API}/category/${encodeURIComponent(category)}?maskSensitive=${maskSensitive}`
        );
    },

    /**
     * Obtiene todas las categorías
     */
    async getCategories(): Promise<ApiResponse<string[]>> {
        return fetchWithAuth<ApiResponse<string[]>>(`${CONFIGURATIONS_API}/categories`);
    },

    /**
     * Obtiene una configuración por ID
     */
    async getById(id: number, maskSensitive = true): Promise<ApiResponse<ConfigurationProperty>> {
        return fetchWithAuth<ApiResponse<ConfigurationProperty>>(
            `${CONFIGURATIONS_API}/${id}?maskSensitive=${maskSensitive}`
        );
    },

    /**
     * Busca configuraciones
     */
    async search(query: string, maskSensitive = true): Promise<ApiResponse<ConfigurationProperty[]>> {
        return fetchWithAuth<ApiResponse<ConfigurationProperty[]>>(
            `${CONFIGURATIONS_API}/search?q=${encodeURIComponent(query)}&maskSensitive=${maskSensitive}`
        );
    },

    /**
     * MÉTODO NUEVO: Dispara el refresh en el backend
     * Se llama internamente después de un update exitoso.
     */
    async triggerRefresh(): Promise<void> {
        try {
            // No esperamos respuesta JSON porque a veces el refresh puede tardar o no devolver cuerpo
            // Lo importante es lanzar la petición POST
            await fetchWithAuth(`${ADMIN_API}/refresh`, { method: "POST" });
            console.log("✅ Contexto de Spring Boot refrescado correctamente.");
        } catch (error) {
            console.warn("⚠️ La configuración se guardó, pero hubo un problema al refrescar el contexto automáticamente:", error);
            // No lanzamos el error para no asustar al usuario, ya que el dato sí se guardó.
        }
    },

    /**
     * Actualiza una configuración individual y luego refresca el backend
     */
    async update(id: number, value: string): Promise<ApiResponse<ConfigurationProperty>> {
        // 1. Guardar en Base de Datos
        const response = await fetchWithAuth<ApiResponse<ConfigurationProperty>>(
            `${CONFIGURATIONS_API}/${id}`,
            {
                method: "PUT",
                body: JSON.stringify({ id, value }),
            }
        );

        // 2. Si el guardado fue exitoso, forzar el refresh
        if (response.success) {
            await this.triggerRefresh();
        }

        return response;
    },

    /**
     * Actualiza múltiples configuraciones y luego refresca el backend
     */
    async bulkUpdate(configurations: UpdateConfigurationDTO[]): Promise<ApiResponse<ConfigurationProperty[]>> {
        // 1. Guardar en Base de Datos
        const response = await fetchWithAuth<ApiResponse<ConfigurationProperty[]>>(
            `${CONFIGURATIONS_API}/bulk`,
            {
                method: "PUT",
                body: JSON.stringify({ configurations }),
            }
        );

        // 2. Si el guardado fue exitoso, forzar el refresh
        if (response.success) {
            await this.triggerRefresh();
        }

        return response;
    },
};

// ==================== METADATA ====================

export const CATEGORY_METADATA: Record<string, { icon: string; description: string; color: string }> = {
    "Aplicación": {
        icon: "⚙️",
        description: "Configuraciones generales de la aplicación",
        color: "#3b82f6",
    },
    "Base de Datos": {
        icon: "🗄️",
        description: "Conexión y configuración de PostgreSQL",
        color: "#10b981",
    },
    "Seguridad": {
        icon: "🔐",
        description: "JWT, tokens y autenticación",
        color: "#ef4444",
    },
    "Correo SMTP": {
        icon: "📧",
        description: "Configuración del servidor de correo",
        color: "#8b5cf6",
    },
    "Logging": {
        icon: "📋",
        description: "Niveles y configuración de logs",
        color: "#f59e0b",
    },
    "Archivos": {
        icon: "📁",
        description: "Uploads y gestión de archivos",
        color: "#6366f1",
    },
    "Servicios Externos": {
        icon: "🌐",
        description: "APIs y servicios de terceros",
        color: "#ec4899",
    },
    "Actuator": {
        icon: "📊",
        description: "Endpoints de monitoreo",
        color: "#64748b",
    },
};

export const VALUE_TYPE_CONFIG: Record<ValueType, { inputType: string; placeholder: string }> = {
    STRING: { inputType: "text", placeholder: "Ingrese un valor de texto" },
    NUMBER: { inputType: "number", placeholder: "Ingrese un valor numérico" },
    BOOLEAN: { inputType: "select", placeholder: "Seleccione verdadero o falso" },
    PASSWORD: { inputType: "password", placeholder: "••••••••" },
    URL: { inputType: "url", placeholder: "https://..." },
    EMAIL: { inputType: "email", placeholder: "correo@ejemplo.com" },
};

export default configurationService;