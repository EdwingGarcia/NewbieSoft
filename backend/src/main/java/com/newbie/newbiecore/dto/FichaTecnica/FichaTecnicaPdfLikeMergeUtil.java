package com.newbie.newbiecore.dto.FichaTecnica;

import java.lang.reflect.Field;

public class FichaTecnicaPdfLikeMergeUtil {

    /**
     * Replica EXACTAMENTE la lógica del PdfController:
     * - null → ignorar
     * - String vacío → ignorar
     * - Number = 0 → ignorar
     *
     * source pisa target SOLO si tiene valor real
     */
    public static FichaTecnicaDTO mergeLikePdf(
            FichaTecnicaDTO target,
            FichaTecnicaDTO source
    ) {

        if (target == null) return source;
        if (source == null) return target;

        try {
            for (Field field : FichaTecnicaDTO.class.getDeclaredFields()) {
                field.setAccessible(true);

                Object value = field.get(source);

                // 🔁 MISMAS reglas que PdfController
                if (value == null) continue;
                if (value instanceof String s && s.trim().isEmpty()) continue;
                if (value instanceof Number n && n.doubleValue() == 0) continue;

                // Si pasó los filtros → copiar
                field.set(target, value);
            }

            return target;

        } catch (Exception e) {
            throw new RuntimeException(
                "Error replicando comportamiento del PdfController",
                e
            );
        }
    }
}
