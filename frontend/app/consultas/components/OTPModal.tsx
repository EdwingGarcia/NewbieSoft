"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
    cedula: string;
    onClose: () => void;
    onVerified: (consultaToken: string) => void;
    onVerify: (codigo: string) => Promise<{ ok: boolean; consultaToken?: string; message?: string }>;
};

export default function OTPModal({ cedula, onClose, onVerified, onVerify }: Props) {
    const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refs = useRef<Array<HTMLInputElement | null>>([]);
    const code = useMemo(() => digits.join(""), [digits]);

    useEffect(() => {
        // focus first input
        refs.current[0]?.focus();
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [onClose]);

    const setDigit = (idx: number, val: string) => {
        const v = val.replace(/\D/g, "").slice(-1);
        setDigits((prev) => {
            const next = [...prev];
            next[idx] = v;
            return next;
        });
        setError(null);
        if (v && idx < 5) refs.current[idx + 1]?.focus();
    };

    const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) {
            refs.current[idx - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && idx > 0) refs.current[idx - 1]?.focus();
        if (e.key === "ArrowRight" && idx < 5) refs.current[idx + 1]?.focus();
    };

    const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        e.preventDefault();
        setDigits(pasted.split("").concat(Array(6 - pasted.length).fill("")));
        setError(null);
        const last = Math.min(pasted.length, 6) - 1;
        refs.current[last]?.focus();
    };

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError("Ingresa los 6 dígitos.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await onVerify(code);
            if (res.ok && res.consultaToken) {
                onVerified(res.consultaToken);
                return;
            }
            setError(res.message || "OTP inválido.");
        } catch (err: any) {
            setError(err?.message || "Error al validar OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="otpOverlay" role="dialog" aria-modal="true">
            <div className="otpCard">
                <div className="otpTop">
                    <div>
                        <h3>Verificación de seguridad</h3>
                        <p>
                            Enviamos un código a tu correo. <span className="otpMuted">Cédula: {cedula}</span>
                        </p>
                    </div>
                    <button className="otpClose" onClick={onClose} aria-label="Cerrar">
                        ✕
                    </button>
                </div>

                <div className="otpInputs">
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            value={d}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            onPaste={onPaste}
                            onKeyDown={(e) => onKeyDown(i, e)}
                            onChange={(e) => setDigit(i, e.target.value)}
                            className="otpDigit"
                        />
                    ))}
                </div>

                {error && <div className="otpError">{error}</div>}

                <button className="otpBtn" onClick={handleVerify} disabled={loading}>
                    {loading ? "Validando..." : "Verificar"}
                </button>

                <div className="otpHint">
                    ¿No te llegó? Revisa spam o espera 1–2 minutos.
                </div>
            </div>
        </div>
    );
}
