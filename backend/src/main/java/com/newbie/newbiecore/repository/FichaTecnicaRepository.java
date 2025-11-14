package com.newbie.newbiecore.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.newbie.newbiecore.entity.FichaTecnica;

@Repository
public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {

    // por equipo (esto estaba bien)
    List<FichaTecnica> findByEquipo_IdEquipo(Long equipoId);
    Optional<FichaTecnica> findByOrdenTrabajoId(Long ordenTrabajoId);
    // 🔴 antes: findByTecnico_Id(String ...)
    // ✅ ahora: usa el nombre real del campo PK de Usuario: cedula
    List<FichaTecnica> findByTecnico_Cedula(String cedulaTecnico);
}
