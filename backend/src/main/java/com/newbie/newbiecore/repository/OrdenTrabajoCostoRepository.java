package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.OrdenTrabajoCosto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenTrabajoCostoRepository extends JpaRepository<OrdenTrabajoCosto, Long> {

    List<OrdenTrabajoCosto> findByOrdenTrabajo_Id(Long ordenTrabajoId);
}
