"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
    Card, CardContent, CardDescription, CardFooter,
    CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { X, FileUp, Upload, Loader2, Search } from "lucide-react";

/** ====== CONFIG ====== */
const UPLOAD_PATH = "/api/equipo/1/hardware/upload-xml";
const buildUrl = (path: string) => `http://localhost:8080${path}`;

/** ====== LECTURA DE TOKEN ====== */
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem("nb.auth");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.token && typeof parsed.token === "string") return parsed.token;
        }
    } catch { }
    const byAlias = localStorage.getItem("nb.auth.token");
    if (byAlias && typeof byAlias === "string") return byAlias;
    const plain = localStorage.getItem("token");
    return plain && typeof plain === "string" ? plain : null;
}

export default function XmlPruebaPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [parsing, setParsing] = useState(false);
    const [docInfo, setDocInfo] = useState<DocInfo | null>(null);
    const [rows, setRows] = useState<KVRow[]>([]);
    const [friendly, setFriendly] = useState<Record<string, string>>({});
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState("");
    const dropRef = useRef<HTMLDivElement>(null);

    const onFile = useCallback(async (f: File) => {
        setError("");
        setProgress(0);
        if (!f.name.toLowerCase().match(/\.(xml|txt)$/)) {
            setError("Solo se permiten archivos .xml o .txt");
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            setError("El archivo supera 10MB");
            return;
        }
        setFile(f);
        setParsing(true);
        try {
            const reader = new FileReader();
            const text = await new Promise<string>((resolve, reject) => {
                reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                reader.onload = () => resolve(String(reader.result || ""));
                reader.readAsText(f, "utf-8");
            });
            setText(text);
            const parsed = parseXml(text);
            setDocInfo(parsed.info);
            setRows(parsed.rows);
            setFriendly(parsed.friendly);
        } catch (e: any) {
            setError(e?.message || "Error procesando el XML");
        } finally {
            setParsing(false);
            setProgress(100);
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
    }, [onFile]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
    }, [onFile]);

    const reset = () => {
        setFile(null);
        setText("");
        setError("");
        setDocInfo(null);
        setRows([]);
        setFriendly({});
        setProgress(0);
        // OJO: no limpiamos uploadMsg aquí para que el éxito quede visible si lo llamamos tras subir
    };

    const uploadToBackend = useCallback(async () => {
        if (!file) {
            setError("Primero selecciona un archivo.");
            return;
        }
        const token = getAuthToken();
        if (!token) {
            setError("No hay token de sesión. Inicia sesión antes de subir el XML.");
            return;
        }

        setError("");
        setUploadMsg("");
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file, file.name);

            const res = await fetch(buildUrl(UPLOAD_PATH), {
                method: "POST",
                body: fd,
                headers: { Authorization: `Bearer ${token}` },
            });

            const text = await res.text();
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    throw new Error("No autorizado. Revisa tu sesión/token.");
                }
                throw new Error(`HTTP ${res.status}: ${text?.slice(0, 200) || "Error de servidor"}`);
            }
            // ÉXITO: mostrar mensaje en verde y limpiar selección/preview
            setUploadMsg("Archivo subido correctamente ✔");
            setFile(null);
            setText("");
            setDocInfo(null);
            setRows([]);
            setFriendly({});
            setProgress(0);
        } catch (e: any) {
            setError(e?.message || "Error subiendo el XML");
        } finally {
            setUploading(false);
        }
    }, [file]);

    const hasHwinfo = useMemo(() => (text.includes("<HWINFO") || text.includes("<HWINFO>")), [text]);

    return (
        <Tabs defaultValue="subir" className="mx-auto w-full max-w-6xl p-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subir">Cargar XML</TabsTrigger>
                <TabsTrigger value="resumen" disabled={!docInfo}>Resumen</TabsTrigger>
                <TabsTrigger value="tabla" disabled={!rows.length}>Tabla</TabsTrigger>
            </TabsList>

            {/* ---------- Pestaña Subir ---------- */}
            <TabsContent value="subir">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" /> Prueba de carga de XML
                        </CardTitle>
                        <CardDescription>
                            Arrastra y suelta tu archivo o utiliza el botón para seleccionarlo. Se procesa únicamente en tu navegador.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Mensaje de éxito en VERDE */}
                        {uploadMsg && (
                            <div className="mb-4">
                                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-green-100 text-green-700 border-green-200">
                                    {uploadMsg}
                                </div>
                            </div>
                        )}

                        {/* === SIN ARCHIVO: mostrar dropzone + input === */}
                        {!file && (
                            <>
                                <div
                                    ref={dropRef}
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                                    onDrop={onDrop}
                                    className="relative flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed p-6 text-center transition hover:border-primary/60"
                                >
                                    <div className="pointer-events-none flex flex-col items-center gap-3">
                                        <FileUp className="h-10 w-10" />
                                        <div className="text-sm text-muted-foreground">
                                            Suelta aquí tu <span className="font-medium">.xml</span> (o .txt) o usa el botón de abajo.
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Input type="file" accept=".xml,.txt" onChange={onChange} className="max-w-xs" />
                                </div>
                            </>
                        )}

                        {/* === CON ARCHIVO: ocultar dropzone/input y mostrar solo X para limpiar === */}
                        {file && (
                            <div className="mt-2 flex items-center justify-between rounded-2xl border p-3">
                                <div className="text-sm">
                                    Archivo: <Badge variant="secondary">{file.name}</Badge>
                                </div>
                                <Button variant="outline" onClick={reset}>
                                    <X className="mr-2 h-4 w-4" /> Quitar archivo
                                </Button>
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button onClick={uploadToBackend} disabled={!file || uploading}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="mr-2 h-4 w-4" /> Enviar
                                    </>
                                )}
                            </Button>

                            {parsing ? (
                                <Badge className="ml-auto flex items-center gap-1" variant="secondary">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Procesando…
                                </Badge>
                            ) : hasHwinfo && rows.length > 0 ? (
                                <Badge className="ml-auto" variant="outline">HWiNFO detectado</Badge>
                            ) : null}
                        </div>

                        <div className="mt-4">
                            <Progress value={progress} />
                        </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                        * No se sube nada al servidor hasta presionar “Enviar”.
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* ---------- Pestaña Resumen ---------- */}
            <TabsContent value="resumen">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Resumen del documento</CardTitle>
                        <CardDescription>Datos rápidos extraídos del XML.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!docInfo && (
                            <div className="text-sm text-muted-foreground">Carga un XML en la pestaña anterior.</div>
                        )}
                        {docInfo && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <InfoItem label="Raíz">{docInfo.root}</InfoItem>
                                <InfoItem label="Versión">{docInfo.version || "—"}</InfoItem>
                                <InfoItem label="Codificación">{docInfo.encoding || "—"}</InfoItem>
                                <InfoItem label="Nodos">{String(docInfo.nodeCount)}</InfoItem>
                                <InfoItem label="Tamaño del archivo">{formatBytes(file?.size || 0)}</InfoItem>
                                <InfoItem label="Nombre del archivo">{file?.name}</InfoItem>
                            </div>
                        )}
                        {Object.keys(friendly).length > 0 && (
                            <div className="mt-6">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                                    <Search className="h-4 w-4" /> Extracto amigable
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {Object.entries(friendly).map(([k, v]) => (
                                        <InfoItem key={k} label={k}>{v || "—"}</InfoItem>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ---------- Pestaña Tabla ---------- */}
            <TabsContent value="tabla">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Propiedades detectadas</CardTitle>
                        <CardDescription>Lista plana de pares clave/valor recolectados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!rows.length && (
                            <div className="text-sm text-muted-foreground">No hay datos todavía. Carga un XML primero.</div>
                        )}
                        {rows.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">Ruta</th>
                                            <th className="px-3 py-2 text-left font-medium">Clave</th>
                                            <th className="px-3 py-2 text-left font-medium">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="px-3 py-2 align-top text-muted-foreground">{r.path}</td>
                                                <td className="px-3 py-2 align-top">{r.key}</td>
                                                <td className="px-3 py-2 align-top whitespace-pre-wrap">{r.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

/* ================== Helpers ================== */
type DocInfo = { root: string; version?: string | null; encoding?: string | null; nodeCount: number };
type KVRow = { path: string; key: string; value: string };

function InfoItem({ label, children }: { label: string; children: any }) {
    return (
        <div className="rounded-2xl border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-medium">{children}</div>
        </div>
    );
}

function parseXml(xml: string): { info: DocInfo; rows: KVRow[]; friendly: Record<string, string> } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const parserErrors = doc.getElementsByTagName("parsererror");
    if (parserErrors && parserErrors.length > 0) {
        const msg = parserErrors[0]?.textContent?.slice(0, 200) || "XML inválido";
        throw new Error(msg);
    }
    const declMatch = xml.match(/<\?xml\s+version="([^"]+)"\s+encoding="([^"]+)"/i);
    const info: DocInfo = {
        root: doc.documentElement?.nodeName || "—",
        version: declMatch?.[1] ?? null,
        encoding: declMatch?.[2] ?? null,
        nodeCount: countNodes(doc.documentElement),
    };
    const rows: KVRow[] = [];
    const propertyNodes = Array.from(doc.getElementsByTagName("Property"));
    for (const p of propertyNodes) {
        const entry = textOf(p.getElementsByTagName("Entry")[0]);
        const desc = textOf(p.getElementsByTagName("Description")[0]);
        const path = getNodePath(p.parentElement);
        if (entry || desc) rows.push({ path, key: entry || "(sin clave)", value: desc || "" });
    }
    const friendly: Record<string, string> = {};
    if (doc.getElementsByTagName("HWINFO").length > 0) {
        friendly["Equipo"] = firstText(doc, "COMPUTER > NodeName");
        friendly["CPU Nombre"] = firstText(doc, "CPU > SubNode > NodeName") || byEntry(doc, "Nombre del procesador");
        friendly["CPU Núcleos"] = byEntry(doc, "Número de núcleos de procesador");
        friendly["Tarjeta Madre"] = byEntryUnder(doc, "MOBO", "Modelo de placa base");
        friendly["BIOS Versión"] = byEntryUnder(doc, "MOBO", "Versión de BIOS");
        friendly["Memoria Total"] = byEntryUnder(doc, "MEMORY", "Tamaño de memoria total");
    }
    return { info, rows, friendly };
}

function countNodes(node: Element | null): number {
    if (!node) return 0;
    let count = 1;
    node.childNodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) count += countNodes(n as Element);
    });
    return count;
}

function textOf(el?: Element | null): string {
    return (el?.textContent || "").trim();
}

function firstText(doc: Document, selector: string): string {
    try {
        const el = doc.querySelector(selector);
        return (el?.textContent || "").trim();
    } catch {
        return "";
    }
}

function getNodePath(el: Element | null): string {
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur.nodeType === 1 && cur.nodeName !== "#document") {
        parts.push(cur.nodeName);
        cur = cur.parentElement;
    }
    return parts.reverse().join(" > ");
}

function byEntry(doc: Document, entryName: string): string {
    const props = Array.from(doc.getElementsByTagName("Property"));
    for (const p of props) {
        const entry = textOf(p.getElementsByTagName("Entry")[0]);
        if (entry.toLowerCase() === entryName.toLowerCase()) {
            return textOf(p.getElementsByTagName("Description")[0]);
        }
    }
    return "";
}

function byEntryUnder(doc: Document, sectionTag: string, entryName: string): string {
    const sections = Array.from(doc.getElementsByTagName(sectionTag));
    for (const sec of sections) {
        const props = Array.from(sec.getElementsByTagName("Property"));
        for (const p of props) {
            const entry = textOf(p.getElementsByTagName("Entry")[0]);
            if (entry.toLowerCase() === entryName.toLowerCase()) {
                return textOf(p.getElementsByTagName("Description")[0]);
            }
        }
    }
    return "";
}

function formatBytes(bytes: number) {
    if (!bytes) return "—";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const v = bytes / Math.pow(1024, i);
    return `${v.toFixed(1)} ${sizes[i]}`;
}
