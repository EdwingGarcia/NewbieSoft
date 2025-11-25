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

    // ===========================================
    // MÉTODO GENERAL (usado en varios módulos)
    // ===========================================
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(to);
        mensaje.setSubject(subject);
        mensaje.setText(body);
        mailSender.send(mensaje);
    }

    // ===========================================
    // OTP (método que usa OtpService)
    // ===========================================
    public void enviarOtp(String correoDestino, String codigoOtp) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(correoDestino);
        msg.setSubject("Código OTP de verificación");
        msg.setText("Su código OTP es: " + codigoOtp);
        mailSender.send(msg);
    }

    // ===========================================
    // PRUEBA DE CORREO (usado en TestEmailController)
    // ===========================================
    public String enviarCorreoPrueba(String correoDestino) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(correoDestino);
        msg.setSubject("Correo de prueba");
        msg.setText("Este es un mensaje de prueba desde el backend de NewbieSoft.");
        mailSender.send(msg);
        return "Correo de prueba enviado a " + correoDestino;
    }
}
