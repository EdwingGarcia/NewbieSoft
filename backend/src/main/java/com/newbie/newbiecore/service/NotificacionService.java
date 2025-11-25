package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.DatosCorreoDTO;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.OrdenTrabajo;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.OrdenTrabajoRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import com.newbie.newbiecore.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificacionService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificacionEmailBuilder emailBuilder;

    public NotificacionService(OrdenTrabajoRepository ordenTrabajoRepository,
                               UsuarioRepository usuarioRepository,
                               EquipoRepository equipoRepository) {
        this.ordenTrabajoRepository = ordenTrabajoRepository;
        this.usuarioRepository = usuarioRepository;
        this.equipoRepository = equipoRepository;
    }

    public DatosCorreoDTO obtenerDatosCorreoDesdeOT(Long otId) {

        // Obtener OT
        OrdenTrabajo ot = ordenTrabajoRepository.findById(otId)
                .orElseThrow(() -> new RuntimeException("OT no encontrada: " + otId));

        // El cliente ya viene dentro de la OT
        Usuario cliente = ot.getCliente();

        if (cliente == null) {
            throw new RuntimeException("La OT no tiene cliente asociado");
        }

        // Obtenemos el equipo asociado
        Equipo equipo = ot.getEquipo();

        if (equipo == null) {
            throw new RuntimeException("La OT no tiene equipo asociado");
        }

        // Nombre del equipo será marca + modelo
        String nombreEquipo = equipo.getMarca() + " " + equipo.getModelo();

        return new DatosCorreoDTO(
                nombreEquipo,
                cliente.getCorreo(),
                cliente.getNombre(),
                cliente.getCedula()
        );
    }

    public void enviarCorreoNotificacion(Long otId, String mensaje, String tecnicoNombre) {

        DatosCorreoDTO datos = obtenerDatosCorreoDesdeOT(otId);

        String contenido = emailBuilder.construirMensaje(
                tecnicoNombre,
                datos.getNombreEquipo(),
                mensaje
        );

        emailService.enviarCorreoBasico(
                datos.getCorreoCliente(),
                "Actualización sobre su equipo - NewbieSoft",
                contenido
        );
    }
}
