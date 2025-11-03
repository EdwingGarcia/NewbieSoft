import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.redirect(new URL("/", "http://localhost:3000"));

    // 🔒 Borrar cookies
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    response.cookies.set("rol", "", { maxAge: 0, path: "/" });

    return response;
}
