package com.newbie.newbiecore.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.newbie.newbiecore.service.CustomUserDetailsService;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint unauthorizedHandler; // Manejador de errores 401

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CustomUserDetailsService userDetailsService,
                          JwtAuthenticationEntryPoint unauthorizedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.unauthorizedHandler = unauthorizedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Deshabilitar CSRF para APIs REST stateless
                .cors(Customizer.withDefaults()) // Usar configuración de CorsConfig
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler) // Retorna 401 limpio si falla la auth
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Sin estado (JWT)
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. 🟢 RUTAS DE AUTENTICACIÓN Y DOCUMENTACIÓN
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // 2. 🟢 RUTAS DE ARCHIVOS (IMÁGENES)
                        // Se permite acceso público aquí porque el SecureFileController valida el token manualmente.
                       // .requestMatchers("/uploads/**").permitAll()

                       // 3. 🟢 RUTAS PÚBLICAS PARA CONSULTA DE CLIENTES
                        // Permite flujo de OTP, Captcha y ver estado de orden sin login de empleado.
                        .requestMatchers("/api/public/consultas/**").permitAll()
                        .requestMatchers("/api/public/otp/**").permitAll()

                        // 👇 servir archivos subidos (IMPORTANTE)
                        .requestMatchers("/uploads/**").permitAll()

                        // tus endpoints de prueba
                        .requestMatchers("/api/ordenes/**").permitAll()
                        .requestMatchers("/api/firmas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/equipo/*/hardware/upload-xml").permitAll()

                        // lo demás de /api necesita token
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/api/**").permitAll()

                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}