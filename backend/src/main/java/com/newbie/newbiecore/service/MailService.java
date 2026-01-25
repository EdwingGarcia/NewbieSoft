package com.newbie.newbiecore.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ===========================================
    // MÉTODO GENERAL
    // ===========================================
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(to);
        mensaje.setSubject(subject);
        mensaje.setText(body);
        mailSender.send(mensaje);
    }

    // ===========================================
    // OTP
    // ===========================================
    public void enviarOtp(String correoDestino, String codigoOtp) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(correoDestino);
        msg.setSubject("Código OTP de verificación");
        msg.setText("Su código OTP es: " + codigoOtp);
        mailSender.send(msg);
    }

    // ===========================================
    // NUEVO MÉTODO: Enviar UN archivo adjunto (el ZIP)
    // ===========================================
    public void sendEmailWithAttachment(String to, String subject, String body, String filePath) {
        try {
            System.out.println("Intentando enviar correo con archivo: " + filePath);
            File file = new File(filePath);

            if (!file.exists()) {
                System.out.println("ERROR: El archivo a adjuntar no existe: " + filePath);
                return; // O lanzar excepción
            }

            MimeMessage message = mailSender.createMimeMessage();
            // true = multipart (para adjuntos)
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            FileSystemResource fileResource = new FileSystemResource(file);
            helper.addAttachment(file.getName(), fileResource);

            mailSender.send(message);
            System.out.println("Correo enviado con adjunto ZIP a: " + to);

        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException("Error al enviar correo con adjunto: " + e.getMessage());
        }
    }

    // ===========================================
    // NUEVO MÉTODO: Enviar MÚLTIPLES archivos adjuntos
    // ===========================================
    public void sendEmailWithMultipleAttachments(String to, String subject, String body, List<File> archivos) {
        try {
            System.out.println("Intentando enviar correo con " + archivos.size() + " archivos adjuntos");

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            for (File archivo : archivos) {
                if (archivo.exists()) {
                    FileSystemResource fileResource = new FileSystemResource(archivo);
                    helper.addAttachment(archivo.getName(), fileResource);
                    System.out.println(" -> Adjuntando: " + archivo.getName());
                } else {
                    System.out.println(" -> ADVERTENCIA: Archivo no existe: " + archivo.getAbsolutePath());
                }
            }

            mailSender.send(message);
            System.out.println("Correo enviado con " + archivos.size() + " documentos a: " + to);

        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException("Error al enviar correo con múltiples adjuntos: " + e.getMessage());
        }
    }
}