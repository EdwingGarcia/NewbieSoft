package com.newbie.newbiecore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Configuración dinámica de correo electrónico.
 *
 * Los beans marcados con @RefreshScope se recrean automáticamente
 * cuando se llama a ContextRefresher.refresh().
 */
@Configuration
public class DynamicMailConfig {

    private static final Logger logger = LoggerFactory.getLogger(DynamicMailConfig.class);

    /**
     * JavaMailSender que se recrea automáticamente cuando las propiedades cambian.
     */
    @Bean
    @Primary
    @RefreshScope
    public JavaMailSender javaMailSender(
            @Value("${spring.mail.host:smtp.gmail.com}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") String auth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") String starttls,
            @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}") String connectionTimeout,
            @Value("${spring.mail.properties.mail.smtp.timeout:5000}") String timeout,
            @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}") String writeTimeout,
                    @Value("${spring.mail.properties.mail.smtp.localhost:newbiecore.com}") String localhost  // ← AGREGAR

    ) {
        logger.info("🔄 Creando/Refrescando JavaMailSender con host={}, port={}", host, port);

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", auth);
        props.put("mail.smtp.starttls.enable", starttls);
        props.put("mail.smtp.connectiontimeout", connectionTimeout);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.smtp.writetimeout", writeTimeout);
        props.put("mail.debug", "false");
        props.put("mail.smtp.localhost", localhost);  // ← AGREGAR ESTA LÍNEA

        logger.info("✅ JavaMailSender configurado correctamente");

        return mailSender;
    }
}