package com.newbie.newbiecore.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.newbie.newbiecore.dto.LoginRequest;
import com.newbie.newbiecore.dto.LoginResponse;
import com.newbie.newbiecore.dto.RegisterRequest;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints para login, registro y ping")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Login de usuario", description = "Genera un token JWT para autenticación")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login exitoso",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "401", description = "Usuario o contraseña incorrectos")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        logger.info("Login POST recibido para correo: {}", loginRequest.getCorreo());
        try {
            String token = authService.login(loginRequest);
            Usuario usuario = authService.getUsuarioByCorreo(loginRequest.getCorreo());
            String correo = usuario.getCorreo();
            String rol = usuario.getRol().getNombre();
            LoginResponse response = new LoginResponse(token, correo, rol);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error en login: {}", e.getMessage());
            return ResponseEntity.status(401).body("Usuario o contraseña incorrectos");
        }
    }

    @Operation(summary = "Registro de usuario", description = "Crea un nuevo usuario en la base de datos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario registrado correctamente",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = Usuario.class))),
        @ApiResponse(responseCode = "400", description = "Error en los datos enviados")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            Usuario usuario = authService.register(request);
            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Ping de prueba", description = "Endpoint público para verificar que la API está activa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Ping recibido correctamente")
    })
    @GetMapping("/ping")
    public String ping() {
        logger.info("Ping Recibido");
        return "pong";
    }
}
