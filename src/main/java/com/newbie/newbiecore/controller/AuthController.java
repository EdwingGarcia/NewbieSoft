package com.newbie.newbiecore.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newbie.newbiecore.dto.LoginRequest;
import com.newbie.newbiecore.dto.LoginResponse;
import com.newbie.newbiecore.dto.RegisterRequest;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        logger.info("Login POST recibido para correo: {}", loginRequest.getCorreo());
        try {
            logger.info("Intentando generar token...");
            String token = authService.login(loginRequest);
            logger.info("Token generado correctamente");

            logger.info("Buscando usuario en DB...");
            Usuario usuario = authService.getUsuarioByCorreo(loginRequest.getCorreo());
            logger.info("Usuario encontrado: {}", usuario.getNombre());

            String correo = usuario.getCorreo();
            String rol = usuario.getRol().getNombre(); // nombre del rol desde la entidad
            logger.info("Rol del usuario: {}", rol);

            LoginResponse response = new LoginResponse(token, correo, rol);
            logger.info("LoginResponse creado, retornando OK");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error en login: {}", e.getMessage());
            return ResponseEntity.status(401).body("Usuario o contraseña incorrectos");
        }
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
        	logger.info("LLEGO");
            Usuario usuario = authService.register(request);
            return ResponseEntity.ok(usuario); // Devuelve el usuario creado
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/ping")
    public String ping() {
    	logger.info("Ping Recibido");
        return "pong";
    }
}
