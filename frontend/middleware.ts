import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const rol = request.cookies.get("rol")?.value;

    const url = request.nextUrl.pathname;

    // Si NO hay token → login
    if (!token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Rutas exclusivas del admin
    if (url.startsWith("/dashboard") && !url.startsWith("/dashboard-tecnico")) {
        if (rol !== "ROLE_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard-tecnico", request.url));
        }
    }

    // Rutas exclusivas del técnico
    if (url.startsWith("/dashboard-tecnico")) {
        if (rol !== "ROLE_TECNICO") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/dashboard-tecnico/:path*",
        "/usuarios/:path*",
        "/ordenes/:path*"
    ],
};
