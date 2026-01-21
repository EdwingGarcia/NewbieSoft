package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.CatalogoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogoItemRepository extends JpaRepository<CatalogoItem, Long> {

    // Listar solo activos
    List<CatalogoItem> findByActivoTrue();

    // Búsqueda simple por descripción (barra de búsqueda)
    List<CatalogoItem> findByActivoTrueAndDescripcionContainingIgnoreCase(String descripcion);
}
