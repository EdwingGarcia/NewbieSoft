export default function CrearRolPage() {
    return (
        <div>
            <h1>⚙️ Crear Rol</h1>
            <p>Define nuevos roles para los usuarios del sistema.</p>

            <form
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    maxWidth: "400px",
                    marginTop: "2rem",
                }}
            >
                <input type="text" placeholder="Nombre del rol" />
                <textarea placeholder="Descripción del rol"></textarea>
                <button type="submit">Guardar Rol</button>
            </form>
        </div>
    );
}
