"use client";
import { useState } from "react";

export default function OTPModal({ onClose }: { onClose: () => void }) {
    const [codigo, setCodigo] = useState("");

    const handleVerify = () => {
        alert(`Código ingresado: ${codigo}`);
        onClose();
    };

    return (
        <div className="otp-overlay">
            <div className="otp-modal">
                <h3>Ingrese el código de autenticación</h3>
                <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Código OTP"
                />
                <button onClick={handleVerify}>Verificar</button>
            </div>
        </div>
    );
}
