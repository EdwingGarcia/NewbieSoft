package com.newbie.newbiecore.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.newbie.newbiecore.service.MailService;

@RestController
public class TestEmailController {

    private final MailService emailService;

    public TestEmailController(MailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/test-email")
    public String testEmail(@RequestParam String destinatario) {
        emailService.enviarCorreoPrueba(destinatario);
        return "Correo enviado a " + destinatario;
    }
}
