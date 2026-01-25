package com.newbie.newbiecore.service;

import com.newbie.newbiecore.config.TestContainersConfig;
import com.newbie.newbiecore.dto.EquipoDto;
import com.newbie.newbiecore.entity.Equipo;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.EquipoRepository;
import com.newbie.newbiecore.repository.RolRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TODO: Actualizar para usar IDs únicos
 */
@SpringBootTest
@Import(TestContainersConfig.class)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Transactional
@Disabled("Requiere actualización para usar IDs únicos")
class EquipoServiceTest {

    @Autowired
    private EquipoService equipoService;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Usuario cliente;
    private Usuario tecnico;
    private Usuario admin;
    private Rol rolCliente;
    private Rol rolTecnico;
    private Rol rolAdmin;

    @BeforeEach
    void setUp() {
        // Limpiar datos
        equipoRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        // Crear roles
        rolCliente = rolRepository.save(Rol.builder()
                .nombre("ROLE_CLIENTE")
                .descripcion("Cliente")
                .build());

        rolTecnico = rolRepository.save(Rol.builder()
                .nombre("ROLE_TECNICO")
                .descripcion("Técnico")
                .build());

        rolAdmin = rolRepository.save(Rol.builder()
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
                .password(passwordEncoder.encode("password"))
                .rol(rolCliente)
                .estado(true)
                .build());

        tecnico = usuarioRepository.save(Usuario.builder()
                .cedula("TEC001")
                .nombre("Técnico Test")
                .correo("tecnico@test.com")
                .telefono("0992222222")
                .direccion("Dir Técnico")
                .password(passwordEncoder.encode("password"))
                .rol(rolTecnico)
                .estado(true)
                .build());

        admin = usuarioRepository.save(Usuario.builder()
                .cedula("ADM001")
                .nombre("Admin Test")
                .correo("admin@test.com")
                .telefono("0993333333")
                .direccion("Dir Admin")
                .password(passwordEncoder.encode("password"))
                .rol(rolAdmin)
                .estado(true)
                .build());
    }

    @Test
    @Order(1)
    @DisplayName("Técnico debe poder registrar un equipo asignándose a sí mismo")
    void testRegistrarEquipoPorTecnico() {
        // Arrange
        EquipoDto equipoDto = EquipoDto.builder()
                .cedulaCliente("CLI001")
                .numeroSerie("SN-001")
                .modelo("ThinkPad T14")
                .marca("Lenovo")
                .build();

        Authentication auth = crearAuthentication(tecnico.getCorreo(), "ROLE_TECNICO");

        // Act
        Equipo equipo = equipoService.registrarEquipo(equipoDto, auth);

        // Assert
        assertNotNull(equipo);
        assertNotNull(equipo.getIdEquipo());
        assertEquals("SN-001", equipo.getNumeroSerie());
        assertEquals("Lenovo", equipo.getMarca());
        assertEquals("ThinkPad T14", equipo.getModelo());
        assertEquals(cliente.getCedula(), equipo.getUsuario().getCedula());
        assertEquals(tecnico.getCedula(), equipo.getTecnico().getCedula());
    }

    @Test
    @Order(2)
    @DisplayName("Admin debe poder registrar un equipo asignando técnico")
    void testRegistrarEquipoPorAdmin() {
        // Arrange
        EquipoDto equipoDto = EquipoDto.builder()
                .cedulaCliente("CLI001")
                .tecnicoCedula("TEC001")
                .numeroSerie("SN-002")
                .modelo("MacBook Pro")
                .marca("Apple")
                .build();

        Authentication auth = crearAuthentication(admin.getCorreo(), "ROLE_ADMIN");

        // Act
        Equipo equipo = equipoService.registrarEquipo(equipoDto, auth);

        // Assert
        assertNotNull(equipo);
        assertEquals("SN-002", equipo.getNumeroSerie());
        assertEquals("Apple", equipo.getMarca());
        assertEquals(tecnico.getCedula(), equipo.getTecnico().getCedula());
    }

    @Test
    @Order(3)
    @DisplayName("Admin sin técnico asignado debe lanzar excepción")
    void testRegistrarEquipoPorAdminSinTecnico() {
        // Arrange
        EquipoDto equipoDto = EquipoDto.builder()
                .cedulaCliente("CLI001")
                // No se asigna técnico
                .numeroSerie("SN-003")
                .modelo("Dell XPS")
                .marca("Dell")
                .build();

        Authentication auth = crearAuthentication(admin.getCorreo(), "ROLE_ADMIN");

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            equipoService.registrarEquipo(equipoDto, auth);
        });
    }

    @Test
    @Order(4)
    @DisplayName("Debe obtener equipo por ID")
    void testObtenerPorId() {
        // Arrange
        Equipo equipo = crearEquipoDePrueba("SN-004", "HP Pavilion", "HP");

        // Act
        EquipoDto resultado = equipoService.obtenerPorId(equipo.getIdEquipo());

        // Assert
        assertNotNull(resultado);
        assertEquals("SN-004", resultado.getNumeroSerie());
        assertEquals("HP", resultado.getMarca());
    }

    @Test
    @Order(5)
    @DisplayName("Debe lanzar excepción cuando equipo no existe")
    void testObtenerPorIdNoExiste() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            equipoService.obtenerPorId(99999L);
        });
    }

    @Test
    @Order(6)
    @DisplayName("Debe listar equipos por cliente")
    void testListarPorCliente() {
        // Arrange
        crearEquipoDePrueba("SN-005", "Equipo 1", "Marca1");
        crearEquipoDePrueba("SN-006", "Equipo 2", "Marca2");
        crearEquipoDePrueba("SN-007", "Equipo 3", "Marca3");

        // Act
        List<EquipoDto> equipos = equipoService.listarPorCliente("CLI001");

        // Assert
        assertEquals(3, equipos.size());
    }

    @Test
    @Order(7)
    @DisplayName("Debe listar todos los equipos para combobox")
    void testListarTodosParaCombobox() {
        // Arrange
        crearEquipoDePrueba("SN-008", "Laptop 1", "Acer");
        crearEquipoDePrueba("SN-009", "Laptop 2", "Asus");

        // Act
        var equipos = equipoService.listarTodosParaCombobox();

        // Assert
        assertFalse(equipos.isEmpty());
        assertEquals(2, equipos.size());
    }

    // ===================== Métodos auxiliares =====================

    private Authentication crearAuthentication(String correo, String rol) {
        return new UsernamePasswordAuthenticationToken(
                correo,
                null,
                Collections.singletonList(new SimpleGrantedAuthority(rol))
        );
    }

    private Equipo crearEquipoDePrueba(String numeroSerie, String modelo, String marca) {
        Equipo equipo = Equipo.builder()
                .usuario(cliente)
                .tecnico(tecnico)
                .numeroSerie(numeroSerie)
                .modelo(modelo)
                .marca(marca)
                .fechaRegistro(Instant.now())
                .build();
        return equipoRepository.save(equipo);
    }
}
