"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import NavBar from "./components/NavBar";

export default function ClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Lógica para mostrar Navbar
    const showNavbar = pathname === "/" || pathname.startsWith("/consultas");

    return (
        // CONTENEDOR PRINCIPAL: Asegura que nada se salga del ancho de pantalla
        <div className="flex flex-col min-h-screen w-full overflow-x-hidden bg-background">

            {showNavbar && (
                // Navbar fija arriba, con z-index para estar sobre el contenido
                <div className="fixed top-0 left-0 w-full z-50">
                    <NavBar />
                </div>
            )}

            {/* main:
               - flex-1: Ocupa el espacio restante verticalmente.
               - w-full: Asegura que no sea más ancho que la pantalla.
               - pt-[64px]: Espacio reservado SOLO si hay Navbar.
            */}
            <main className={`flex-1 w-full ${showNavbar ? "pt-[64px]" : ""}`}>
                {children}
            </main>

        </div>
    );
}