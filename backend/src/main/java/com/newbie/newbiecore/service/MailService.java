package com.newbie.newbiecore.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarOtp(String correoDestino, String codigo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(correoDestino);
        mensaje.setSubject("Código OTP - Newbie Soporte Técnico");
        mensaje.setText("Tu código OTP es: " + codigo + "\nEste código expira en 10 minutos.");
        mailSender.send(mensaje);
    }
    
    public void enviarCorreoPrueba(String destinatario) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject("Correo de prueba");
        mensaje.setText("¡Hola! Este es un correo de prueba desde Spring Boot.");
        mensaje.setFrom("tu_correo@gmail.com");

        mailSender.send(mensaje);
    }
}
