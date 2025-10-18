package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.repository.RolRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RolService {

    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    // Crear
    public Rol crearRol(Rol rol) {
        return rolRepository.save(rol);
    }

    // Listar todos
    public List<Rol> listarRoles() {
        return rolRepository.findAll();
    }

    // Buscar por ID
    public Optional<Rol> buscarPorId(Long id) {
        return rolRepository.findById(id);
    }

    // Buscar por nombre
    public Optional<Rol> buscarPorNombre(String nombre) {
        return rolRepository.findByNombre(nombre);
    }

    // Actualizar
    public Optional<Rol> actualizarRol(Long id, Rol rolActualizado) {
        return rolRepository.findById(id).map(rol -> {
            rol.setNombre(rolActualizado.getNombre());
            rol.setDescripcion(rolActualizado.getDescripcion());
            return rolRepository.save(rol);
        });
    }

    // Eliminar
    public boolean eliminarRol(Long id) {
        return rolRepository.findById(id).map(rol -> {
            rolRepository.delete(rol);
            return true;
        }).orElse(false);
    }
}