package com.newbie.newbiecore.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.newbie.newbiecore.entity.OrdenTrabajo;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {
    Optional<OrdenTrabajo> findByNumeroOrden(String numeroOrden);
}