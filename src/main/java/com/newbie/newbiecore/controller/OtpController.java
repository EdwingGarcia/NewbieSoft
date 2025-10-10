package com.newbie.newbiecore.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newbie.newbiecore.dto.OtpRequest;
import com.newbie.newbiecore.dto.OtpResponse;
import com.newbie.newbiecore.dto.OtpVerifyRequest;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.service.OtpService;
import com.newbie.newbiecore.service.UsuarioService;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;
    private final UsuarioService usuarioService;

    public OtpController(OtpService otpService, UsuarioService usuarioService) {
        this.otpService = otpService;
        this.usuarioService = usuarioService;
    }

    @PostMapping("/generar")
    public ResponseEntity<OtpResponse> generarOtp(@RequestBody OtpRequest request) {
        // Ahora request.getClienteId() debe ser la cédula directamente
        Optional<Usuario> clienteOpt = usuarioService.buscarPorCedula(request.getCedula().toString());
        if (clienteOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new OtpResponse(false, "Cliente no encontrado"));
        }

        Usuario cliente = clienteOpt.get();
        otpService.generarOtp(cliente);

        return ResponseEntity.ok(new OtpResponse(true, "OTP enviado al correo"));
    }

    @PostMapping("/validar")
    public ResponseEntity<OtpResponse> validarOtp(@RequestBody OtpVerifyRequest request) {
        return otpService.validarOtp(request.getCedula().toString(), request.getCodigo())
                .map(otp -> ResponseEntity.ok(new OtpResponse(true, "OTP válido")))
                .orElseGet(() -> ResponseEntity.badRequest()
                        .body(new OtpResponse(false, "OTP inválido o expirado")));
    }
}
