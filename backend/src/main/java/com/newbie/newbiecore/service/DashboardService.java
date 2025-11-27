package com.newbie.newbiecore.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.newbie.newbiecore.dto.dashboard.DashboardResumenDto;
import com.newbie.newbiecore.dto.dashboard.TecnicoDashboardDto;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;

    @Transactional(readOnly = true)
    public DashboardResumenDto obtenerResumen() {

        long totalOrdenes = ordenTrabajoRepository.count();

        // 🔹 Mapeo de estados:
        // Abiertas      -> PENDIENTE
        // En proceso    -> EN_DIAGNOSTICO + EN_REPARACION
        // Cerradas      -> LISTO + CERRADO
        long ordenesAbiertas = ordenTrabajoRepository.countByEstado("PENDIENTE");

        long ordenesEnProceso =
                ordenTrabajoRepository.countByEstado("EN_DIAGNOSTICO")
                        + ordenTrabajoRepository.countByEstado("EN_REPARACION");

        long ordenesCerradas =
                ordenTrabajoRepository.countByEstado("LISTO")
                        + ordenTrabajoRepository.countByEstado("CERRADO");

        LocalDate hoy = LocalDate.now();
        ZoneId zoneId = ZoneId.systemDefault();

        // 🔹 Rango de hoy [inicioHoy, inicioMañana)
        Instant inicioHoy = hoy.atStartOfDay(zoneId).toInstant();
        Instant inicioManana = hoy.plusDays(1).atStartOfDay(zoneId).toInstant();

        long ordenesHoy = ordenTrabajoRepository.countByFechaHoraIngresoBetween(
                inicioHoy,
                inicioManana
        );

        // 🔹 Rango del mes actual [inicioMes, inicioMesSiguiente)
        LocalDate primerDiaMes = hoy.withDayOfMonth(1);
        LocalDate primerDiaMesSiguiente = primerDiaMes.plusMonths(1);

        Instant inicioMes = primerDiaMes.atStartOfDay(zoneId).toInstant();
        Instant inicioMesSiguiente = primerDiaMesSiguiente.atStartOfDay(zoneId).toInstant();

        long ordenesMes = ordenTrabajoRepository.countByFechaHoraIngresoBetween(
                inicioMes,
                inicioMesSiguiente
        );

        // 🔹 Resumen de técnicos
        List<TecnicoDashboardDto> tecnicos = ordenTrabajoRepository.findResumenTecnicos();

        long totalTecnicos = tecnicos.size();
        long tecnicosConOrdenesAbiertas = tecnicos.stream()
                .filter(t -> t.getOrdenesAbiertas() > 0)
                .count();

        return new DashboardResumenDto(
                totalOrdenes,
                ordenesAbiertas,
                ordenesEnProceso,
                ordenesCerradas,
                ordenesHoy,
                ordenesMes,
                totalTecnicos,
                tecnicosConOrdenesAbiertas,
                tecnicos,
                hoy
        );
    }
}
