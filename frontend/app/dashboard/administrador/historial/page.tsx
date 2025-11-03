export default function HistorialPage() {
    return (
        <div>
            <h1>🕓 Historial</h1>
            <p>Consulta el historial de citas y actividades.</p>

            <table style={{ marginTop: "2rem", width: "100%", borderCollapse: "collapse" }}>
                <thead>
                <tr style={{ background: "#1a1e40", color: "#fff" }}>
                    <th>Fecha</th>
                    <th>Técnico</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>2025-11-01</td>
                    <td>Juan Pérez</td>
                    <td>Cliente A</td>
                    <td>Completado</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}
