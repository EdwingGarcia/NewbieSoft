package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FichaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {

    Optional<FichaTecnica> findByOrdenTrabajoId(Long ordenTrabajoId);

    // 🆕 Ahora con campo plano equipoId
    List<FichaTecnica> findByEquipoId(Long equipoId);

    // 🆕 Ahora con campo plano tecnicoId
    List<FichaTecnica> findByTecnicoId(String tecnicoId);
}
