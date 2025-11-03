export default function CrearUsuarioPage() {
    return (
        <div>
            <h1>👤 Crear Usuario</h1>
            <p>Aquí podrás registrar nuevos usuarios del sistema.</p>

            <form
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    maxWidth: "400px",
                    marginTop: "2rem",
                }}
            >
                <input type="text" placeholder="Nombre completo" />
                <input type="email" placeholder="Correo electrónico" />
                <select>
                    <option value="">Selecciona rol...</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="TECNICO">Técnico</option>
                </select>
                <input type="password" placeholder="Contraseña" />
                <button type="submit">Guardar</button>
            </form>
        </div>
    );
}
