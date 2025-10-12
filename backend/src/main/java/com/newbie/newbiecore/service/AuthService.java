package com.newbie.newbiecore.service;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.newbie.newbiecore.dto.LoginRequest;
import com.newbie.newbiecore.dto.RegisterRequest;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.RolRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import com.newbie.newbiecore.util.JwtUtils;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    public AuthService(UsuarioRepository usuarioRepository,
                       RolRepository rolRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtils jwtUtils) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
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

 
    public String login(LoginRequest request) {
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

        return jwtUtils.generateToken(userDetails);
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
}
