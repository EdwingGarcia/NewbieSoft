package com.newbie.newbiecore.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import com.newbie.newbiecore.dto.LoginRequest;
import com.newbie.newbiecore.dto.LoginResponse;
import com.newbie.newbiecore.dto.RegisterRequest;
import com.newbie.newbiecore.entity.BlacklistedToken;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.BlacklistedTokenRepository;
import com.newbie.newbiecore.repository.RolRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import com.newbie.newbiecore.util.JwtUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public AuthService(UsuarioRepository usuarioRepository,
                       RolRepository rolRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtils jwtUtils,
                       BlacklistedTokenRepository blacklistedTokenRepository) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    // Registro de usuario
    public Usuario register(RegisterRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new RuntimeException("El correo ya está en uso");
        }

        Rol rol = rolRepository.findById(request.getRol().getIdRol())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        Usuario usuario = Usuario.builder()
                .cedula(request.getCedula())
                .nombre(request.getNombre())
                .correo(request.getCorreo())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(rol)
                .estado(true)
                .build();

        return usuarioRepository.save(usuario);
    }

    // Login con generación de tokens
    public LoginResponse login(LoginRequest request) {
        logger.info("Login iniciado para correo: {}", request.getCorreo());

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> {
                    logger.warn("Usuario no encontrado: {}", request.getCorreo());
                    return new RuntimeException("Usuario no encontrado");
                });

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            logger.warn("Contraseña incorrecta para usuario: {}", request.getCorreo());
            throw new RuntimeException("Usuario o contraseña incorrectos");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                usuario.getCorreo(),
                usuario.getPassword(),
                Collections.emptyList()
        );

        String accessToken = jwtUtils.generateToken(userDetails);
        String refreshToken = jwtUtils.generateRefreshToken(userDetails);

        return new LoginResponse(
                accessToken,
                refreshToken,
                usuario.getCorreo(),
                usuario.getRol().getNombre(),
                getRoles(usuario),
                getPermissions(usuario),
                getScreens(usuario)
        );
    }

    public Usuario getUsuarioByCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    // Roles
    public List<String> getRoles(Usuario usuario) {
        return List.of(usuario.getRol().getNombre());
    }

    // Permisos según rol
    public List<String> getPermissions(Usuario usuario) {
        Rol rol = usuario.getRol();
        if (rol.getNombre().equals("ADMIN")) {
            return List.of("VIEW_DASHBOARD", "EDIT_USER", "VIEW_REPORTS", "MANAGE_SETTINGS");
        } else if (rol.getNombre().equals("USER")) {
            return List.of("VIEW_DASHBOARD", "VIEW_PROFILE");
        }
        return List.of();
    }

    // Pantallas según rol
    public List<String> getScreens(Usuario usuario) {
        Rol rol = usuario.getRol();
        if (rol.getNombre().equals("ROLE_ADMIN")) {
            return List.of("Dashboard", "UserManagement", "Reports", "Settings");
        } else if (rol.getNombre().equals("USER")) {
            return List.of("Dashboard", "Profile");
        }
        return List.of();
    }

    // Refresh token
    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtUtils.validateRefreshToken(refreshToken)) {
            throw new RuntimeException("Refresh token inválido o expirado");
        }

        String correo = jwtUtils.extractUsername(refreshToken);
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                usuario.getCorreo(),
                usuario.getPassword(),
                Collections.emptyList()
        );

        String newAccessToken = jwtUtils.generateToken(userDetails);
        String newRefreshToken = jwtUtils.generateRefreshToken(userDetails);

        return new LoginResponse(
                newAccessToken,
                newRefreshToken,
                usuario.getCorreo(),
                usuario.getRol().getNombre(),
                getRoles(usuario),
                getPermissions(usuario),
                getScreens(usuario)
        );
    }

    // Logout con blacklist persistente
    public void logout(String token) {
        try {
            Date expiration = jwtUtils.getExpirationDate(token);

            BlacklistedToken blacklistedToken = BlacklistedToken.builder()
                    .token(token)
                    .expirationDate(expiration.toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime())
                    .createdAt(LocalDateTime.now())
                    .build();

            blacklistedTokenRepository.save(blacklistedToken);
            logger.info("Token agregado a blacklist correctamente");
        } catch (Exception e) {
            logger.error("Error al invalidar token: {}", e.getMessage());
            throw new RuntimeException("No se pudo invalidar el token");
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }
}