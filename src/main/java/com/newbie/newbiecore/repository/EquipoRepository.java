package com.newbie.newbiecore.repository;


import com.newbie.newbiecore.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    List<Equipo> findByCliente_IdCliente(Long clienteId);
}
