import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
    title: "Newbie Data Control",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>
                <NavBar />
                <main style={{ paddingTop: "64px" }}>{children}</main>
            </body>
        </html>
    );
}
