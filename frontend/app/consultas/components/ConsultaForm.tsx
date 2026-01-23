"use client";
import { useMemo, useState, useRef } from "react";
import OTPModal from "./OTPModal";
import "../consultas.css";
import ReCAPTCHA from "react-google-recaptcha";
import { ConsultasAPI, OrdenPublicaDto } from "./api";
import {
    ClipboardList,
    Smartphone,
    Wrench,
    Calendar,
    AlertTriangle,
    X // ✅ Importamos el icono de cerrar
} from "lucide-react";

export default function ConsultaForm() {
    const [cedula, setCedula] = useState("");
    const [correo, setCorreo] = useState("");
    const [tipoConsulta, setTipoConsulta] = useState<"historial" | "procedimiento">("historial");
    const [procedimiento, setProcedimiento] = useState("");
    const [mostrarOTP, setMostrarOTP] = useState(false);

    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [consultaToken, setConsultaToken] = useState<string | null>(null);

    const [resultadoHistorial, setResultadoHistorial] = useState<OrdenPublicaDto[] | null>(null);
    const [resultadoProc, setResultadoProc] = useState<OrdenPublicaDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const canSubmit = useMemo(() => {
        if (!cedula.trim() || !correo.trim()) return false;
        if (tipoConsulta === "procedimiento" && !procedimiento.trim()) return false;
        if (!captchaToken) return false;
        return true;
    }, [cedula, correo, tipoConsulta, procedimiento, captchaToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResultadoHistorial(null);
        setResultadoProc(null);
        setConsultaToken(null);

        if (!captchaToken) {
            setError("Por favor, completa el captcha.");
            return;
        }

        setLoading(true);
        try {
            await ConsultasAPI.sendOtp({
                cedula: cedula.trim(),
                correo: correo.trim(),
                recaptchaToken: captchaToken
            });
            setMostrarOTP(true);
        } catch (err: any) {
            setError(err?.message || "No se pudo solicitar el OTP.");
            setCaptchaToken(null);
            recaptchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (codigo: string) => {
        return await ConsultasAPI.verifyOtp({ cedula: cedula.trim(), codigo });
    };

    const runConsulta = async (token: string) => {
        setLoading(true);
        setError(null);
        try {
            if (tipoConsulta === "historial") {
                const data = await ConsultasAPI.getHistorial({ consultaToken: token });
                setResultadoHistorial(data);
            } else {
                const data = await ConsultasAPI.getProcedimiento({
                    consultaToken: token,
                    numeroOrden: procedimiento.trim(),
                });
                setResultadoProc(data);
            }
        } catch (err: any) {
            setError(err?.message || "Error al consultar. Verifique los datos.");
        } finally {
            setLoading(false);
        }
    };

    const onVerified = (token: string) => {
        setConsultaToken(token);
        setMostrarOTP(false);
        runConsulta(token);
    };

    // ✅ FUNCIÓN 1: Seleccionar orden del historial (Doble Clic)
    const handleSelectOrden = (orden: OrdenPublicaDto) => {
        setResultadoProc(orden);
        // Hacemos scroll arriba suavemente para ver el detalle
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✅ FUNCIÓN 2: Cerrar detalle y volver al historial
    const handleCloseDetail = () => {
        setResultadoProc(null);
    };

    return (
        <div className="consulta-wrapper">
            <div className="consulta-inner">
                <div className="consulta-header">
                    <h1>¿Quieres saber el estado de tu reparación?</h1>
                    <p>Consulta tu historial completo o verifica el avance de un procedimiento activo.</p>
                </div>

                <div className="consulta-container">

                    {/* COLUMNA IZQUIERDA: FORMULARIO */}
                    <form onSubmit={handleSubmit}>
                        <label>Cédula</label>
                        <input value={cedula} onChange={(e) => setCedula(e.target.value)} required />

                        <label>Correo electrónico*</label>
                        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
                        <small>*Se enviará un código de verificación a este correo.</small>

                        <div className="radio-group">
                            <label>
                                <input type="radio" checked={tipoConsulta === "historial"} onChange={() => setTipoConsulta("historial")} />
                                Historial
                            </label>
                            <label>
                                <input type="radio" checked={tipoConsulta === "procedimiento"} onChange={() => setTipoConsulta("procedimiento")} />
                                Procedimiento
                            </label>
                        </div>

                        <label style={{ opacity: tipoConsulta !== "procedimiento" ? 0.5 : 1 }}>N° de procedimiento</label>
                        <input
                            value={procedimiento}
                            onChange={(e) => setProcedimiento(e.target.value)}
                            placeholder="Ej: OT-00012"
                            disabled={tipoConsulta !== "procedimiento"}
                            style={{ opacity: tipoConsulta !== "procedimiento" ? 0.5 : 1 }}
                        />

                        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                onChange={(token) => setCaptchaToken(token)}
                                theme="dark"
                            />
                        </div>

                        <button type="submit" disabled={!canSubmit || loading}>
                            {loading ? "Procesando..." : "Consultar"}
                        </button>
                    </form>

                    {/* COLUMNA DERECHA: RESULTADOS */}
                    <div className="consulta-results">
                        {error && <div className="consulta-error">{error}</div>}
                        {!error && loading && <div className="consulta-loading">Consultando información...</div>}

                        {/* === VISTA DETALLADA === */}
                        {resultadoProc && (
                            <div className="result-card">
                                {/* Encabezado */}
                                <div className="result-header-row">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <h3>{resultadoProc.numeroOrden}</h3>
                                        {/* Texto auxiliar si estamos navegando desde el historial */}
                                        {resultadoHistorial && (
                                            <span style={{ fontSize: 11, opacity: 0.5, marginTop: 4, fontWeight: 600 }}>
                                                VISTA DE DETALLE
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div className="status-badge-lg">
                                            {resultadoProc.estado.replace(/_/g, " ")}
                                        </div>

                                        {/* ✅ Botón de Cerrar (Solo aparece si tenemos historial o queremos limpiar) */}
                                        <button
                                            onClick={handleCloseDetail}
                                            className="btn-close-detail"
                                            title="Cerrar detalle y volver"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sección 1: Tiempos y Tipo */}
                                <div className="result-section">
                                    <div className="result-section-title"><Calendar size={14} /> Resumen</div>
                                    <div className="info-grid-3">
                                        <InfoBox label="Tipo Servicio" value={resultadoProc.tipoServicio} />
                                        <InfoBox label="Fecha Ingreso" value={fmt(resultadoProc.fechaHoraIngreso)} />
                                        <InfoBox label="Fecha Entrega" value={resultadoProc.fechaHoraEntrega ? fmt(resultadoProc.fechaHoraEntrega) : "Pendiente"} />
                                    </div>
                                </div>

                                {/* Sección 2: Equipo */}
                                <div className="result-section">
                                    <div className="result-section-title"><Smartphone size={14} /> Dispositivo</div>
                                    <div className="info-grid-2">
                                        <InfoBox label="Equipo" value={resultadoProc.equipo ? `${resultadoProc.equipo.marca} ${resultadoProc.equipo.modelo}` : "N/A"} />
                                        <InfoBox label="N° Serie" value={resultadoProc.equipo?.numeroSerie} />
                                    </div>
                                    {resultadoProc.accesorios && (
                                        <div className="text-box" style={{ fontSize: '13px', padding: '10px' }}>
                                            <span style={{ opacity: 0.6, display: 'block', marginBottom: 4, fontSize: 11 }}>Accesorios:</span>
                                            {resultadoProc.accesorios}
                                        </div>
                                    )}
                                </div>

                                {/* Sección 3: Reporte Inicial */}
                                <div className="result-section">
                                    <div className="result-section-title"><AlertTriangle size={14} /> Reporte Inicial</div>
                                    <div className="text-box">{resultadoProc.problemaReportado ?? "Sin detalle."}</div>
                                    {resultadoProc.observacionesIngreso && (
                                        <div className="text-box" style={{ marginTop: 8 }}>
                                            <span style={{ opacity: 0.6, display: 'block', marginBottom: 4, fontSize: 11 }}>Estado físico al ingreso:</span>
                                            {resultadoProc.observacionesIngreso}
                                        </div>
                                    )}
                                </div>

                                {/* Sección 4: Informe Técnico */}
                                {(resultadoProc.diagnosticoTrabajo || resultadoProc.observacionesRecomendaciones || resultadoProc.motivoCierre) && (
                                    <div className="result-section">
                                        <div className="result-section-title" style={{ color: '#a78bfa' }}><Wrench size={14} /> Informe Técnico</div>
                                        {resultadoProc.diagnosticoTrabajo && (
                                            <div className="text-box">
                                                <span style={{ opacity: 0.6, display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 'bold' }}>TRABAJO REALIZADO:</span>
                                                {resultadoProc.diagnosticoTrabajo}
                                            </div>
                                        )}
                                        {resultadoProc.observacionesRecomendaciones && (
                                            <div className="text-box">
                                                <span style={{ opacity: 0.6, display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 'bold' }}>RECOMENDACIONES:</span>
                                                {resultadoProc.observacionesRecomendaciones}
                                            </div>
                                        )}
                                        {resultadoProc.motivoCierre && (
                                            <div className="text-box danger">
                                                <span style={{ color: '#fca5a5', display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 'bold' }}>MOTIVO DE NO REPARACIÓN / CIERRE:</span>
                                                {resultadoProc.motivoCierre}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === VISTA HISTORIAL === */}
                        {/* ✅ OCULTAMOS el historial si hay una orden seleccionada (resultadoProc) */}
                        {resultadoHistorial && !resultadoProc && (
                            <div className="result-card">
                                <div className="result-header-row">
                                    <h3>Historial</h3>
                                    <span style={{ fontSize: 13, opacity: 0.7 }}>{resultadoHistorial.length} ordenes encontradas</span>
                                </div>
                                {resultadoHistorial.length === 0 ? (
                                    <div className="result-empty">No se encontraron órdenes asociadas.</div>
                                ) : (
                                    <div className="historial-scroll-container">
                                        <div className="historial-list">
                                            {resultadoHistorial.map((o) => (
                                                <div
                                                    key={o.numeroOrden}
                                                    className="result-item"
                                                    // ✅ EVENTO DOBLE CLIC
                                                    onDoubleClick={() => handleSelectOrden(o)}
                                                    title="Doble clic para ver detalles completos"
                                                >
                                                    <div className="result-item-left">
                                                        <div className="result-ord" style={{ fontSize: 16 }}>{o.numeroOrden}</div>
                                                        <div className="result-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <ClipboardList size={12} />
                                                            {o.equipo ? `${o.equipo.marca} ${o.equipo.modelo}` : (o.tipoServicio ?? "SERVICIO")}
                                                        </div>
                                                    </div>
                                                    <div className="result-item-right" style={{ textAlign: 'right' }}>
                                                        <div className="badge" style={{ fontSize: 11 }}>{o.estado}</div>
                                                        <div className="result-date">{fmtDateOnly(o.fechaHoraIngreso)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

// Componente pequeño para cajas de info
const InfoBox = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="info-box">
        <span className="info-label">{label}</span>
        <span className="info-value">{value ?? "-"}</span>
    </div>
);

function fmt(value?: string | null) {
    if (!value) return "-";
    try {
        return new Date(value).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
    } catch { return value; }
}

function fmtDateOnly(value?: string | null) {
    if (!value) return "-";
    try {
        return new Date(value).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return value; }
}