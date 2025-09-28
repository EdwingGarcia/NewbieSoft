package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByCliente_IdCliente(Long clienteId);
    List<Cita> findByTecnico_IdUsuario(Long tecnicoId);
    List<Cita> findByFechaBetween(Instant inicio, Instant fin);
}
