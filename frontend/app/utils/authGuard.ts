import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth(requiredRole: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const rol = cookieStore.get("rol")?.value;

    if (!token) redirect("/");

    if (rol !== requiredRole) {
        if (requiredRole === "ROLE_ADMIN") redirect("/dashboard/tecnico");
        else redirect("/dashboard/administrador");
    }
}
