package com.newbie.newbiecore.service;

import com.newbie.newbiecore.config.TestContainersConfig;
import com.newbie.newbiecore.dto.UsuarioDto;
import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import com.newbie.newbiecore.repository.RolRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
class UsuarioServiceTest {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    private Rol rolCliente;
    private Rol rolTecnico;
    private Rol rolAdmin;

    @BeforeEach
    void setUp() {
        // Limpiar y crear roles de prueba
        rolRepository.deleteAll();
        usuarioRepository.deleteAll();

        rolCliente = rolRepository.save(Rol.builder()
                .nombre("ROLE_CLIENTE")
                .descripcion("Cliente del sistema")
                .build());

        rolTecnico = rolRepository.save(Rol.builder()
                .nombre("ROLE_TECNICO")
                .descripcion("Técnico de soporte")
                .build());

        rolAdmin = rolRepository.save(Rol.builder()
                .nombre("ROLE_ADMIN")
                .descripcion("Administrador del sistema")
                .build());
    }

    @Test
    @Order(1)
    @DisplayName("Debe registrar un nuevo usuario correctamente")
    void testRegistrarUsuario() {
        // Arrange
        Usuario nuevoUsuario = Usuario.builder()
                .cedula("1234567890")
                .nombre("Juan Pérez")
                .correo("juan.perez@test.com")
                .telefono("0991234567")
                .direccion("Av. Principal 123")
                .password("password123")
                .rol(rolCliente)
                .estado(true)
                .build();

        // Act
        Usuario usuarioGuardado = usuarioService.registrarUsuario(nuevoUsuario);

        // Assert
        assertNotNull(usuarioGuardado);
        assertEquals("1234567890", usuarioGuardado.getCedula());
        assertEquals("Juan Pérez", usuarioGuardado.getNombre());
        assertEquals("juan.perez@test.com", usuarioGuardado.getCorreo());
        // La contraseña debe estar encriptada
        assertNotEquals("password123", usuarioGuardado.getPassword());
        assertTrue(usuarioGuardado.getPassword().startsWith("$2a$"));
    }

    @Test
    @Order(2)
    @DisplayName("Debe listar todos los usuarios")
    void testListarTodos() {
        // Arrange
        crearUsuarioDePrueba("1111111111", "Usuario 1", "usuario1@test.com", rolCliente);
        crearUsuarioDePrueba("2222222222", "Usuario 2", "usuario2@test.com", rolTecnico);
        crearUsuarioDePrueba("3333333333", "Usuario 3", "usuario3@test.com", rolAdmin);

        // Act
        List<Usuario> usuarios = usuarioService.listarTodos();

        // Assert
        assertEquals(3, usuarios.size());
    }

    @Test
    @Order(3)
    @DisplayName("Debe buscar usuario por correo")
    void testBuscarPorCorreo() {
        // Arrange
        crearUsuarioDePrueba("4444444444", "María García", "maria@test.com", rolCliente);

        // Act
        Optional<Usuario> resultado = usuarioService.buscarPorCorreo("maria@test.com");

        // Assert
        assertTrue(resultado.isPresent());
        assertEquals("María García", resultado.get().getNombre());
    }

    @Test
    @Order(4)
    @DisplayName("Debe retornar vacío cuando el correo no existe")
    void testBuscarPorCorreoNoExiste() {
        // Act
        Optional<Usuario> resultado = usuarioService.buscarPorCorreo("noexiste@test.com");

        // Assert
        assertTrue(resultado.isEmpty());
    }

    @Test
    @Order(5)
    @DisplayName("Debe verificar si existe un correo")
    void testExistePorCorreo() {
        // Arrange
        crearUsuarioDePrueba("5555555555", "Pedro López", "pedro@test.com", rolTecnico);

        // Act & Assert
        assertTrue(usuarioService.existePorCorreo("pedro@test.com"));
        assertFalse(usuarioService.existePorCorreo("noexiste@test.com"));
    }

    @Test
    @Order(6)
    @DisplayName("Debe buscar usuario por cédula")
    void testBuscarPorCedula() {
        // Arrange
        crearUsuarioDePrueba("6666666666", "Ana Torres", "ana@test.com", rolCliente);

        // Act
        Optional<Usuario> resultado = usuarioService.buscarPorCedula("6666666666");

        // Assert
        assertTrue(resultado.isPresent());
        assertEquals("Ana Torres", resultado.get().getNombre());
    }

    @Test
    @Order(7)
    @DisplayName("Debe actualizar los datos de un usuario")
    void testActualizarUsuario() {
        // Arrange
        crearUsuarioDePrueba("7777777777", "Carlos Ruiz", "carlos@test.com", rolCliente);

        Usuario datosActualizados = Usuario.builder()
                .nombre("Carlos Ruiz Actualizado")
                .correo("carlos.nuevo@test.com")
                .telefono("0999999999")
                .direccion("Nueva Dirección 456")
                .rol(rolTecnico)
                .estado(true)
                .build();

        // Act
        Optional<UsuarioDto> resultado = usuarioService.actualizarUsuario("7777777777", datosActualizados);

        // Assert
        assertTrue(resultado.isPresent());
        assertEquals("Carlos Ruiz Actualizado", resultado.get().getNombre());
        assertEquals("carlos.nuevo@test.com", resultado.get().getCorreo());
        assertEquals("ROLE_TECNICO", resultado.get().getRol().getNombre());
    }

    @Test
    @Order(8)
    @DisplayName("Debe desactivar un usuario")
    void testDesactivarUsuario() {
        // Arrange
        crearUsuarioDePrueba("8888888888", "Luis Mora", "luis@test.com", rolCliente);

        // Act
        usuarioService.desactivarUsuario("8888888888");

        // Assert
        Optional<Usuario> usuario = usuarioRepository.findById("8888888888");
        assertTrue(usuario.isPresent());
        assertFalse(usuario.get().getEstado());
    }

    @Test
    @Order(9)
    @DisplayName("Debe actualizar contraseña cuando se proporciona")
    void testActualizarContraseña() {
        // Arrange
        Usuario usuarioOriginal = crearUsuarioDePrueba("9999999999", "Test User", "testpwd@test.com", rolCliente);
        String passwordOriginal = usuarioOriginal.getPassword();

        Usuario datosActualizados = Usuario.builder()
                .nombre("Test User")
                .correo("testpwd@test.com")
                .telefono("0991111111")
                .direccion("Dirección Test")
                .password("nuevaContraseña123")
                .rol(rolCliente)
                .estado(true)
                .build();

        // Act
        usuarioService.actualizarUsuario("9999999999", datosActualizados);

        // Assert
        Optional<Usuario> usuarioActualizado = usuarioRepository.findById("9999999999");
        assertTrue(usuarioActualizado.isPresent());
        assertNotEquals(passwordOriginal, usuarioActualizado.get().getPassword());
    }

    // ===================== Métodos auxiliares =====================

    private Usuario crearUsuarioDePrueba(String cedula, String nombre, String correo, Rol rol) {
        Usuario usuario = Usuario.builder()
                .cedula(cedula)
                .nombre(nombre)
                .correo(correo)
                .telefono("0990000000")
                .direccion("Dirección de prueba")
                .password("password123")
                .rol(rol)
                .estado(true)
                .build();
        return usuarioService.registrarUsuario(usuario);
    }
}
