import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 👇 ESTA ES LA FUNCIÓN NUEVA QUE NECESITAS AGREGAR
export function getAuthImageUrl(path: string | undefined | null): string {
  if (!path) return "/placeholder.png";

  // Si ya es una URL completa externa, devolverla tal cual
  if (path.startsWith("http") && !path.includes("localhost")) return path;

  // Usa la variable de entorno o localhost por defecto
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Limpiar el path para asegurar que empiece con /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Obtener el token del almacenamiento local (si estamos en el cliente)
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token") || "";
  }

  // Retornar la URL firmada con el token
  return `${baseUrl}${cleanPath}?token=${token}`;
}