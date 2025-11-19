package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FirmaDigital;
import com.newbie.newbiecore.entity.TipoFirma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FirmaDigitalRepository extends JpaRepository<FirmaDigital, Long> {

    // ✅ Para ficha técnica (relación FirmaDigital.fichaTecnica)
    Optional<FirmaDigital> findByFichaTecnica_IdAndFirmante_CedulaAndTipo(
            Long fichaId,
            String cedulaFirmante,
            TipoFirma tipo
    );

    // ✅ Listar todas las firmas de una ficha técnica
    List<FirmaDigital> findByFichaTecnica_Id(Long fichaId);

    // ✅ Listar todas las firmas hechas por un usuario (técnico o cliente)
    List<FirmaDigital> findByFirmante_Cedula(String cedulaFirmante);
}
