package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FichaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {

    Optional<FichaTecnica> findByOrdenTrabajoId(Long ordenTrabajoId);

    // 🆕 Ahora con campo plano equipoId
    List<FichaTecnica> findByEquipoId(Long equipoId);
    List<FichaTecnica> findByOrdenTrabajo_Cliente_Cedula(String cedula);
    List<FichaTecnica> findByTecnicoId(String tecnicoId);
}
