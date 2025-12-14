package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.OtpValidacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpValidacionRepository extends JpaRepository<OtpValidacion, Long> {


    // Validar OTP no usado para un usuario específico
    Optional<OtpValidacion> findByUsuario_CedulaAndCodigoAndValidoFalse(String usuarioCedula, String codigo);

    Optional<OtpValidacion> findByTokenConsultaAndTokenExpiraAfterAndValidoTrue(String token, Instant now);
    Optional<OtpValidacion> findTopByUsuario_CedulaOrderByFechaEnvioDesc(String cedula);

}
