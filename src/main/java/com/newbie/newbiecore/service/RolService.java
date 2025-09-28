package com.newbie.newbiecore.service;


import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.repository.RolRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class RolService {
    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    public Rol crearRol(Rol rol) {
        return rolRepository.save(rol);
    }

    public Optional<Rol> buscarPorNombre(String nombre) {
        return rolRepository.findByNombre(nombre);
    }
}
