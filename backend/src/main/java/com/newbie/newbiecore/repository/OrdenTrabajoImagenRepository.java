package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.Imagen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenTrabajoImagenRepository extends JpaRepository<Imagen, Long> {

    List<Imagen> findByOrdenTrabajo_Id(Long ordenTrabajoId);
}
