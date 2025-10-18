package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario registrarUsuario(Usuario usuario) {
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }

    public Optional<Usuario> buscarPorCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo);
    }

    public boolean existePorCorreo(String correo) {
        return usuarioRepository.existsByCorreo(correo);
    }

    public Optional<Usuario> buscarPorCedula(String cedula) {
        return usuarioRepository.findById(cedula);
    }

    public Optional<Usuario> actualizarUsuario(String cedula, Usuario datosActualizados) {
        return usuarioRepository.findById(cedula).map(usuario -> {
            usuario.setNombre(datosActualizados.getNombre());
            usuario.setCorreo(datosActualizados.getCorreo());
            usuario.setRol(datosActualizados.getRol());
            usuario.setEstado(datosActualizados.getEstado());
            return usuarioRepository.save(usuario);
        });
    }

    public ResponseEntity<?> desactivarUsuario(String cedula) {
        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findById(cedula);
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                usuario.setEstado(false);
                usuarioRepository.save(usuario);
                return ResponseEntity.ok("Usuario desactivado");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al desactivar usuario");
        }
    }
}