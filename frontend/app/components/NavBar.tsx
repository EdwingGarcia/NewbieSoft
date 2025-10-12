"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../styles/navbar.css";

export default function NavBar() {
    const pathname = usePathname();

    return (
        <header className="navbar">
            <div className="navbar-title">Newbie Data Control</div>
            <nav className="navbar-links">
                <Link
                    href="/"
                    className={`navbar-link ${pathname === "/" ? "active" : ""}`}
                >
                    Inicio
                </Link>
                <Link
                    href="/consultas"
                    className={`navbar-link ${
                        pathname === "/consultas" ? "active" : ""
                    }`}
                >
                    Consultas
                </Link>
            </nav>
        </header>
    );
}
