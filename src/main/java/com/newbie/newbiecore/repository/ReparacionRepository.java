package com.newbie.newbiecore.repository;


import com.newbie.newbiecore.entity.Reparacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReparacionRepository extends JpaRepository<Reparacion, Long> {
    List<Reparacion> findByTecnico_IdUsuario(Long tecnicoId);
    List<Reparacion> findByEquipo_IdEquipo(Long equipoId);
}
