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

        // Helpers
        java.util.function.BiConsumer<java.util.function.Supplier<Object>, Runnable> onlyIfNull = (getter, setter) -> {
            if (getter.get() == null) setter.run();
        };

        // CPU
        onlyIfNull.accept(ficha::getCpuNombre,
                () -> ficha.setCpuNombre(text(hw, "Nombre del procesador")));
        onlyIfNull.accept(ficha::getCpuNucleos,
                () -> ficha.setCpuNucleos(intFromText(hw, "Número de núcleos de procesador")));
        onlyIfNull.accept(ficha::getCpuLogicos,
                () -> ficha.setCpuLogicos(intFromText(hw, "Número de procesadores lógicos")));
        onlyIfNull.accept(ficha::getCpuPaquetesFisicos,
                () -> ficha.setCpuPaquetesFisicos(intFromText(hw, "Número de paquetes de procesador (físicos)")));
        onlyIfNull.accept(ficha::getCpuFrecuenciaOriginalMhz,
                () -> ficha.setCpuFrecuenciaOriginalMhz(intFromText(hw, "Original Processor Frequency [MHz]")));

        // RAM
        onlyIfNull.accept(ficha::getRamCapacidadGb,
                () -> ficha.setRamCapacidadGb(intFromSizeGb(hw, "Tamaño del módulo"))); // "16 GBytes"
        onlyIfNull.accept(ficha::getRamTecnologiaModulo,
                () -> ficha.setRamTecnologiaModulo(text(hw, "Tipo de módulo")));
        onlyIfNull.accept(ficha::getRamTipo,
                () -> ficha.setRamTipo(text(hw, "Tipo de memoria")));
        onlyIfNull.accept(ficha::getRamNumeroModulo,
                () -> ficha.setRamNumeroModulo(intFromText(hw, "Número de módulo")));
        onlyIfNull.accept(ficha::getRamSerieModulo,
                () -> ficha.setRamSerieModulo(text(hw, "Número de serie del módulo")));
        onlyIfNull.accept(ficha::getRamFechaFabricacion,
                () -> ficha.setRamFechaFabricacion(text(hw, "Fecha de fabricación del módulo")));
        onlyIfNull.accept(ficha::getRamLugarFabricacion,
                () -> ficha.setRamLugarFabricacion(text(hw, "Ubicación de fabricación del módulo")));

        // Disco
        onlyIfNull.accept(ficha::getDiscoModelo,
                () -> ficha.setDiscoModelo(text(hw, "Modelo de unidad")));
        onlyIfNull.accept(ficha::getDiscoNumeroSerie,
                () -> ficha.setDiscoNumeroSerie(text(hw, "Número de serie de la unidad")));
        onlyIfNull.accept(ficha::getDiscoCapacidadMb,
                () -> ficha.setDiscoCapacidadMb(intFromText(hw, "Drive Capacity [MB]")));
        onlyIfNull.accept(ficha::getDiscoCapacidadStr,
                () -> ficha.setDiscoCapacidadStr(text(hw, "Capacidad de la unidad")));
        onlyIfNull.accept(ficha::getDiscoRpm,
                () -> ficha.setDiscoRpm(intFromText(hw, "Tasa de rotación de medios")));
        onlyIfNull.accept(ficha::getDiscoLetras,
                () -> ficha.setDiscoLetras(text(hw, "Drive Letter(s)")));
        onlyIfNull.accept(ficha::getDiscoWwn,
                () -> ficha.setDiscoWwn(text(hw, "Nombre mundial (WWN)")));
        onlyIfNull.accept(ficha::getDiscoTemperatura,
                () -> ficha.setDiscoTemperatura(text(hw, "[C2] Temperatura")));
        onlyIfNull.accept(ficha::getDiscoHorasEncendido,
                () -> ficha.setDiscoHorasEncendido(text(hw, "[09] Número de ciclos/horas de encendido")));
        onlyIfNull.accept(ficha::getDiscoSectoresReasignados,
                () -> ficha.setDiscoSectoresReasignados(text(hw, "[05] Reasignado el conteo del sector")));
        onlyIfNull.accept(ficha::getDiscoSectoresPendientes,
                () -> ficha.setDiscoSectoresPendientes(text(hw, "[C5] Recuento actual de sectores pendientes")));
        onlyIfNull.accept(ficha::getDiscoErroresLectura,
                () -> ficha.setDiscoErroresLectura(text(hw, "[01] Tasa de errores en la lectura")));
        onlyIfNull.accept(ficha::getDiscoErrorCrc,
                () -> ficha.setDiscoErrorCrc(text(hw, "[C7] Tasa de error UltraDMA/SATA CRC")));

        // GPU / mainboard / buses
        onlyIfNull.accept(ficha::getGpuNombre,
                () -> ficha.setGpuNombre(text(hw, "Tarjeta grafica")));
        onlyIfNull.accept(ficha::getMainboardModelo,
                () -> ficha.setMainboardModelo(text(hw, "Modelo de placa base")));
        onlyIfNull.accept(ficha::getChipset,
                () -> ficha.setChipset(text(hw, "Chipset de la placa base")));
        onlyIfNull.accept(ficha::getPciExpressVersion,
                () -> ficha.setPciExpressVersion(text(hw, "Versión de PCI Express admitida")));
        onlyIfNull.accept(ficha::getUsbVersion,
                () -> ficha.setUsbVersion(text(hw, "Versión USB admitida")));

        // Red
        onlyIfNull.accept(ficha::getAdaptadorRed,
                () -> ficha.setAdaptadorRed(text(hw, "Tarjeta de red")));
        onlyIfNull.accept(ficha::getMacAddress,
                () -> ficha.setMacAddress(text(hw, "Dirección MAC")));
        onlyIfNull.accept(ficha::getWifiLinkSpeedActual,
                () -> ficha.setWifiLinkSpeedActual(text(hw, "Velocidad de enlace actual")));
        onlyIfNull.accept(ficha::getWifiLinkSpeedMax,
                () -> ficha.setWifiLinkSpeedMax(text(hw, "Velocidad máxima de enlace")));

        // BIOS / UEFI / SO
        onlyIfNull.accept(ficha::getBiosFabricante,
                () -> ficha.setBiosFabricante(text(hw, "Fabricante de BIOS")));
        onlyIfNull.accept(ficha::getBiosVersion,
                () -> ficha.setBiosVersion(text(hw, "Versión de BIOS")));
        onlyIfNull.accept(ficha::getBiosFechaStr,
                () -> ficha.setBiosFechaStr(text(hw, "Fecha de BIOS (mm/dd/yyyy)")));

        onlyIfNull.accept(ficha::getBiosEsUefiCapaz,
                () -> ficha.setBiosEsUefiCapaz(boolFromText(hw, "UEFI BIOS", "Capaz")));
        onlyIfNull.accept(ficha::getArranqueUefiPresente,
                () -> ficha.setArranqueUefiPresente(boolFromText(hw, "Arranque UEFI", "Presente")));
        onlyIfNull.accept(ficha::getSecureBootActivo,
                () -> ficha.setSecureBootActivo(boolFromText(hw, "Arranque seguro", "Activado")));

        onlyIfNull.accept(ficha::getSoDescripcion,
                () -> ficha.setSoDescripcion(text(hw, "Sistema operativo")));
        onlyIfNull.accept(ficha::getSoProveedor,
                () -> ficha.setSoProveedor(text(hw, "Descripción del proveedor")));

        // TPM / HVCI
        onlyIfNull.accept(ficha::getTpmPresente, () -> {
            String raw = text(hw, "Chip del módulo de plataforma segura (TPM)");
            if (raw != null && raw.toLowerCase().contains("present")) {
                ficha.setTpmPresente(true);
            }
        });
        onlyIfNull.accept(ficha::getTpmVersion, () -> {
            String raw = text(hw, "Chip del módulo de plataforma segura (TPM)");
            if (raw != null) {
                // Ej: "Present, version 2.0"
                int idx = raw.toLowerCase().indexOf("version");
                if (idx >= 0) {
                    ficha.setTpmVersion(raw.substring(idx).replace("version", "").trim());
                } else {
                    ficha.setTpmVersion(raw);
                }
            }
        });

        onlyIfNull.accept(ficha::getHvciEstado,
                () -> ficha.setHvciEstado(text(hw, "Integridad de código protegida por hipervisor (HVCI)")));

        // Nombre equipo / monitor
        onlyIfNull.accept(ficha::getEquipoNombre,
                () -> ficha.setEquipoNombre(text(hw, "Nombre del computadora")));
        onlyIfNull.accept(ficha::getMonitorNombre,
                () -> ficha.setMonitorNombre(text(hw, "Nombre del monitor")));
        onlyIfNull.accept(ficha::getMonitorModelo,
                () -> ficha.setMonitorModelo(text(hw, "Nombre del monitor (del fabricante)")));

        // Audio
        onlyIfNull.accept(ficha::getAudioAdaptador,
                () -> ficha.setAudioAdaptador(text(hw, "Adaptador de sonido")));
        onlyIfNull.accept(ficha::getAudioCodec,
                () -> ficha.setAudioCodec(text(hw, "Códec de audio de alta definición")));
        onlyIfNull.accept(ficha::getAudioHardwareId,
                () -> ficha.setAudioHardwareId(text(hw, "ID de hardware del códec de audio")));
    }

    private static Boolean boolFromText(JsonNode hw, String key, String expected) {
        String raw = text(hw, key);
        if (raw == null) return null;
        String lower = raw.toLowerCase();
        if (lower.contains(expected.toLowerCase())) return true;
        if (lower.contains("no")) return false;
        if (lower.contains("deshabilitado") || lower.contains("disabled")) return false;
        return null;
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
    /**
     * Convierte textos como "16 GBytes" o "8 GB" o "32 G" a un número entero (GB).
     * Devuelve null si no puede parsear nada.
     */
    private static Integer intFromSizeGb(JsonNode hw, String key) {
        String raw = text(hw, key);
        if (raw == null) return null;

        // Extraer solo los dígitos
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)")
                .matcher(raw.replace(",", "."));
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {}
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
