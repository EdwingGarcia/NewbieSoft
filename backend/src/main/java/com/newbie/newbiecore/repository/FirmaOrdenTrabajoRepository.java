package com.newbie.newbiecore.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.newbie.newbiecore.entity.FirmaOrdenTrabajo;
import com.newbie.newbiecore.entity.TipoFirmaOT;

@Repository
public interface FirmaOrdenTrabajoRepository extends JpaRepository<FirmaOrdenTrabajo, Long> {

    // Buscar firmas por número de orden
    List<FirmaOrdenTrabajo> findByNumeroOrden(String numeroOrden);

    // Buscar firma específica por número de orden y tipo
    Optional<FirmaOrdenTrabajo> findByNumeroOrdenAndTipoFirma(String numeroOrden, TipoFirmaOT tipoFirma);

    // Verificar si existe una firma de conformidad para una orden
    boolean existsByNumeroOrdenAndTipoFirma(String numeroOrden, TipoFirmaOT tipoFirma);

    // Buscar firmas por orden de trabajo ID
    List<FirmaOrdenTrabajo> findByOrdenTrabajo_Id(Long ordenTrabajoId);

    // Buscar firmas por cédula del firmante
    List<FirmaOrdenTrabajo> findByFirmanteCedula(String cedula);

    // Obtener solo fecha, nombre y tipo de firmante (sin cargar el LOB) - ordenado por fecha más reciente
    @Query("SELECT f.fechaFirma FROM FirmaOrdenTrabajo f WHERE f.numeroOrden = :numeroOrden AND f.tipoFirma = :tipoFirma ORDER BY f.fechaFirma DESC LIMIT 1")
    Optional<Instant> findFechaFirmaByNumeroOrdenAndTipoFirma(@Param("numeroOrden") String numeroOrden, @Param("tipoFirma") TipoFirmaOT tipoFirma);

    @Query("SELECT f.firmanteNombre FROM FirmaOrdenTrabajo f WHERE f.numeroOrden = :numeroOrden AND f.tipoFirma = :tipoFirma ORDER BY f.fechaFirma DESC LIMIT 1")
    Optional<String> findFirmanteNombreByNumeroOrdenAndTipoFirma(@Param("numeroOrden") String numeroOrden, @Param("tipoFirma") TipoFirmaOT tipoFirma);

    @Query("SELECT f.tipoFirmante FROM FirmaOrdenTrabajo f WHERE f.numeroOrden = :numeroOrden AND f.tipoFirma = :tipoFirma ORDER BY f.fechaFirma DESC LIMIT 1")
    Optional<String> findTipoFirmanteByNumeroOrdenAndTipoFirma(@Param("numeroOrden") String numeroOrden, @Param("tipoFirma") TipoFirmaOT tipoFirma);
}
