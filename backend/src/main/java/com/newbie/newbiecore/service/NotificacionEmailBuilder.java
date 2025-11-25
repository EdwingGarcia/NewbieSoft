package com.newbie.newbiecore.service;

import org.springframework.stereotype.Component;

@Component
public class NotificacionEmailBuilder {

    public String construirMensaje(String tecnico, String nombreEquipo, String mensaje) {

        return "Estimado cliente,\n\n" +
                "Su técnico " + tecnico +
                " le envía la siguiente notificación sobre el equipo \"" +
                nombreEquipo + "\":\n\n" +
                "\"" + mensaje + "\"\n\n" +
                "Recuerde: esta es una notificación del estado de reparación.\n" +
                "No es necesario responder este mensaje.\n\n" +
                "Atentamente,\n" +
                "NewbieSoft – Soporte Técnico";
    }
}
