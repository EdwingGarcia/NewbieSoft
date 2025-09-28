package com.newbie.newbiecore.service;


import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.repository.EquipoRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EquipoService {
    private final EquipoRepository equipoRepository;

    public EquipoService(EquipoRepository equipoRepository) {
        this.equipoRepository = equipoRepository;
    }

    public Equipo registrarEquipo(Equipo equipo) {
        return equipoRepository.save(equipo);
    }

    public List<Equipo> listarPorCliente(Long clienteId) {
        return equipoRepository.findByCliente_IdCliente(clienteId);
    }
}
