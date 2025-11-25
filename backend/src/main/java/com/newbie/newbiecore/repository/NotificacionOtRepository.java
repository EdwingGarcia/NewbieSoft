package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.NotificacionOt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionOtRepository extends JpaRepository<NotificacionOt, Long> {

    List<NotificacionOt> findByOtIdOrderByFechaEnvioDesc(Long otId);
}
