"use client";

/**
 * Guarda en localStorage los datos esenciales de la sesión.
 * (Ahora mismo no la usamos, pero luego podemos llamar saveSession(data)
 *  en el login para centralizar la lógica.)
 */
export function saveSession(data: any) {
  if (typeof window === "undefined") return;

  localStorage.setItem("token", data.token);
  localStorage.setItem("rol", data.rol);
  localStorage.setItem("cedula", data.cedula);
}

/**
 * Obtiene el token JWT guardado en localStorage.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Obtiene el rol del usuario (por ejemplo: ROLE_ADMIN, ROLE_TECNICO).
 */
export function getRol(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rol");
}

/**
 * Obtiene la cédula del usuario autenticado.
 */
export function getCedula(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cedula");
}

/**
 * Limpia completamente la sesión del usuario.
 * La usaremos para el botón "Cerrar sesión" más adelante.
 */
export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  localStorage.removeItem("cedula");
}

/**
 * Devuelve true si el usuario actual es ADMIN.
 */
export function isAdmin(): boolean {
  return getRol() === "ROLE_ADMIN";
}

/**
 * Devuelve true si el usuario actual es TÉCNICO.
 * OJO: ajusta el texto según el rol real que uses en tu backend.
 * Ejemplo: "ROLE_TECNICO" o "ROLE_USER".
 */
export function isTecnico(): boolean {
  return getRol() === "ROLE_TECNICO"; // cámbialo si tu rol se llama distinto
}
