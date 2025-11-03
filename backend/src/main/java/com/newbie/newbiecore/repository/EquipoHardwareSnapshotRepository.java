package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.EquipoHardwareSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipoHardwareSnapshotRepository extends JpaRepository<EquipoHardwareSnapshot, Long> {
    Optional<EquipoHardwareSnapshot> findFirstByEquipo_IdEquipoOrderByCreatedAtDesc(Long equipoId);
    List<EquipoHardwareSnapshot> findByEquipo_IdEquipoOrderByCreatedAtDesc(Long equipoId);
}
