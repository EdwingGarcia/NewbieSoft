package com.newbie.newbiecore.repository;


import com.newbie.newbiecore.entity.OtpValidacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpValidacionRepository extends JpaRepository<OtpValidacion, Long> {
    Optional<OtpValidacion> findTopByCliente_IdClienteOrderByFechaEnvioDesc(Long clienteId);
    Optional<OtpValidacion> findByCliente_IdClienteAndCodigoAndValidoFalse(Long clienteId, String codigo);
}
