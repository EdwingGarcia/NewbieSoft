package com.newbie.newbiecore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.newbie.newbiecore.config.TestContainersConfig;
import com.newbie.newbiecore.dto.Auth.LoginRequest;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.RolRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TODO: Actualizar para usar IDs únicos
 */
@SpringBootTest
@Import(TestContainersConfig.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Transactional
@Disabled("Requiere actualización para usar IDs únicos")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Rol rolAdmin;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        rolAdmin = rolRepository.save(Rol.builder()
                .nombre("ROLE_ADMIN")
                .descripcion("Administrador")
                .build());

        usuarioRepository.save(Usuario.builder()
                .cedula("ADM001")
                .nombre("Admin Test")
                .correo("admin@test.com")
                .telefono("0991111111")
                .direccion("Dir Admin")
                .password(passwordEncoder.encode("password123"))
                .rol(rolAdmin)
                .estado(true)
                .build());
    }

    @Test
    @Order(1)
    @DisplayName("Debe hacer login correctamente con credenciales válidas")
    void testLoginExitoso() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCorreo("admin@test.com");
        loginRequest.setPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.usuario.correo", is("admin@test.com")))
                .andExpect(jsonPath("$.usuario.nombre", is("Admin Test")));
    }

    @Test
    @Order(2)
    @DisplayName("Debe rechazar login con contraseña incorrecta")
    void testLoginContraseñaIncorrecta() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCorreo("admin@test.com");
        loginRequest.setPassword("wrongpassword");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(3)
    @DisplayName("Debe rechazar login con usuario inexistente")
    void testLoginUsuarioNoExiste() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCorreo("noexiste@test.com");
        loginRequest.setPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    @DisplayName("Debe obtener token y usarlo para acceder a endpoints protegidos")
    void testAccesoConToken() throws Exception {
        // Arrange - Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCorreo("admin@test.com");
        loginRequest.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("token").asText();

        // Act & Assert - Acceso a endpoint protegido
        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    @DisplayName("Debe rechazar acceso sin token")
    void testAccesoSinToken() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(6)
    @DisplayName("Debe rechazar acceso con token inválido")
    void testAccesoTokenInvalido() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
