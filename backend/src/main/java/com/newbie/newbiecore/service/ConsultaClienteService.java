package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.Consultas.ConsultaOtpVerifyResponse;
import com.newbie.newbiecore.dto.Consultas.OrdenPublicaDto;
import com.newbie.newbiecore.entity.OtpValidacion;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import com.newbie.newbiecore.repository.OtpValidacionRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ConsultaClienteService {

    private final UsuarioRepository usuarioRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final OtpValidacionRepository otpRepository;
    private final MailService mailService;

    private static final long OTP_TTL_SECONDS = 5 * 60;      // 5 min
    private static final long TOKEN_TTL_SECONDS = 15 * 60;   // 15 min
    private static final int MAX_INTENTOS = 5;

    public void solicitarOtp(String cedula, String correo) {
        var user = usuarioRepository.findById(cedula)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        // 🔒 validar que el correo ingresado coincida con el registrado
        if (!user.getCorreo().equalsIgnoreCase(correo.trim())) {
            throw new IllegalArgumentException("El correo no coincide con el registrado");
        }

        // generar OTP
        String codigo = String.format("%06d", new java.security.SecureRandom().nextInt(999999));
        var now = Instant.now();

        var otp = OtpValidacion.builder()
                .usuario(user)
                .codigo(codigo)
                .fechaEnvio(now)
                .fechaExpiracion(now.plusSeconds(OTP_TTL_SECONDS))
                .valido(false)
                .intentos(0)
                .maxIntentos(MAX_INTENTOS)
                .tipo("CONSULTA_CLIENTE")
                .build();

        otpRepository.save(otp);
        mailService.enviarOtp(user.getCorreo(), codigo);
    }

    public ConsultaOtpVerifyResponse validarOtpYCrearToken(String cedula, String codigo) {
        var otpOpt = otpRepository.findTopByUsuario_CedulaOrderByFechaEnvioDesc(cedula);
        if (otpOpt.isEmpty()) return new ConsultaOtpVerifyResponse(false, "OTP no encontrado", null, 0);

        var otp = otpOpt.get();

        if (!"CONSULTA_CLIENTE".equals(otp.getTipo())) {
            return new ConsultaOtpVerifyResponse(false, "OTP inválido para consulta", null, 0);
        }

        var now = Instant.now();

        if (Boolean.TRUE.equals(otp.getValido())) {
            // ya validado: si token aún vive, lo devuelves
            if (otp.getTokenConsulta() != null && otp.getTokenExpira() != null && otp.getTokenExpira().isAfter(now)) {
                long exp = otp.getTokenExpira().getEpochSecond() - now.getEpochSecond();
                return new ConsultaOtpVerifyResponse(true, "OTP ya validado", otp.getTokenConsulta(), exp);
            }
            // si token expiró, generas uno nuevo
        }

        // expiración
        if (otp.getFechaExpiracion() != null && otp.getFechaExpiracion().isBefore(now)) {
            return new ConsultaOtpVerifyResponse(false, "OTP expirado", null, 0);
        }

        // intentos
        int intentos = otp.getIntentos() == null ? 0 : otp.getIntentos();
        int max = otp.getMaxIntentos() == null ? MAX_INTENTOS : otp.getMaxIntentos();
        if (intentos >= max) {
            return new ConsultaOtpVerifyResponse(false, "OTP bloqueado por intentos", null, 0);
        }

        // validar código
        if (!otp.getCodigo().equals(codigo)) {
            otp.setIntentos(intentos + 1);
            otpRepository.save(otp);
            return new ConsultaOtpVerifyResponse(false, "OTP incorrecto", null, 0);
        }

        // ✅ válido
        otp.setValido(true);
        otp.setFechaValidacion(now);

        String token = java.util.UUID.randomUUID().toString().replace("-", "");
        otp.setTokenConsulta(token);
        otp.setTokenExpira(now.plusSeconds(TOKEN_TTL_SECONDS));

        otpRepository.save(otp);

        return new ConsultaOtpVerifyResponse(true, "OTP validado", token, TOKEN_TTL_SECONDS);
    }

    public String validarTokenYObtenerCedula(String token) {
        var otp = otpRepository.findByTokenConsultaAndTokenExpiraAfterAndValidoTrue(token, Instant.now())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido o expirado"));
        return otp.getUsuario().getCedula();
    }

    public OrdenPublicaDto consultarProcedimiento(String token, String numeroOrden) {
        String cedula = validarTokenYObtenerCedula(token);

        var ot = ordenTrabajoRepository.findByNumeroOrdenAndCliente_Cedula(numeroOrden, cedula)
                .orElseThrow(() -> new IllegalArgumentException("Procedimiento no encontrado"));

        return new OrdenPublicaDto(
                ot.getNumeroOrden(),
                ot.getEstado(),
                ot.getTipoServicio(),
                ot.getPrioridad(),
                ot.getFechaHoraIngreso(),
                ot.getFechaHoraEntrega(),
                ot.getProblemaReportado()
        );
    }

    public java.util.List<OrdenPublicaDto> consultarHistorial(String token) {
        String cedula = validarTokenYObtenerCedula(token);

        return ordenTrabajoRepository.findByCliente_CedulaOrderByFechaHoraIngresoDesc(cedula)
                .stream()
                .map(ot -> new OrdenPublicaDto(
                        ot.getNumeroOrden(),
                        ot.getEstado(),
                        ot.getTipoServicio(),
                        ot.getPrioridad(),
                        ot.getFechaHoraIngreso(),
                        ot.getFechaHoraEntrega(),
                        ot.getProblemaReportado()
                ))
                .toList();
    }
}
