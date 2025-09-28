package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LogRepository extends JpaRepository<Log, Long> {
    List<Log> findByUsuario_IdUsuario(Long usuarioId);
}
