package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.Consultas.ConsultaOtpVerifyResponse;
import com.newbie.newbiecore.dto.Consultas.OrdenPublicaDto;
import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.entity.OrdenTrabajoCosto;
import com.newbie.newbiecore.entity.OtpValidacion;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import com.newbie.newbiecore.repository.OtpValidacionRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConsultaClienteService {

    private final UsuarioRepository usuarioRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final OtpValidacionRepository otpRepository;
    private final MailService mailService;

    // Inyectamos la clave desde application.properties
    @Value("${google.recaptcha.secret}")
    private String recaptchaSecret;

    private static final String RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
    private static final long OTP_TTL_SECONDS = 5 * 60;
    private static final long TOKEN_TTL_SECONDS = 15 * 60;
    private static final int MAX_INTENTOS = 5;

    // Modificamos la firma para aceptar el token del captcha
    public void solicitarOtp(String cedula, String correo, String recaptchaToken) {

        // 1. 🛡️ Validar Captcha ANTES de buscar en BD o enviar email
        if (!validarCaptcha(recaptchaToken)) {
            throw new IllegalArgumentException("Captcha inválido. Por favor, verifica que no eres un robot.");
        }

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

    /**
     * Método privado para validar el token con Google
     */
    private boolean validarCaptcha(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        RestTemplate restTemplate = new RestTemplate();
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("secret", recaptchaSecret);
        map.add("response", token);

        try {
            // Google retorna un JSON { "success": true|false, ... }
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(RECAPTCHA_VERIFY_URL, map, Map.class);

            return response != null && (Boolean) response.get("success");
        } catch (Exception e) {
            e.printStackTrace();
            return false; // Si falla la conexión con Google, asumimos inválido por seguridad
        }
    }

    // ... El resto de tus métodos (validarOtpYCrearToken, etc) quedan IGUAL ...

    public ConsultaOtpVerifyResponse validarOtpYCrearToken(String cedula, String codigo) {
        var otpOpt = otpRepository.findTopByUsuario_CedulaOrderByFechaEnvioDesc(cedula);
        if (otpOpt.isEmpty())
            return new ConsultaOtpVerifyResponse(false, "OTP no encontrado", null, 0);

        var otp = otpOpt.get();

        if (!"CONSULTA_CLIENTE".equals(otp.getTipo())) {
            return new ConsultaOtpVerifyResponse(false, "OTP inválido para consulta", null, 0);
        }

        var now = Instant.now();

        if (Boolean.TRUE.equals(otp.getValido())) {
            if (otp.getTokenConsulta() != null && otp.getTokenExpira() != null && otp.getTokenExpira().isAfter(now)) {
                long exp = otp.getTokenExpira().getEpochSecond() - now.getEpochSecond();
                return new ConsultaOtpVerifyResponse(true, "OTP ya validado", otp.getTokenConsulta(), exp);
            }
        }

        if (otp.getFechaExpiracion() != null && otp.getFechaExpiracion().isBefore(now)) {
            return new ConsultaOtpVerifyResponse(false, "OTP expirado", null, 0);
        }

        int intentos = otp.getIntentos() == null ? 0 : otp.getIntentos();
        int max = otp.getMaxIntentos() == null ? MAX_INTENTOS : otp.getMaxIntentos();
        if (intentos >= max) {
            return new ConsultaOtpVerifyResponse(false, "OTP bloqueado por intentos", null, 0);
        }

        if (!otp.getCodigo().equals(codigo)) {
            otp.setIntentos(intentos + 1);
            otpRepository.save(otp);
            return new ConsultaOtpVerifyResponse(false, "OTP incorrecto", null, 0);
        }

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

        return mapToOrdenPublicaDto(ot);
    }

    public java.util.List<OrdenPublicaDto> consultarHistorial(String token) {
        String cedula = validarTokenYObtenerCedula(token);

        return ordenTrabajoRepository.findByCliente_CedulaOrderByFechaHoraIngresoDesc(cedula)
                .stream()
                .map(this::mapToOrdenPublicaDto)
                .toList();
    }

    // Método auxiliar para mapear la Entidad a tu nuevo DTO público
    private OrdenPublicaDto mapToOrdenPublicaDto(OrdenTrabajo ot) {
        // Mapeo del Equipo a EquipoDto
        EquipoDto equipoDto = null;
        if (ot.getEquipo() != null) {
            equipoDto = EquipoDto.builder()
                    .id(ot.getEquipo().getIdEquipo())
                    .numeroSerie(ot.getEquipo().getNumeroSerie())
                    .modelo(ot.getEquipo().getModelo())
                    .marca(ot.getEquipo().getMarca())
                    .build();
        }

        // Mapeo de costos
        List<OrdenPublicaDto.CostoItemDto> costosDto = List.of();
        BigDecimal totalCostos = BigDecimal.ZERO;

        if (ot.getCostos() != null && !ot.getCostos().isEmpty()) {
            costosDto = ot.getCostos().stream()
                    .map(c -> new OrdenPublicaDto.CostoItemDto(
                            c.getTipo(),
                            c.getDescripcion(),
                            c.getCostoUnitario(),
                            c.getCantidad(),
                            c.getSubtotal()))
                    .toList();

            totalCostos = ot.getCostos().stream()
                    .map(OrdenTrabajoCosto::getSubtotal)
                    .filter(s -> s != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return new OrdenPublicaDto(
                ot.getNumeroOrden(),
                ot.getEstado(),
                ot.getTipoServicio(),
                ot.getFechaHoraIngreso(),
                ot.getFechaHoraEntrega(),
                equipoDto,
                ot.getAccesorios(),
                ot.getProblemaReportado(),
                ot.getObservacionesIngreso(),
                ot.getDiagnosticoTrabajo(),
                ot.getObservacionesRecomendaciones(),
                ot.getMotivoCierre(),
                costosDto,
                totalCostos);
    }
}