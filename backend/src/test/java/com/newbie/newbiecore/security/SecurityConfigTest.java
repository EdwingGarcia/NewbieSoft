package com.newbie.newbiecore.security;

import com.newbie.newbiecore.config.TestContainersConfig;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.RolRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        Rol rolAdmin = rolRepository.save(Rol.builder()
                .nombre("ROLE_ADMIN")
                .descripcion("Administrador")
                .build());

        usuarioRepository.save(Usuario.builder()
                .cedula("ADM001")
                .nombre("Admin Test")
                .correo("admin@test.com")
                .password(passwordEncoder.encode("password123"))
                .rol(rolAdmin)
                .estado(true)
                .build());
    }

    @Test
    @Order(1)
    @DisplayName("Endpoints públicos deben ser accesibles sin autenticación")
    void testEndpointsPublicos() throws Exception {
        // /api/auth/login es público
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"correo\":\"test@test.com\",\"password\":\"test\"}"))
                .andExpect(status().isUnauthorized()); // 401 porque credenciales incorrectas, pero accedió

        // Swagger debe ser accesible
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection()); // Redirige a swagger-ui/index.html
    }

    @Test
    @Order(2)
    @DisplayName("Endpoints protegidos deben rechazar sin token")
    void testEndpointsProtegidosSinToken() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/ordenes-trabajo"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(3)
    @DisplayName("Token malformado debe ser rechazado")
    void testTokenMalformado() throws Exception {
        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer token.invalido.formato"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    @DisplayName("Token sin prefijo Bearer debe ser rechazado")
    void testTokenSinBearer() throws Exception {
        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "alguntoken"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    @DisplayName("Request sin header Authorization debe ser rechazado")
    void testSinHeaderAuthorization() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(6)
    @DisplayName("CORS debe estar configurado correctamente")
    void testCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/usuarios")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    @Order(7)
    @DisplayName("Métodos HTTP no permitidos deben retornar 405")
    void testMetodosNoPermitidos() throws Exception {
        // POST a un endpoint que solo acepta GET
        mockMvc.perform(post("/swagger-ui.html"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @Order(8)
    @DisplayName("Actuator health debe ser accesible")
    void testActuatorHealth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}
