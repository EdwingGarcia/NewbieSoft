import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "./styles/admin-dashboard.css";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const rol = cookieStore.get("rol")?.value;

  if (!token) {
    redirect("/");
  }

  if (rol !== "ROLE_ADMIN") {
    redirect("/dashboard/tecnico");
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">Newbie Data Control</h2>
        <nav>
          <ul>
            <li>
              <Link href="/dashboard/administrador">📊 Dashboard</Link>
            </li>
            <li>
              <Link href="/dashboard/administrador/roles">⚙️ Crear Rol</Link>
            </li>
            <li>
              <Link href="/dashboard/administrador/usuarios">👤 Crear Usuario</Link>
            </li>
            <li>
              <Link href="/dashboard/administrador/agendar">📅 Agendar Visita</Link>
            </li>
            <li>
              <Link href="/dashboard/administrador/historial">🕓 Historial</Link>
            </li>
            <li>
              <Link href="/dashboard/administrador/ajustes">⚒️ Ajustes</Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="main-content">
        <header className="admin-header">
          <div className="header-title">Administrador</div>
          <form action="/api/logout" method="POST">
            <button type="submit" className="logout-btn">
              Cerrar sesión
            </button>
          </form>
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
