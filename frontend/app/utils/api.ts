import Router from "next/router";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * 🔒 Obtiene token desde localStorage
 */
function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 🧩 Función genérica para peticiones HTTP
 */
async function request(
  method: string,
  endpoint: string,
  body?: any
) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // ⚠️ Manejo de errores comunes
    if (res.status === 401 || res.status === 403) {
      console.warn("Sesión expirada o sin permisos. Redirigiendo al login...");
      localStorage.removeItem("token");
      localStorage.removeItem("rol");
      Router.push("/");
      return null;
    }

    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (err) {
    console.error("❌ Error en request:", err);
    return null;
  }
}

// 🧱 Métodos específicos
export const apiGet = (endpoint: string) => request("GET", endpoint);
export const apiPost = (endpoint: string, body: any) => request("POST", endpoint, body);
export const apiPut = (endpoint: string, body: any) => request("PUT", endpoint, body);
export const apiDelete = (endpoint: string) => request("DELETE", endpoint);
