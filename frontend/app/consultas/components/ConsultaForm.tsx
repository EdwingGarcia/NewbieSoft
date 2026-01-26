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
    X,
    PenTool,
    DollarSign
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

    const handleSelectOrden = (orden: OrdenPublicaDto) => {
        setResultadoProc(orden);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

                                {/* Sección 5: Costos y Total */}
                                {resultadoProc.costos && resultadoProc.costos.length > 0 && (
                                    <div className="result-section">
                                        <div className="result-section-title" style={{ color: '#10b981' }}>
                                            <DollarSign size={14} /> Detalle de Costos ({resultadoProc.costos.length} items)
                                        </div>
                                        <div style={{
                                            backgroundColor: '#1f2937',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid #374151'
                                        }}>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                        <tr style={{ backgroundColor: '#374151' }}>
                                                            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9ca3af', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Descripción</th>
                                                            <th style={{ padding: '8px 10px', textAlign: 'center', color: '#9ca3af', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', width: '70px' }}>Tipo</th>
                                                            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9ca3af', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', width: '70px' }}>P.Unit</th>
                                                            <th style={{ padding: '8px 10px', textAlign: 'center', color: '#9ca3af', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', width: '40px' }}>Qty</th>
                                                            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9ca3af', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', width: '80px' }}>Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {resultadoProc.costos.map((costo, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #374151' }}>
                                                                <td style={{ padding: '8px 10px', color: '#e5e7eb', fontSize: '12px' }}>{costo.descripcion}</td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        backgroundColor: costo.tipo === 'SERVICIO' ? '#3b82f6' : '#8b5cf6',
                                                                        color: 'white',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '9px',
                                                                        fontWeight: 600
                                                                    }}>
                                                                        {costo.tipo === 'SERVICIO' ? 'SERV' : 'PROD'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#9ca3af', fontSize: '12px' }}>
                                                                    ${formatCurrency(costo.costoUnitario)}
                                                                </td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                                                                    {costo.cantidad}
                                                                </td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#e5e7eb', fontWeight: 500, fontSize: '12px' }}>
                                                                    ${formatCurrency(costo.subtotal)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                backgroundColor: '#10b981',
                                                borderTop: '2px solid #059669'
                                            }}>
                                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'white' }}>
                                                    TOTAL A PAGAR
                                                </span>
                                                <span style={{ fontWeight: 700, fontSize: '16px', color: 'white' }}>
                                                    ${formatCurrency(resultadoProc.totalCostos ?? 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* BOTÓN DE FIRMA DE RECIBO */}
                                {resultadoProc.estado && (resultadoProc.estado.toUpperCase().includes('CIERRE') || resultadoProc.estado.toUpperCase().includes('OTP')) && (
                                    <div className="result-section" style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '15px', marginTop: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <PenTool size={16} style={{ color: '#a78bfa' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db' }}>Firma de Recibo</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                                            El equipo está listo para ser entregado. Haz clic en el botón de abajo para firmar el recibo de conformidad.
                                        </p>
                                        <button
                                            onClick={() => {
                                                const ordenId = resultadoProc.numeroOrden?.split('-')[1] || '0';
                                                window.open(`/firma?ordenId=${ordenId}&modo=recibo`, '_blank');
                                            }}
                                            style={{
                                                background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 2px 8px 0 rgba(139,92,246,0.25)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#6d28d9')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)')}
                                        >
                                            <PenTool size={14} />
                                            Firmar Recibo de Entrega
                                        </button>
                                    </div>
                                )}

                                {/* Botón de descarga de documentos - Solo visible si OT está CERRADA */}
                                {resultadoProc.estado && resultadoProc.estado.toUpperCase().includes('CERRAD') && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                                        <button
                                            className="btn-download-docs"
                                            style={{
                                                background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '10px 22px',
                                                fontSize: 15,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                boxShadow: '0 2px 8px 0 rgba(139,92,246,0.25)',
                                                transition: 'background 0.2s',
                                            }}
                                            title="Descargar documentos de la OT"
                                            onClick={() => window.open(`http://localhost:8080/api/ordenes/${resultadoProc.numeroOrden}/documentos`, '_blank')}
                                            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16.5a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v10.5a1 1 0 0 1-1 1Z" /><path fill="currentColor" d="M7.21 13.79a1 1 0 0 1 1.42-1.42l2.29 2.3 2.29-2.3a1 1 0 1 1 1.42 1.42l-3 3a1 1 0 0 1-1.42 0l-3-3ZM5 20a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5Z" /></svg>
                                            Descargar Documentos
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === VISTA HISTORIAL === */}
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
                                                        {/* Botón solo visible si OT está CERRADA */}
                                                        {o.estado && o.estado.toUpperCase().includes('CERRAD') && (
                                                            <button
                                                                className="btn-download-docs"
                                                                style={{
                                                                    marginTop: 6,
                                                                    background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: 8,
                                                                    padding: '8px 18px',
                                                                    fontSize: 13,
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    boxShadow: '0 2px 8px 0 rgba(139,92,246,0.25)',
                                                                    transition: 'background 0.2s',
                                                                }}
                                                                title="Descargar documentos de la OT"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    window.open(`http://localhost:8080/api/ordenes/${o.numeroOrden}/documentos`, '_blank');
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)'}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16.5a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v10.5a1 1 0 0 1-1 1Z" /><path fill="currentColor" d="M7.21 13.79a1 1 0 0 1 1.42-1.42l2.29 2.3 2.29-2.3a1 1 0 1 1 1.42 1.42l-3 3a1 1 0 0 1-1.42 0l-3-3ZM5 20a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5Z" /></svg>
                                                                Descargar Documentos
                                                            </button>
                                                        )}
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

                {mostrarOTP && (
                    <OTPModal
                        cedula={cedula}
                        onClose={() => setMostrarOTP(false)}
                        onVerified={onVerified}
                        onVerify={handleVerify}
                    />
                )}
            </div>
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

function formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return "0.00";
    return value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}