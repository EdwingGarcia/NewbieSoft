export default function TecnicoDashboardPage() {
    return (
        <div style={{ padding: "2rem" }}>
            <h1>🛠️ Panel Técnico</h1>
            <p>Bienvenido, técnico. Aquí verás tus citas y reportes asignados.</p>

            <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
                <div className="card">Citas asignadas: —</div>
                <div className="card">Casos completados: —</div>
            </div>
        </div>
    );
}
