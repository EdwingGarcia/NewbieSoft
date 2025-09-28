package com.newbie.newbiecore.repository;


import com.newbie.newbiecore.entity.FichaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FichaTecnicaRepository extends JpaRepository<FichaTecnica, Long> {
    Optional<FichaTecnica> findByReparacion_IdReparacion(Long reparacionId);
}

