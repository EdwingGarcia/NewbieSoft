"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import NavBar from "./components/NavBar";

export default function ClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const showNavbar = pathname === "/" || pathname.startsWith("/consultas");

    return (
        <>
            {showNavbar && <NavBar />}
            <main style={{ paddingTop: showNavbar ? "64px" : "0" }}>{children}</main>
        </>
    );
}
