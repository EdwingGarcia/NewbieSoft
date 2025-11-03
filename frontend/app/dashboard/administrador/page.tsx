export default function AdminDashboardPage() {
    return (
        <div>
            <h1>📊 Panel de Administración</h1>
            <p>Bienvenido, administrador. Aquí podrás visualizar el estado general del sistema.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "2rem" }}>
                <div className="card">Reparaciones realizadas: —</div>
                <div className="card">Citas pendientes: —</div>
                <div className="card">Técnicos activos: —</div>
            </div>
        </div>
    );
}
