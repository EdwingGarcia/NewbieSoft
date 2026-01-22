import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import NavBar from "./components/NavBar";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
    title: "Newbie Data Control",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
            <body>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
