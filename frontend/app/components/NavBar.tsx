"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "../styles/navbar.css";

function hasToken() {
    try {
        const raw = localStorage.getItem("nb.auth");
        if (raw) {
            const p = JSON.parse(raw);
            if (p?.token) return true;
        }
    } catch { }
    return !!(localStorage.getItem("nb.auth.token") || localStorage.getItem("token"));
}

export default function NavBar() {
    const pathname = usePathname();
    const [logged, setLogged] = useState<boolean>(false);

    useEffect(() => {
        setLogged(hasToken());
        const onStorage = () => setLogged(hasToken());
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return (
        <header className="navbar">
            <div className="navbar-title">Newbie Data Control</div>
            <nav className="navbar-links">
                <Link href="/" className={`navbar-link ${pathname === "/" ? "active" : ""}`}>Inicio</Link>
                <Link href="/consultas" className={`navbar-link ${pathname === "/consultas" ? "active" : ""}`}>Consultas</Link>
                {logged && (
                    <Link
                        href="/dashboard/xml-prueba"
                        className={`navbar-link ${pathname === "/dashboard/xml-prueba" ? "active" : ""}`}
                    >
                        Prueba XML
                    </Link>
                )}
            </nav>
        </header>
    );
}
