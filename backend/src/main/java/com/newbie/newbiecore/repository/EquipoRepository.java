package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    // Buscar equipos por la cédula del usuario relacionado
    List<Equipo> findByUsuario_Cedula(String clienteCedula);
    List<Equipo> findByTecnico_Cedula(String tecnicoCedula);
    boolean existsByTecnico_Cedula(String tecnicoCedula);
    
    // Ordenar por fecha de registro descendente (más reciente primero)
    List<Equipo> findAllByOrderByFechaRegistroDesc();
    List<Equipo> findByUsuario_CedulaOrderByFechaRegistroDesc(String clienteCedula);
    List<Equipo> findByTecnico_CedulaOrderByFechaRegistroDesc(String tecnicoCedula);

}