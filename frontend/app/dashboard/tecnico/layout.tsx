import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const rol = cookieStore.get("rol")?.value;

    if (!token) redirect("/");
    if (rol !== "ROLE_TECNICO") redirect("/dashboard/administrador");

    return (
        <html lang="es">
        <body>
        <div className="tecnico-layout">
            <aside className="sidebar">
                <h2 className="sidebar-title">Panel Técnico</h2>
                <nav>
                    <ul>
                        <li><Link href="/dashboard/tecnico">🛠️ Dashboard</Link></li>
                        <li><Link href="/dashboard/tecnico/citas">📅 Mis Citas</Link></li>
                        <li><Link href="/dashboard/tecnico/reportes">📋 Reportes</Link></li>
                    </ul>
                </nav>
            </aside>

            <div className="main-content">
                <header className="tecnico-header">
                    <div className="header-title">Técnico</div>
                    <form action="/api/logout" method="POST">
                        <button type="submit" className="logout-btn">Cerrar sesión</button>
                    </form>
                </header>

                <main className="content-area">{children}</main>
            </div>
        </div>
        </body>
        </html>
    );
}
