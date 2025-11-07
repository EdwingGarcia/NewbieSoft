package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.FichaTecnicaImagen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FichaTecnicaImagenRepository extends JpaRepository<FichaTecnicaImagen, Long> {
    List<FichaTecnicaImagen> findByFichaTecnica_Id(Long fichaId);
}
