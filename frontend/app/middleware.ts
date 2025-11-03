import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const rol = req.cookies.get("rol")?.value;
    const { pathname } = req.nextUrl;

    // 🚫 Si intenta acceder al dashboard sin token → login
    if (!token && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // 🚫 Si técnico intenta acceder a admin
    if (rol === "ROLE_TECNICO" && pathname.startsWith("/dashboard/administrador")) {
        return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
    }

    // 🚫 Si admin intenta acceder a técnico
    if (rol === "ROLE_ADMIN" && pathname.startsWith("/dashboard/tecnico")) {
        return NextResponse.redirect(new URL("/dashboard/administrador", req.url));
    }

    // 🔒 Si ya tiene token e intenta ir al login
    if (token && pathname === "/") {
        if (rol === "ROLE_ADMIN")
            return NextResponse.redirect(new URL("/dashboard/administrador", req.url));
        if (rol === "ROLE_TECNICO")
            return NextResponse.redirect(new URL("/dashboard/tecnico", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
