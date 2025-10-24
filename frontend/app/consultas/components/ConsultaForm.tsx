"use client";
import { useState } from "react";
import OTPModal from "./OTPModal";
import "../consultas.css";

export default function ConsultaForm() {
    const [cedula, setCedula] = useState("");
    const [correo, setCorreo] = useState("");
    const [tipoConsulta, setTipoConsulta] = useState("historial");
    const [procedimiento, setProcedimiento] = useState("");
    const [mostrarOTP, setMostrarOTP] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8080/api/otp/generar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cedula, correo }),
            });

            let data = null;
            try {
                data = await response.json(); // intenta parsear JSON
            } catch {
                console.warn("⚠️ Respuesta vacía o no JSON");
            }

            if (response.ok) {
                console.log("✅ OTP enviado correctamente", data);
                alert("OTP enviado al correo registrado");
                setMostrarOTP(true);
            } else {
                alert(data?.mensaje || "Error al generar OTP");
            }
        } catch (err) {
            console.error("❌ Error de conexión:", err);
            alert("No se pudo conectar con el servidor");
        }
    };


    return (
        <div className="consulta-wrapper">
            <div className="consulta-inner">
                <div className="consulta-header">
                    <h1>¿Quieres saber el estado de tu reparación?</h1>
                    <p>
                        Consulta aquí tu historial completo o verifica el avance de un
                        procedimiento activo ingresando tus datos.
                    </p>
                </div>

                <div className="consulta-container">
                    <form onSubmit={handleSubmit}>
                        <label>Cédula</label>
                        <input
                            type="text"
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            required
                        />

                        <label>Correo electrónico*</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />
                        <small>
                            *Debe tener acceso al correo electrónico registrado ya que es a
                            donde se enviará la información.
                        </small>

                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    checked={tipoConsulta === "historial"}
                                    onChange={() => setTipoConsulta("historial")}
                                />
                                Historial
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    checked={tipoConsulta === "procedimiento"}
                                    onChange={() => setTipoConsulta("procedimiento")}
                                />
                                Procedimiento
                            </label>
                        </div>

                        <label>N° de procedimiento</label>
                        <input
                            type="text"
                            value={procedimiento}
                            onChange={(e) => setProcedimiento(e.target.value)}
                        />

                        <button type="submit">Consultar</button>
                    </form>
                </div>
            </div>

            {mostrarOTP && <OTPModal onClose={() => setMostrarOTP(false)} />}
        </div>
    );
}
