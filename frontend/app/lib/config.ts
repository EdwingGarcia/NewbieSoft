"use client";

/**
 * Sistema de Configuración Centralizado
 * Maneja configuraciones del Frontend (localStorage) y Backend (API)
 */

import { API_BASE_URL } from "./api";

/* =========================
   Tipos
========================= */
export type ConfigKey =
    | "RECAPTCHA_SITE_KEY"
    | "API_BASE_URL"
    | "APP_NAME"
    | "COMPANY_NAME"
    | "SIDEBAR_STYLE"
    | "DATE_FORMAT"
    | "ITEMS_PER_PAGE"
    | "NOTIFY_NEW_CITA"
    | "NOTIFY_SOUND"
    | "SESSION_TIMEOUT"
    | "AUTO_REFRESH_INTERVAL";

export interface ConfigDefinition {
    key: ConfigKey;
    defaultValue: string;
    type: "string" | "number" | "boolean";
}

/* =========================
   Configuraciones por defecto
========================= */
const CONFIG_DEFAULTS: Record<ConfigKey, ConfigDefinition> = {
    RECAPTCHA_SITE_KEY: {
        key: "RECAPTCHA_SITE_KEY",
        defaultValue: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
        type: "string",
    },
    API_BASE_URL: {
        key: "API_BASE_URL",
        defaultValue: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
        type: "string",
    },
    APP_NAME: {
        key: "APP_NAME",
        defaultValue: "Newbie Data Control",
        type: "string",
    },
    COMPANY_NAME: {
        key: "COMPANY_NAME",
        defaultValue: "Newbie Soft",
        type: "string",
    },
    SIDEBAR_STYLE: {
        key: "SIDEBAR_STYLE",
        defaultValue: "auto",
        type: "string",
    },
    DATE_FORMAT: {
        key: "DATE_FORMAT",
        defaultValue: "DD/MM/YYYY",
        type: "string",
    },
    ITEMS_PER_PAGE: {
        key: "ITEMS_PER_PAGE",
        defaultValue: "10",
        type: "number",
    },
    NOTIFY_NEW_CITA: {
        key: "NOTIFY_NEW_CITA",
        defaultValue: "true",
        type: "boolean",
    },
    NOTIFY_SOUND: {
        key: "NOTIFY_SOUND",
        defaultValue: "false",
        type: "boolean",
    },
    SESSION_TIMEOUT: {
        key: "SESSION_TIMEOUT",
        defaultValue: "30",
        type: "number",
    },
    AUTO_REFRESH_INTERVAL: {
        key: "AUTO_REFRESH_INTERVAL",
        defaultValue: "60",
        type: "number",
    },
};

/* =========================
   Funciones de lectura
========================= */

/**
 * Lee una configuración del localStorage
 */
export function getConfig(key: ConfigKey): string {
    if (typeof window === "undefined") {
        return CONFIG_DEFAULTS[key]?.defaultValue || "";
    }
    const stored = localStorage.getItem(`config.${key}`);
    return stored ?? CONFIG_DEFAULTS[key]?.defaultValue ?? "";
}

/**
 * Lee configuración como número
 */
export function getConfigNumber(key: ConfigKey): number {
    const value = getConfig(key);
    const num = parseInt(value, 10);
    return isNaN(num) ? parseInt(CONFIG_DEFAULTS[key]?.defaultValue || "0", 10) : num;
}

/**
 * Lee configuración como booleano
 */
export function getConfigBoolean(key: ConfigKey): boolean {
    const value = getConfig(key);
    return value === "true" || value === "1";
}

/**
 * Guarda una configuración en localStorage y dispara evento
 */
export function setConfig(key: ConfigKey, value: string): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(`config.${key}`, value);

    // Disparar evento para que otros componentes se actualicen
    window.dispatchEvent(new CustomEvent("frontendConfigChanged", {
        detail: { key, value }
    }));
}

/* =========================
   Formateo de fechas
========================= */

/**
 * Formatea una fecha según la configuración DATE_FORMAT
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "-";

    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";

    const format = getConfig("DATE_FORMAT");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    switch (format) {
        case "MM/DD/YYYY":
            return `${month}/${day}/${year}`;
        case "YYYY-MM-DD":
            return `${year}-${month}-${day}`;
        case "DD/MM/YYYY":
        default:
            return `${day}/${month}/${year}`;
    }
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "-";

    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";

    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${dateStr} ${hours}:${minutes}`;
}

/* =========================
   Paginación
========================= */

/**
 * Obtiene el número de items por página configurado
 */
export function getItemsPerPage(): number {
    return getConfigNumber("ITEMS_PER_PAGE") || 10;
}

/* =========================
   Notificaciones
========================= */

/**
 * Muestra una notificación del navegador si está habilitado
 */
export function showNotification(title: string, body: string, options?: NotificationOptions): void {
    if (typeof window === "undefined") return;
    if (!getConfigBoolean("NOTIFY_NEW_CITA")) return;

    // Verificar permisos
    if (Notification.permission === "granted") {
        const notification = new Notification(title, { body, ...options });

        // Reproducir sonido si está habilitado
        if (getConfigBoolean("NOTIFY_SOUND")) {
            playNotificationSound();
        }

        return;
    }

    if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification(title, { body, ...options });
                if (getConfigBoolean("NOTIFY_SOUND")) {
                    playNotificationSound();
                }
            }
        });
    }
}

/**
 * Reproduce un sonido de notificación
 */
function playNotificationSound(): void {
    try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
            // Ignorar errores de autoplay
        });
    } catch {
        // Ignorar si no se puede reproducir
    }
}

/* =========================
   Sesión
========================= */

let sessionTimeoutId: NodeJS.Timeout | null = null;
let lastActivity = Date.now();

/**
 * Inicia el monitor de inactividad de sesión
 */
export function startSessionMonitor(onTimeout: () => void): void {
    if (typeof window === "undefined") return;

    const timeoutMinutes = getConfigNumber("SESSION_TIMEOUT");
    if (timeoutMinutes <= 0) return; // Deshabilitado

    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
        lastActivity = Date.now();
    };

    const checkTimeout = () => {
        const elapsed = Date.now() - lastActivity;
        if (elapsed >= timeoutMs) {
            onTimeout();
        }
    };

    // Eventos de actividad
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => {
        document.addEventListener(event, resetTimer, { passive: true });
    });

    // Verificar cada minuto
    sessionTimeoutId = setInterval(checkTimeout, 60000);
}

/**
 * Detiene el monitor de sesión
 */
export function stopSessionMonitor(): void {
    if (sessionTimeoutId) {
        clearInterval(sessionTimeoutId);
        sessionTimeoutId = null;
    }
}

/* =========================
   Auto-refresh
========================= */

/**
 * Crea un intervalo de auto-refresh
 * @returns función para detener el intervalo
 */
export function createAutoRefresh(callback: () => void): () => void {
    const intervalSeconds = getConfigNumber("AUTO_REFRESH_INTERVAL");

    if (intervalSeconds <= 0) {
        return () => { }; // Deshabilitado
    }

    const intervalId = setInterval(callback, intervalSeconds * 1000);

    return () => clearInterval(intervalId);
}

/* =========================
   Backend Config Cache
========================= */

interface BackendConfig {
    [key: string]: string | null;
}

let backendConfigCache: BackendConfig | null = null;
let backendConfigLastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene el token de autenticación
 */
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

/**
 * Carga configuraciones del backend
 */
export async function loadBackendConfig(): Promise<BackendConfig> {
    const now = Date.now();

    // Usar caché si es reciente
    if (backendConfigCache && (now - backendConfigLastFetch) < CACHE_DURATION) {
        return backendConfigCache;
    }

    const token = getAuthToken();
    if (!token) {
        return {};
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/configurations?maskSensitive=true`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            return backendConfigCache || {};
        }

        const json = await res.json();

        if (json.success && json.data) {
            // Aplanar todas las configuraciones en un objeto
            const flatConfig: BackendConfig = {};
            Object.values(json.data).forEach((configs: any) => {
                if (Array.isArray(configs)) {
                    configs.forEach((cfg: any) => {
                        flatConfig[cfg.key] = cfg.value;
                    });
                }
            });

            backendConfigCache = flatConfig;
            backendConfigLastFetch = now;
            return flatConfig;
        }

        return {};
    } catch {
        return backendConfigCache || {};
    }
}

/**
 * Obtiene una configuración del backend (desde caché)
 */
export function getBackendConfig(key: string): string | null {
    return backendConfigCache?.[key] ?? null;
}

/**
 * Invalida el caché de configuraciones del backend
 */
export function invalidateBackendConfigCache(): void {
    backendConfigCache = null;
    backendConfigLastFetch = 0;
}

/* =========================
   Export de constantes
========================= */
export { CONFIG_DEFAULTS };
