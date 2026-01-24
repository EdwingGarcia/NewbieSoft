package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FichaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {

    List<FichaTecnica> findByOrdenTrabajoId(Long ordenTrabajoId);
    List<FichaTecnica> findByEquipoId(Long equipoId);
    List<FichaTecnica> findByOrdenTrabajo_Cliente_Cedula(String cedula);
    List<FichaTecnica> findByTecnicoId(String tecnicoId);

}
