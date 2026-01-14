// components/consultas/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type OtpSendReq = {
    cedula: string;
    correo: string;
    recaptchaToken?: string; // Agregado para soportar el Captcha
};
export type OtpSendRes = { ok: boolean; message?: string };

export type OtpVerifyReq = { cedula: string; codigo: string };
export type OtpVerifyRes = {
    ok: boolean;
    message?: string;
    consultaToken?: string;
    expiresInSeconds?: number;
};

export type HistorialReq = { consultaToken: string };
export type ProcedimientoReq = { consultaToken: string; numeroOrden: string };

export type OrdenPublicaDto = {
    numeroOrden: string;
    estado: string;
    tipoServicio?: string;
    prioridad?: string;
    fechaHoraIngreso?: string;
    fechaHoraEntrega?: string | null;
    problemaReportado?: string;
};

async function postJSON<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const msg = data?.message || data?.mensaje || `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return data as T;
}

export const ConsultasAPI = {
    sendOtp: (req: OtpSendReq) =>
        postJSON<{ ok: boolean; message: string }>("/api/public/consultas/otp", req),

    verifyOtp: (req: OtpVerifyReq) =>
        postJSON<OtpVerifyRes>("/api/public/consultas/otp/validar", req),

    historial: (req: HistorialReq) =>
        postJSON<OrdenPublicaDto[]>("/api/public/consultas/historial", req),

    procedimiento: (req: ProcedimientoReq) =>
        postJSON<OrdenPublicaDto>("/api/public/consultas/procedimiento", req),
};