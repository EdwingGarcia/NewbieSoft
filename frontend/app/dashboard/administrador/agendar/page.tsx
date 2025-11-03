export default function AgendarVisitaPage() {
    return (
        <div>
            <h1>📅 Agendar Visita</h1>
            <p>Selecciona el cliente y el técnico para crear una nueva cita.</p>

            <form
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    maxWidth: "400px",
                    marginTop: "2rem",
                }}
            >
                <input type="text" placeholder="Cliente" />
                <input type="text" placeholder="Técnico asignado" />
                <input type="date" />
                <input type="time" />
                <textarea placeholder="Observaciones"></textarea>
                <button type="submit">Agendar</button>
            </form>
        </div>
    );
}
