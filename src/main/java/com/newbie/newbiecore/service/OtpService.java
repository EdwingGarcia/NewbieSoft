package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.OtpValidacion;
import com.newbie.newbiecore.entity.Usuario;
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

    public OtpValidacion generarOtp(Usuario usuario) {
        String codigo = String.format("%06d", new SecureRandom().nextInt(999999));

        OtpValidacion otp = OtpValidacion.builder()
                .usuario(usuario)
                .codigo(codigo)
                .fechaEnvio(Instant.now())
                .valido(false)
                .build();

        otpRepository.save(otp);
        mailService.enviarOtp(usuario.getCorreo(), codigo);
        return otp;
    }

    public Optional<OtpValidacion> validarOtp(String cedula, String codigo) {
        Optional<OtpValidacion> otpOpt = otpRepository.findByUsuario_CedulaAndCodigoAndValidoFalse(cedula, codigo);

        if (otpOpt.isPresent()) {
            OtpValidacion otp = otpOpt.get();
            otp.setValido(true);
            otp.setFechaValidacion(Instant.now());
            otpRepository.save(otp);
            return Optional.of(otp);
        }

        return Optional.empty();
    }

    // Opcional: obtener último OTP generado (para pruebas)
    public Optional<OtpValidacion> obtenerUltimoOtp(String cedula) {
        return otpRepository.findTopByUsuario_CedulaOrderByFechaEnvioDesc(cedula);
    }
}
