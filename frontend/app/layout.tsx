import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
    title: "Newbie Data Control",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
            {/* AGREGADO: h-screen, w-screen, overflow-hidden */}
            <body className="h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}