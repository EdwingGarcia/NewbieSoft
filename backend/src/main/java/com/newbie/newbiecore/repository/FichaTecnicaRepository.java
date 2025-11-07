package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FichaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {

    // por equipo (esto estaba bien)
    List<FichaTecnica> findByEquipo_IdEquipo(Long equipoId);

    // 🔴 antes: findByTecnico_Id(String ...)
    // ✅ ahora: usa el nombre real del campo PK de Usuario: cedula
    List<FichaTecnica> findByTecnico_Cedula(String cedulaTecnico);
}
