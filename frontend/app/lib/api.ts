/**
 * URL BASE CENTRALIZADA
 * Lee la variable de entorno. Si no existe (ej. en desarrollo sin .env), usa localhost.
 */
export const API_BASE_URL = "";

/**
 * Helper genérico para hacer peticiones.
 * Úsalo para GET, DELETE, etc.
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    // Asegura que el endpoint empiece con '/'
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Combina la URL base con el endpoint
    const url = `${API_BASE_URL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error ${response.status}: ${errorBody || response.statusText}`);
    }

    // Intenta devolver JSON, si no hay contenido devuelve null
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
}

/**
 * Función POST tipada
 * Utiliza la URL centralizada y maneja el cuerpo JSON automáticamente.
 */
export async function post<T>(endpoint: string, body: unknown): Promise<T> {
    // 1. Construir la URL completa usando la variable centralizada
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;

    // 2. Realizar el fetch
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    // 3. Manejo de errores
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error en la solicitud");
    }

    // 4. Retornar JSON
    return response.json();
}