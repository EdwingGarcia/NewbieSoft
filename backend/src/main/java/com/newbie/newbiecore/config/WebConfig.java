package com.newbie.newbiecore.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    // Comentado: Los archivos ahora se sirven a través de DocumentoController con
    // autenticación
    // @Override
    // public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // String path =
    // Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
    // registry.addResourceHandler("/uploads/**")
    // .addResourceLocations(path);
    // }
}
