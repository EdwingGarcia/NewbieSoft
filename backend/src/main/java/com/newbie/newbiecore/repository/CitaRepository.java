package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.Cita;
import com.newbie.newbiecore.entity.Usuario; // Importante importar esto
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    // CORRECCIÓN: Buscamos por la entidad completa, no por su ID interno.
    // Spring traduce esto automáticamente a la columna usuario_id de la BD.
    List<Cita> findByUsuario(Usuario usuario);
}