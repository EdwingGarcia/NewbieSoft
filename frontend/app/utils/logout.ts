export function logout() {
    // Borrar cookies
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "rol=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "cedula=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Opcional: borrar localStorage si aún guardas algo ahí
    localStorage.clear();
}
