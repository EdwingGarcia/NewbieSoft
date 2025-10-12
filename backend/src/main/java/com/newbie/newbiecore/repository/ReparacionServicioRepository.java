package com.newbie.newbiecore.repository;


import com.newbie.newbiecore.entity.ReparacionServicio;
import com.newbie.newbiecore.entity.ReparacionServicioId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReparacionServicioRepository extends JpaRepository<ReparacionServicio, ReparacionServicioId> {
    List<ReparacionServicio> findByReparacion_IdReparacion(Long reparacionId);
}
