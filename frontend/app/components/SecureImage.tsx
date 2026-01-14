"use client";
import React, { useEffect, useState } from "react";
import { Loader2, ImageOff } from "lucide-react";

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string; // La URL original del backend (ej: /uploads/...)
}

export default function SecureImage({ src, alt, className, ...props }: SecureImageProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true; // Para evitar actualizaciones si el componente se desmonta

        const fetchImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // 1. Obtenemos el token
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No token");

                // 2. Construimos la URL completa (sin ?token=...)
                // Si src ya viene completa, usala, si no, pegale el localhost
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const fullUrl = src.startsWith("http") ? src : `${baseUrl}${src}`;

                // 3. Hacemos el FETCH con el Header
                const res = await fetch(fullUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Error cargando imagen");

                // 4. Convertimos a BLOB
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);

                if (active) {
                    setObjectUrl(url);
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                if (active) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        if (src) {
            fetchImage();
        }

        // Limpieza de memoria cuando el componente muere
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !objectUrl) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
                <ImageOff className="h-5 w-5" />
            </div>
        );
    }

    return <img src={objectUrl} alt={alt} className={className} {...props} />;
}