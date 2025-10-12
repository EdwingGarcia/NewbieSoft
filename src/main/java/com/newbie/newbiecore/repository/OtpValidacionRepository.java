package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.OtpValidacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpValidacionRepository extends JpaRepository<OtpValidacion, Long> {

    // Obtener la última OTP generada para un usuario (cédula como ID)
    Optional<OtpValidacion> findTopByUsuario_CedulaOrderByFechaEnvioDesc(String usuarioCedula);

    // Validar OTP no usado para un usuario específico
    Optional<OtpValidacion> findByUsuario_CedulaAndCodigoAndValidoFalse(String usuarioCedula, String codigo);
}
