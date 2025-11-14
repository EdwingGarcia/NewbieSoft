package com.newbie.newbiecore.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.FichaTecnica;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FichaTecnicaAutoFillHelper {

    public static void rellenarDesdeHardwareJson(FichaTecnica ficha, Equipo equipo) {

        JsonNode hw = equipo.getHardwareJson();
        if (hw == null) return;

        // 🧠 CPU
        ficha.setCpuNombre(text(hw, "Nombre del procesador"));
        ficha.setCpuNucleos(intFromText(hw, "Número de núcleos de procesador"));
        ficha.setCpuLogicos(intFromText(hw, "Número de procesadores lógicos"));

        // 🎮 GPU
        ficha.setGpuNombre(text(hw, "Tarjeta grafica"));

        // 🧠 RAM
        ficha.setRamCapacidadGb(intFromText(hw, "Tamaño del módulo"));     // ej. "16 GBytes"
        ficha.setRamTecnologiaModulo(text(hw, "Tipo de módulo"));          // SO-DIMM
        ficha.setRamTipo(text(hw, "Tipo de memoria"));                     // DDR4 SDRAM

        // 💾 Disco
        ficha.setDiscoModelo(text(hw, "Modelo de unidad"));                // HGST HTS...
        ficha.setDiscoNumeroSerie(text(hw, "Número de serie del módulo")); // o el que estés usando
        ficha.setDiscoTipo(text(hw, "Controlador de disco"));              // "Serial ATA 6Gb/s..."
        ficha.setDiscoRpm(intFromText(hw, "Tasa de rotación de medios"));  // "7200 RPM"
        ficha.setDiscoCapacidadStr(text(hw, "Capacidad de la unidad"));    // "953,869 MBytes..."

        // 🔐 BIOS / UEFI (Boolean en entity)
        ficha.setBiosEsUefiCapaz(
                booleanFromContains(hw, "UEFI BIOS", "Capaz")
        );
        ficha.setArranqueUefiPresente(
                booleanFromContains(hw, "Arranque UEFI", "Presente")
        );
        ficha.setSecureBootActivo(
                booleanFromContains(hw, "Arranque seguro", "Activado")
        );
        ficha.setBiosVersion(text(hw, "Versión de BIOS"));
        ficha.setBiosFabricante(text(hw, "Fabricante de BIOS"));
        ficha.setBiosFechaStr(text(hw, "Fecha de BIOS (mm/dd/yyyy)"));

        // 🧩 Placa / chipset
        ficha.setChipset(text(hw, "Chipset de la placa base"));
        ficha.setMainboardModelo(text(hw, "Modelo de placa base"));

        // 🌐 Red / WiFi
        ficha.setAdaptadorRed(text(hw, "Tarjeta de red"));
        ficha.setMacAddress(text(hw, "Dirección MAC"));

        // En tu entity estos son String -> mandamos String directamente
        ficha.setWifiLinkSpeedActual(text(hw, "Velocidad de enlace actual")); // "2460 Mbps"
        ficha.setWifiLinkSpeedMax(text(hw, "Velocidad máxima de enlace"));    // "2460 Mbps"
    }

    /* ================== HELPERS ================== */

    /** Obtiene un campo de texto del JSON, o null si no existe */
    private static String text(JsonNode node, String field) {
        if (node == null || field == null) return null;
        JsonNode v = node.get(field);
        return (v != null && !v.isNull()) ? v.asText() : null;
    }

    /** Extrae el primer número entero que encuentre en el valor de un campo */
    private static Integer intFromText(JsonNode node, String field) {
        return firstIntFromString(text(node, field));
    }

    /** Extrae el primer número (int) de un String como "7200 RPM", "16 GBytes", etc. */
    private static Integer firstIntFromString(String s) {
        if (s == null) return null;
        Matcher m = Pattern.compile("(\\d+)").matcher(s);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /** Si el valor del campo contiene cierto texto, devuelve Boolean */
    private static Boolean booleanFromContains(JsonNode node, String field, String expected) {
        String value = text(node, field);
        if (value == null || expected == null) return null;
        return value.toLowerCase().contains(expected.toLowerCase());
    }
}
