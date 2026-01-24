"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    getConfig, 
    getConfigNumber, 
    getConfigBoolean, 
    setConfig,
    ConfigKey,
    loadBackendConfig,
    getBackendConfig,
    invalidateBackendConfigCache
} from "./config";

/**
 * Hook para leer y suscribirse a cambios de una configuración
 */
export function useConfig(key: ConfigKey): string {
    const [value, setValue] = useState(() => getConfig(key));

    useEffect(() => {
        // Leer valor inicial después de montar (para SSR)
        setValue(getConfig(key));

        // Escuchar cambios de storage (otras pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === `config.${key}`) {
                setValue(e.newValue ?? getConfig(key));
            }
        };

        // Escuchar eventos custom (misma pestaña)
        const handleConfigChange = (e: CustomEvent) => {
            if (e.detail?.key === key) {
                setValue(e.detail.value);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("frontendConfigChanged", handleConfigChange as EventListener);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("frontendConfigChanged", handleConfigChange as EventListener);
        };
    }, [key]);

    return value;
}

/**
 * Hook para configuración numérica
 */
export function useConfigNumber(key: ConfigKey): number {
    const value = useConfig(key);
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
}

/**
 * Hook para configuración booleana
 */
export function useConfigBoolean(key: ConfigKey): boolean {
    const value = useConfig(key);
    return value === "true" || value === "1";
}

/**
 * Hook para configuración con setter
 */
export function useConfigState(key: ConfigKey): [string, (value: string) => void] {
    const value = useConfig(key);
    
    const setValue = useCallback((newValue: string) => {
        setConfig(key, newValue);
    }, [key]);

    return [value, setValue];
}

/**
 * Hook para el nombre de la aplicación
 */
export function useAppName(): string {
    return useConfig("APP_NAME");
}

/**
 * Hook para el nombre de la empresa
 */
export function useCompanyName(): string {
    return useConfig("COMPANY_NAME");
}

/**
 * Hook para el estilo del sidebar
 */
export function useSidebarStyle(): "auto" | "expanded" | "collapsed" {
    const value = useConfig("SIDEBAR_STYLE");
    if (value === "expanded" || value === "collapsed") return value;
    return "auto";
}

/**
 * Hook para items por página (paginación)
 */
export function useItemsPerPage(): number {
    const value = useConfigNumber("ITEMS_PER_PAGE");
    return value > 0 ? value : 10;
}

/**
 * Hook para auto-refresh interval
 */
export function useAutoRefresh(callback: () => void, enabled: boolean = true): void {
    const interval = useConfigNumber("AUTO_REFRESH_INTERVAL");

    useEffect(() => {
        if (!enabled || interval <= 0) return;

        const intervalId = setInterval(callback, interval * 1000);
        return () => clearInterval(intervalId);
    }, [callback, interval, enabled]);
}

/**
 * Hook para cargar configuraciones del backend
 */
export function useBackendConfig() {
    const [loading, setLoading] = useState(true);
    const [config, setConfigState] = useState<Record<string, string | null>>({});

    const reload = useCallback(async () => {
        setLoading(true);
        invalidateBackendConfigCache();
        const cfg = await loadBackendConfig();
        setConfigState(cfg);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadBackendConfig().then((cfg) => {
            setConfigState(cfg);
            setLoading(false);
        });
    }, []);

    const get = useCallback((key: string): string | null => {
        return config[key] ?? getBackendConfig(key);
    }, [config]);

    return { loading, config, get, reload };
}

/**
 * Hook para monitor de sesión con timeout
 */
export function useSessionMonitor(onTimeout: () => void): void {
    const timeout = useConfigNumber("SESSION_TIMEOUT");

    useEffect(() => {
        if (timeout <= 0) return;

        const timeoutMs = timeout * 60 * 1000;
        let lastActivity = Date.now();
        let checkInterval: NodeJS.Timeout;

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
        checkInterval = setInterval(checkTimeout, 60000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
            clearInterval(checkInterval);
        };
    }, [timeout, onTimeout]);
}
