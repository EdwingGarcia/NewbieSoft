// src/lib/api.ts (o donde tengas tu archivo api.ts)
import { API_BASE_URL } from "@/app/lib/api";

export type OtpSendReq = {
    cedula: string;
    correo: string;
    recaptchaToken?: string;
};

export type OtpVerifyReq = { cedula: string; codigo: string };
export type OtpVerifyRes = {
    ok: boolean;
    message?: string;
    consultaToken?: string;
};

export type HistorialReq = { consultaToken: string };
export type ProcedimientoReq = { consultaToken: string; numeroOrden: string };

// ✅ Nuevo DTO de Equipo
export type EquipoDto = {
    id?: number;
    numeroSerie?: string;
    modelo?: string;
    marca?: string;
};

// ✅ DTO para cada item de costo
export type CostoItemDto = {
    tipo: string;           // PRODUCTO | SERVICIO
    descripcion: string;
    costoUnitario: number;
    cantidad: number;
    subtotal: number;
};

// ✅ DTO Actualizado con toda la info nueva incluyendo costos
export type OrdenPublicaDto = {
    numeroOrden: string;
    estado: string;
    tipoServicio?: string;
    fechaHoraIngreso?: string;
    fechaHoraEntrega?: string | null;

    // Objetos y detalles nuevos
    equipo?: EquipoDto;
    accesorios?: string;
    problemaReportado?: string;
    observacionesIngreso?: string;

    // Resultados técnicos
    diagnosticoTrabajo?: string;
    observacionesRecomendaciones?: string;
    motivoCierre?: string;

    // Costos
    costos?: CostoItemDto[];
    totalCostos?: number;
};

async function postJSON<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
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

    getHistorial: (req: HistorialReq) =>
        postJSON<OrdenPublicaDto[]>("/api/public/consultas/historial", req),

    getProcedimiento: (req: ProcedimientoReq) =>
        postJSON<OrdenPublicaDto>("/api/public/consultas/procedimiento", req),
};