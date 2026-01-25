package com.newbie.newbiecore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.newbie.newbiecore.config.TestContainersConfig;
import com.newbie.newbiecore.dto.Auth.LoginRequest;
import com.newbie.newbiecore.entity.*;
import com.newbie.newbiecore.repository.*;
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

import java.time.Instant;

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
class OrdenTrabajoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrdenTrabajoRepository ordenTrabajoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String tecnicoToken;
    private Usuario cliente;
    private Usuario tecnico;
    private Usuario admin;
    private Equipo equipo;

    @BeforeEach
    void setUp() throws Exception {
        // Limpiar datos
        ordenTrabajoRepository.deleteAll();
        equipoRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        // Crear roles
        Rol rolCliente = rolRepository.save(Rol.builder()
                .nombre("ROLE_CLIENTE")
                .descripcion("Cliente")
                .build());

        Rol rolTecnico = rolRepository.save(Rol.builder()
                .nombre("ROLE_TECNICO")
                .descripcion("Técnico")
                .build());

        Rol rolAdmin = rolRepository.save(Rol.builder()
                .nombre("ROLE_ADMIN")
                .descripcion("Administrador")
                .build());

        // Crear usuarios
        cliente = usuarioRepository.save(Usuario.builder()
                .cedula("CLI001")
                .nombre("Cliente Test")
                .correo("cliente@test.com")
                .telefono("0991111111")
                .direccion("Dir Cliente")
                .password(passwordEncoder.encode("password123"))
                .rol(rolCliente)
                .estado(true)
                .build());

        tecnico = usuarioRepository.save(Usuario.builder()
                .cedula("TEC001")
                .nombre("Técnico Test")
                .correo("tecnico@test.com")
                .telefono("0992222222")
                .direccion("Dir Técnico")
                .password(passwordEncoder.encode("password123"))
                .rol(rolTecnico)
                .estado(true)
                .build());

        admin = usuarioRepository.save(Usuario.builder()
                .cedula("ADM001")
                .nombre("Admin Test")
                .correo("admin@test.com")
                .telefono("0993333333")
                .direccion("Dir Admin")
                .password(passwordEncoder.encode("password123"))
                .rol(rolAdmin)
                .estado(true)
                .build());

        // Crear equipo
        equipo = equipoRepository.save(Equipo.builder()
                .usuario(cliente)
                .tecnico(tecnico)
                .numeroSerie("SN-TEST-001")
                .modelo("Laptop Test")
                .marca("TestBrand")
                .fechaRegistro(Instant.now())
                .build());

        // Obtener tokens
        adminToken = obtenerToken("admin@test.com", "password123");
        tecnicoToken = obtenerToken("tecnico@test.com", "password123");
    }

    private String obtenerToken(String correo, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCorreo(correo);
        loginRequest.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    @Test
    @Order(1)
    @DisplayName("Admin debe poder crear una orden de trabajo")
    void testCrearOrdenPorAdmin() throws Exception {
        // Arrange
        String requestBody = """
            {
                "clienteCedula": "CLI001",
                "tecnicoCedula": "TEC001",
                "equipoId": %d,
                "medioContacto": "PRESENCIAL",
                "contrasenaEquipo": "1234",
                "accesorios": "Cargador, mouse",
                "problemaReportado": "La laptop no enciende",
                "observacionesIngreso": "Sin daños físicos",
                "tipoServicio": "REPARACION",
                "prioridad": "ALTA"
            }
            """.formatted(equipo.getIdEquipo());

        // Act & Assert
        mockMvc.perform(post("/api/ordenes-trabajo")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ordenId", notNullValue()))
                .andExpect(jsonPath("$.numeroOrden", startsWith("OT-")))
                .andExpect(jsonPath("$.clienteCedula", is("CLI001")))
                .andExpect(jsonPath("$.tecnicoCedula", is("TEC001")));
    }

    @Test
    @Order(2)
    @DisplayName("Técnico debe poder crear una orden asignándose a sí mismo")
    void testCrearOrdenPorTecnico() throws Exception {
        // Arrange
        String requestBody = """
            {
                "clienteCedula": "CLI001",
                "equipoId": %d,
                "medioContacto": "TELEFONO",
                "problemaReportado": "Problema de software",
                "tipoServicio": "MANTENIMIENTO",
                "prioridad": "MEDIA"
            }
            """.formatted(equipo.getIdEquipo());

        // Act & Assert
        mockMvc.perform(post("/api/ordenes-trabajo")
                        .header("Authorization", "Bearer " + tecnicoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tecnicoCedula", is("TEC001")));
    }

    @Test
    @Order(3)
    @DisplayName("Debe listar todas las órdenes de trabajo")
    void testListarOrdenes() throws Exception {
        // Arrange - Crear algunas órdenes
        crearOrdenDePrueba();
        crearOrdenDePrueba();

        // Act & Assert
        mockMvc.perform(get("/api/ordenes-trabajo")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @Order(4)
    @DisplayName("Debe obtener detalle de una orden")
    void testObtenerDetalleOrden() throws Exception {
        // Arrange
        OrdenTrabajo orden = crearOrdenDePrueba();

        // Act & Assert
        mockMvc.perform(get("/api/ordenes-trabajo/" + orden.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ordenId", is(orden.getId().intValue())))
                .andExpect(jsonPath("$.numeroOrden", is(orden.getNumeroOrden())));
    }

    @Test
    @Order(5)
    @DisplayName("Debe retornar 404 para orden inexistente")
    void testOrdenNoExiste() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/ordenes-trabajo/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(6)
    @DisplayName("Debe actualizar una orden de trabajo")
    void testActualizarOrden() throws Exception {
        // Arrange
        OrdenTrabajo orden = crearOrdenDePrueba();

        String requestBody = """
            {
                "diagnosticoTrabajo": "Se encontró problema en el disco duro",
                "observacionesRecomendaciones": "Se recomienda reemplazar disco"
            }
            """;

        // Act & Assert
        mockMvc.perform(put("/api/ordenes-trabajo/" + orden.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        // Verificar actualización
        OrdenTrabajo ordenActualizada = ordenTrabajoRepository.findById(orden.getId()).orElseThrow();
        Assertions.assertEquals("Se encontró problema en el disco duro", ordenActualizada.getDiagnosticoTrabajo());
    }

    @Test
    @Order(7)
    @DisplayName("Sin token debe rechazar acceso")
    void testSinTokenRechaza() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/ordenes-trabajo"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== Métodos auxiliares =====================

    private OrdenTrabajo crearOrdenDePrueba() {
        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden("OT-" + String.format("%05d", ordenTrabajoRepository.count() + 1))
                .medioContacto("PRESENCIAL")
                .tecnicoAsignado(tecnico)
                .cliente(cliente)
                .equipo(equipo)
                .contrasenaEquipo("1234")
                .accesorios("Cargador")
                .problemaReportado("Problema de prueba")
                .observacionesIngreso("Observación de prueba")
                .tipoServicio("REPARACION")
                .prioridad("MEDIA")
                .estado("PENDIENTE")
                .condicionesAceptadas(true)
                .build();
        return ordenTrabajoRepository.save(orden);
    }
}
