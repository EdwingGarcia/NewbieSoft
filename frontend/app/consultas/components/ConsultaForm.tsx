"use client";
import { useMemo, useState, useRef } from "react";
import OTPModal from "./OTPModal";
import "../consultas.css";
// 1. Importar ReCAPTCHA
import ReCAPTCHA from "react-google-recaptcha";

import { ConsultasAPI, OrdenPublicaDto } from "./api";

export default function ConsultaForm() {
    const [cedula, setCedula] = useState("");
    const [correo, setCorreo] = useState("");
    const [tipoConsulta, setTipoConsulta] = useState<"historial" | "procedimiento">("historial");
    const [procedimiento, setProcedimiento] = useState("");
    const [mostrarOTP, setMostrarOTP] = useState(false);

    const [loading, setLoading] = useState(false);
    const [consultaToken, setConsultaToken] = useState<string | null>(null);

    const [resultadoHistorial, setResultadoHistorial] = useState<OrdenPublicaDto[] | null>(null);
    const [resultadoProc, setResultadoProc] = useState<OrdenPublicaDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 2. Estado para el token del Captcha
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    // Referencia para resetear el captcha si falla la solicitud
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const canSubmit = useMemo(() => {
        if (!cedula.trim() || !correo.trim()) return false;
        if (tipoConsulta === "procedimiento" && !procedimiento.trim()) return false;
        // 3. Validar que exista el token del captcha para habilitar el botón
        if (!captchaToken) return false;
        return true;
    }, [cedula, correo, tipoConsulta, procedimiento, captchaToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResultadoHistorial(null);
        setResultadoProc(null);
        setConsultaToken(null);

        // Validación extra de seguridad
        if (!captchaToken) {
            setError("Por favor, completa el captcha.");
            return;
        }

        setLoading(true);
        try {
            // 4. Enviamos el token junto con la cédula y el correo
            // Nota: Debes actualizar la definición de sendOtp en api.ts
            await ConsultasAPI.sendOtp({
                cedula: cedula.trim(),
                correo: correo.trim(),
                recaptchaToken: captchaToken
            });
            setMostrarOTP(true);
        } catch (err: any) {
            setError(err?.message || "No se pudo solicitar el OTP.");
            // Si falla, reseteamos el captcha para que el usuario intente de nuevo
            setCaptchaToken(null);
            recaptchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (codigo: string) => {
        const res = await ConsultasAPI.verifyOtp({ cedula: cedula.trim(), codigo });
        return res;
    };

    const runConsulta = async (token: string) => {
        setLoading(true);
        setError(null);
        try {
            if (tipoConsulta === "historial") {
                const data = await ConsultasAPI.historial({ consultaToken: token });
                setResultadoHistorial(data);
            } else {
                const data = await ConsultasAPI.procedimiento({
                    consultaToken: token,
                    numeroOrden: procedimiento.trim(),
                });
                setResultadoProc(data);
            }
        } catch (err: any) {
            setError(err?.message || "Error al consultar.");
        } finally {
            setLoading(false);
        }
    };

    const onVerified = (token: string) => {
        setConsultaToken(token);
        setMostrarOTP(false);
        runConsulta(token);
    };

    return (
        <div className="consulta-wrapper">
            <div className="consulta-inner">
                <div className="consulta-header">
                    <h1>¿Quieres saber el estado de tu reparación?</h1>
                    <p>
                        Consulta tu historial completo o verifica el avance de un procedimiento activo ingresando tus datos.
                    </p>
                </div>

                <div className="consulta-container">
                    <form onSubmit={handleSubmit}>
                        <label>Cédula</label>
                        <input value={cedula} onChange={(e) => setCedula(e.target.value)} required />

                        <label>Correo electrónico*</label>
                        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />

                        <small>
                            *Debe tener acceso al correo electrónico registrado ya que es a donde se enviará la información.
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
                            value={procedimiento}
                            onChange={(e) => setProcedimiento(e.target.value)}
                            placeholder="Ej: OT-00012"
                            disabled={tipoConsulta !== "procedimiento"}
                        />

                        {/* 5. Componente visual del Captcha */}
                        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                // Usa una variable de entorno o tu clave pública de pruebas
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeSskosAAAAAO8GxgSqZIeFblYsCPFbBkZBN9vs"}
                                onChange={(token) => setCaptchaToken(token)}
                            />
                        </div>

                        <button type="submit" disabled={!canSubmit || loading}>
                            {loading ? "Enviando OTP..." : "Consultar"}
                        </button>
                    </form>

                    {/* Resultados */}
                    <div className="consulta-results">
                        {error && <div className="consulta-error">{error}</div>}

                        {!error && loading && <div className="consulta-loading">Cargando...</div>}

                        {resultadoProc && (
                            <div className="result-card">
                                <div className="result-top">
                                    <div className="badge">{resultadoProc.estado}</div>
                                    <h3>{resultadoProc.numeroOrden}</h3>
                                </div>
                                <div className="result-grid">
                                    <div><span>Servicio</span>{resultadoProc.tipoServicio ?? "-"}</div>
                                    <div><span>Prioridad</span>{resultadoProc.prioridad ?? "-"}</div>
                                    <div><span>Ingreso</span>{fmt(resultadoProc.fechaHoraIngreso)}</div>
                                    <div><span>Entrega</span>{fmt(resultadoProc.fechaHoraEntrega)}</div>
                                </div>
                                <div className="result-note">
                                    <span>Problema</span>
                                    <p>{resultadoProc.problemaReportado ?? "-"}</p>
                                </div>
                            </div>
                        )}

                        {resultadoHistorial && (
                            <div className="result-list">
                                <h3>Historial</h3>
                                {resultadoHistorial.length === 0 ? (
                                    <div className="result-empty">No se encontraron órdenes para esta cédula.</div>
                                ) : (
                                    resultadoHistorial.map((o) => (
                                        <div key={o.numeroOrden} className="result-item">
                                            <div className="result-item-left">
                                                <div className="result-ord">{o.numeroOrden}</div>
                                                <div className="result-sub">{o.tipoServicio ?? "SERVICIO"}</div>
                                            </div>
                                            <div className="result-item-right">
                                                <div className="badge">{o.estado}</div>
                                                <div className="result-date">{fmt(o.fechaHoraIngreso)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {consultaToken && (
                            <div className="token-hint">
                                Token activo (demo): <code>{consultaToken.slice(0, 10)}...</code>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {mostrarOTP && (
                <OTPModal
                    cedula={cedula}
                    onClose={() => setMostrarOTP(false)}
                    onVerified={onVerified}
                    onVerify={handleVerify}
                />
            )}
        </div>
    );
}

function fmt(value?: string | null) {
    if (!value) return "-";
    try {
        const d = new Date(value);
        return d.toLocaleString();
    } catch {
        return value;
    }
}