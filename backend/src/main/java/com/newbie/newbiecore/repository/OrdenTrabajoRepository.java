package com.newbie.newbiecore.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.newbie.newbiecore.dto.dashboard.TecnicoDashboardDto;
import com.newbie.newbiecore.entity.OrdenTrabajo;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {
    Optional<OrdenTrabajo> findByNumeroOrden(String numeroOrden);
    long countByEstado(String estado);

    long countByFechaHoraIngresoBetween(Instant inicio, Instant fin);

    @Query("""
           SELECT new com.newbie.newbiecore.dto.dashboard.TecnicoDashboardDto(
               ot.tecnicoAsignado.cedula,
               ot.tecnicoAsignado.nombre,
               COUNT(ot),
               SUM(CASE WHEN ot.estado = 'PENDIENTE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN ot.estado IN ('EN_DIAGNOSTICO','EN_REPARACION') THEN 1 ELSE 0 END),
               SUM(CASE WHEN ot.estado IN ('LISTO','CERRADO') THEN 1 ELSE 0 END)
           )
           FROM OrdenTrabajo ot
           WHERE ot.tecnicoAsignado IS NOT NULL
           GROUP BY ot.tecnicoAsignado.cedula, ot.tecnicoAsignado.nombre
           """)
    List<TecnicoDashboardDto> findResumenTecnicos();

}