import { API_BASE_URL } from "../lib/api";
export async function generarPDF(html: string) {
 
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf/generar`, {
      method: "POST",
      headers: {
        "Content-Type": "text/html",
      },
      body: html,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error al generar PDF:", errorText);
      throw new Error("Error al generar PDF en el servidor");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);


    const link = document.createElement("a");
    link.href = url;
    link.download = "documento.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);


    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("No se pudo generar el PDF. Revisa la consola.");
  }
}
