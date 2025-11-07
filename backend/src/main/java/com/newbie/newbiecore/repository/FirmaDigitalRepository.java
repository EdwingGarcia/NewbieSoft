package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FirmaDigital;
import com.newbie.newbiecore.entity.TipoFirma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FirmaDigitalRepository extends JpaRepository<FirmaDigital, Long> {

    // si tu Reparacion tiene PK: Long idReparacion
    Optional<FirmaDigital> findByReparacion_IdReparacionAndFirmante_CedulaAndTipo(
            Long reparacionId,
            String cedulaFirmante,
            TipoFirma tipo
    );

    // para ficha técnica (aquí sí es Long id)
    Optional<FirmaDigital> findByFichaTecnica_IdAndFirmante_CedulaAndTipo(
            Long fichaId,
            String cedulaFirmante,
            TipoFirma tipo
    );

    // listar todas las firmas de una reparación
    List<FirmaDigital> findByReparacion_IdReparacion(Long reparacionId);

    // listar todas las firmas de una ficha técnica
    List<FirmaDigital> findByFichaTecnica_Id(Long fichaId);

    // listar todas las firmas hechas por un usuario (técnico o cliente)
    List<FirmaDigital> findByFirmante_Cedula(String cedulaFirmante);
}
