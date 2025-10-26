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
import com.newbie.newbiecore.entity.OtpValidacion;


import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;


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
        System.out.println("📨 Solicitud OTP recibida para cédula: " + request.getCedula() + " correo: " + request.getCorreo());
        try {
            Optional<Usuario> clienteOpt = usuarioService.buscarPorCedula(request.getCedula().toString());

            if (clienteOpt.isEmpty()) {
                System.out.println("❌ Cliente no encontrado");
                return ResponseEntity.badRequest().body(new OtpResponse(false, "Cliente no encontrado"));
            }

            Usuario cliente = clienteOpt.get();
            System.out.println("✅ Cliente encontrado: " + cliente.getCorreo());

            otpService.generarOtp(cliente); // 👈 aquí puede estar fallando
            System.out.println("✅ OTP generado y enviado");

            return ResponseEntity.ok(new OtpResponse(true, "OTP enviado al correo"));

        } catch (Exception e) {
            e.printStackTrace(); // 🔥 imprime causa real
            return ResponseEntity.internalServerError()
                    .body(new OtpResponse(false, "Error interno: " + e.getMessage()));
        }
    }


    @PostMapping("/validar")
    public ResponseEntity<?> validarOtp(@RequestBody OtpVerifyRequest request) {
        Optional<OtpValidacion> otpOpt = otpService.validarOtp(request.getCedula().toString(), request.getCodigo());

        if (otpOpt.isPresent()) {
            try {
                File file = new File("src/main/resources/static/archivo-prueba.pdf");
                InputStreamResource resource = new InputStreamResource(new FileInputStream(file));

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName())
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al cargar archivo");
            }
        }

        return ResponseEntity.badRequest().body("OTP inválido o expirado");
    }

}
