"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAdmin } from "@/app/utils/auth";

export default function AdminOnly({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        if (!getToken()) {
            router.push("/");
            return;
        }

        if (!isAdmin()) {
            router.push("/");
            return;
        }
    }, []);

    return <>{children}</>;
}
