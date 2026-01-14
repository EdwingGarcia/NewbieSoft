package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.Consultas.*;
import com.newbie.newbiecore.service.ConsultaClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public/consultas")
@RequiredArgsConstructor
public class ConsultaClienteController {

    private final ConsultaClienteService consultaService;


    @PostMapping("/otp")
    public ResponseEntity<?> solicitarOtp(@RequestBody ConsultaOtpRequest request) {
        // Pasar el token capturado en el DTO al servicio
        consultaService.solicitarOtp(
                request.cedula(),
                request.correo(),
                request.recaptchaToken() // <--- Nuevo parámetro
        );
        return ResponseEntity.ok(Map.of("ok", true, "message", "OTP enviado"));
    }
    @PostMapping("/otp/validar")
    public ResponseEntity<ConsultaOtpVerifyResponse> validarOtp(@RequestBody ConsultaOtpVerifyRequest req) {
        return ResponseEntity.ok(consultaService.validarOtpYCrearToken(req.cedula(), req.codigo()));
    }

    @PostMapping("/procedimiento")
    public ResponseEntity<?> procedimiento(@RequestBody ConsultaProcedimientoRequest req) {
        return ResponseEntity.ok(consultaService.consultarProcedimiento(req.consultaToken(), req.numeroOrden()));
    }

    @PostMapping("/historial")
    public ResponseEntity<?> historial(@RequestBody ConsultaHistorialRequest req) {
        return ResponseEntity.ok(consultaService.consultarHistorial(req.consultaToken()));
    }
}
