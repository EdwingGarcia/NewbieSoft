"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus } from "lucide-react";

const API_BASE = "http://localhost:8080/api/fichas";
const buildUrl = (p: string = "") => `${API_BASE}${p}`;

export default function FichaTecnicaForm({
  tecnicoCedulaFixed,
  onCreated,
}: {
  tecnicoCedulaFixed: string;
  onCreated?: () => void;
}) {
  // =====================
  // STATE
  // =====================
  const [equipoId, setEquipoId] = useState("");
  const [ordenTrabajoId, setOrdenTrabajoId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const cedulaTecnico = tecnicoCedulaFixed; // 🔒 FIJO

  // =====================
  // Cargar órdenes de trabajo
  // =====================
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:8080/api/ordenes", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrdenes)
      .catch(() => {});
  }, [token]);

  // =====================
  // Crear ficha técnica
  // =====================
  const crearFicha = useCallback(async () => {
    if (!cedulaTecnico || !equipoId || !ordenTrabajoId) {
      setError("Debe completar todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        cedulaTecnico,
        equipoId,
        ordenTrabajoId,
        observaciones,
      });

      const res = await fetch(buildUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Error ${res.status}`);
      }

      setMsg("Ficha técnica creada correctamente ✅");

      // 🔁 Avisar al padre (refresca lista y cierra modal)
      onCreated?.();
    } catch (e: any) {
      setError(e.message || "Error creando ficha técnica");
    } finally {
      setLoading(false);
    }
  }, [cedulaTecnico, equipoId, ordenTrabajoId, observaciones, token, onCreated]);

  // =====================
  // UI
  // =====================
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Nueva Ficha Técnica
          </CardTitle>
          <CardDescription>
            La ficha quedará asignada automáticamente a tu usuario.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Técnico FIJO (solo visible informativo) */}
          <Input
            value={cedulaTecnico}
            disabled
            className="bg-slate-100 text-xs"
            placeholder="Cédula técnico"
          />

          <Input
            placeholder="ID del equipo"
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
          />

          <select
            value={ordenTrabajoId}
            onChange={(e) => setOrdenTrabajoId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-white text-sm"
          >
            <option value="">Seleccione orden de trabajo</option>
            {ordenes.map((o) => (
              <option key={o.id} value={o.id}>
                OT #{o.id} — {o.descripcion ?? ""}
              </option>
            ))}
          </select>

          <Input
            placeholder="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />

          <Button onClick={crearFicha} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Crear ficha técnica
          </Button>

          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
