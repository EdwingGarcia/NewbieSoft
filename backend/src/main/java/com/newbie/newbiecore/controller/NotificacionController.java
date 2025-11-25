package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.NotificacionRequestDTO;
import com.newbie.newbiecore.dto.DatosCorreoDTO;
import com.newbie.newbiecore.entity.NotificacionOt;
import com.newbie.newbiecore.repository.NotificacionOtRepository;
import com.newbie.newbiecore.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final NotificacionOtRepository notificacionOtRepository;

    public NotificacionController(NotificacionService notificacionService,
                                  NotificacionOtRepository notificacionOtRepository) {
        this.notificacionService = notificacionService;
        this.notificacionOtRepository = notificacionOtRepository;
    }

    @PostMapping("/ot/{otId}")
    public ResponseEntity<?> enviarNotificacion(
            @PathVariable Long otId,
            @RequestBody NotificacionRequestDTO request) {

        notificacionService.enviarCorreoNotificacion(
                otId,
                request.getMensaje(),
                request.getTecnicoNombre()
        );

        DatosCorreoDTO datos = notificacionService.obtenerDatosCorreoDesdeOT(otId);

        NotificacionOt registro = new NotificacionOt(
                otId,
                request.getTecnicoNombre(),
                datos.getNombreEquipo(),
                datos.getCorreoCliente(),
                request.getMensaje()
        );

        notificacionOtRepository.save(registro);

        return ResponseEntity.ok("Notificación enviada correctamente");
    }
}
