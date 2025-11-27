"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProtectedRouteProps = {
    children: React.ReactNode;
    allowedRoles?: string[]; // Ej: ["ROLE_ADMIN"], ["ROLE_TECNICO"]
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        try {
            // 🔹 Leemos lo que ya se guarda en el login
            const token = localStorage.getItem("token");
            const rol = localStorage.getItem("rol");

            // ⛔ Si no hay sesión, mandamos al login
            if (!token || !rol) {
                setIsAllowed(false);
                router.push("/");
                return;
            }

            // ✅ Si no se pasan allowedRoles, dejamos pasar a cualquiera logueado
            if (!allowedRoles || allowedRoles.length === 0) {
                setIsAllowed(true);
                return;
            }

            // 🔐 Validar si el rol actual está permitido
            if (allowedRoles.includes(rol)) {
                setIsAllowed(true);
                return;
            }

            // ⛔ Rol no permitido: lo redirigimos según su rol real
            if (rol === "ROLE_ADMIN") {
                router.push("/dashboard");
            } else if (rol === "ROLE_TECNICO") {
                router.push("/dashboard-tecnico");
            } else {
                router.push("/");
            }

            setIsAllowed(false);
        } finally {
            setIsChecking(false);
        }
    }, [allowedRoles, router]);

    // Mientras verifica, mostramos algo simple
    if (isChecking) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                Verificando permisos...
            </div>
        );
    }

    // Si no está permitido, no renderizamos nada (ya se redirigió)
    if (!isAllowed) {
        return null;
    }

    // ✅ Si todo bien, mostramos el contenido protegido
    return <>{children}</>;
}
