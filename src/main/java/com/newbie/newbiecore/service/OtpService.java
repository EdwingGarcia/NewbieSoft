package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Cliente;
import com.newbie.newbiecore.entity.OtpValidacion;
import com.newbie.newbiecore.repository.OtpValidacionRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;

@Service
public class OtpService {

    private final OtpValidacionRepository otpRepository;
    private final MailService mailService;

    public OtpService(OtpValidacionRepository otpRepository, MailService mailService) {
        this.otpRepository = otpRepository;
        this.mailService = mailService;
    }

    public OtpValidacion generarOtp(Cliente cliente) {
        String codigo = String.format("%06d", new SecureRandom().nextInt(999999));

        OtpValidacion otp = OtpValidacion.builder()
                .cliente(cliente)
                .codigo(codigo)
                .fechaEnvio(Instant.now())
                .valido(false)
                .build();

        otpRepository.save(otp);
        mailService.enviarOtp(cliente.getCorreo(), codigo);
        return otp;
    }

    public Optional<OtpValidacion> validarOtp(Long clienteId, String codigo) {
        Optional<OtpValidacion> otpOpt = otpRepository.findByCliente_IdClienteAndCodigoAndValidoFalse(clienteId, codigo);

        if (otpOpt.isPresent()) {
            OtpValidacion otp = otpOpt.get();
            otp.setValido(true);
            otp.setFechaValidacion(Instant.now());
            otpRepository.save(otp);
            return Optional.of(otp);
        }

        return Optional.empty();
    }
}
