package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.Rol;
import com.newbie.newbiecore.entity.Usuario;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de repositorio para Usuario usando PostgreSQL local.
 * Cada test usa IDs únicos generados con UUID para evitar conflictos.
 * @Transactional hace rollback automático después de cada test.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Transactional
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    private Rol rolCliente;
    private String uniqueId;

    @BeforeEach
    void setUp() {
        // Generar ID único para cada test
        uniqueId = UUID.randomUUID().toString().substring(0, 8);

        // Buscar o crear rol para tests
        rolCliente = rolRepository.findByNombre("ROLE_CLIENTE")
                .orElseGet(() -> rolRepository.save(Rol.builder()
                        .nombre("ROLE_CLIENTE")
                        .descripcion("Cliente")
                        .build()));
    }

    @Test
    @Order(1)
    @DisplayName("Debe guardar un usuario correctamente")
    void testGuardarUsuario() {
        // Arrange
        String cedula = "T" + uniqueId;
        String correo = "test" + uniqueId + "@test.com";
        
        Usuario usuario = crearUsuario(cedula, "Juan Pérez Test", correo);

        // Act
        Usuario guardado = usuarioRepository.save(usuario);

        // Assert
        assertNotNull(guardado);
        assertEquals(cedula, guardado.getCedula());
        assertEquals("Juan Pérez Test", guardado.getNombre());
    }

    @Test
    @Order(2)
    @DisplayName("Debe encontrar usuario por correo")
    void testFindByCorreo() {
        // Arrange
        String cedula = "T" + uniqueId;
        String correo = "maria" + uniqueId + "@test.com";
        
        usuarioRepository.save(crearUsuario(cedula, "María García", correo));

        // Act
        Optional<Usuario> resultado = usuarioRepository.findByCorreo(correo);

        // Assert
        assertTrue(resultado.isPresent());
        assertEquals("María García", resultado.get().getNombre());
    }

    @Test
    @Order(3)
    @DisplayName("Debe retornar vacío si el correo no existe")
    void testFindByCorreoNoExiste() {
        // Act
        String correoNoExistente = "noexiste" + uniqueId + "@test.com";
        Optional<Usuario> resultado = usuarioRepository.findByCorreo(correoNoExistente);

        // Assert
        assertTrue(resultado.isEmpty());
    }

    @Test
    @Order(4)
    @DisplayName("Debe verificar si existe por correo")
    void testExistsByCorreo() {
        // Arrange
        String cedula = "T" + uniqueId;
        String correo = "pedro" + uniqueId + "@test.com";
        
        usuarioRepository.save(crearUsuario(cedula, "Pedro López", correo));

        // Act & Assert
        assertTrue(usuarioRepository.existsByCorreo(correo));
        assertFalse(usuarioRepository.existsByCorreo("noexiste" + uniqueId + "@test.com"));
    }

    @Test
    @Order(5)
    @DisplayName("Debe encontrar usuario por cédula (ID)")
    void testFindById() {
        // Arrange
        String cedula = "T" + uniqueId;
        String correo = "ana" + uniqueId + "@test.com";
        
        usuarioRepository.save(crearUsuario(cedula, "Ana Torres", correo));

        // Act
        Optional<Usuario> resultado = usuarioRepository.findById(cedula);

        // Assert
        assertTrue(resultado.isPresent());
        assertEquals("Ana Torres", resultado.get().getNombre());
    }

    @Test
    @Order(6)
    @DisplayName("Debe listar usuarios (al menos los creados en el test)")
    void testFindAll() {
        // Arrange - contar usuarios existentes
        long countInicial = usuarioRepository.count();
        
        usuarioRepository.save(crearUsuario("U1" + uniqueId, "Usuario 1", "u1" + uniqueId + "@test.com"));
        usuarioRepository.save(crearUsuario("U2" + uniqueId, "Usuario 2", "u2" + uniqueId + "@test.com"));
        usuarioRepository.save(crearUsuario("U3" + uniqueId, "Usuario 3", "u3" + uniqueId + "@test.com"));

        // Act
        List<Usuario> usuarios = usuarioRepository.findAll();

        // Assert - debe haber al menos 3 más que antes
        assertTrue(usuarios.size() >= countInicial + 3);
    }

    @Test
    @Order(7)
    @DisplayName("Debe eliminar un usuario")
    void testDeleteUsuario() {
        // Arrange
        String cedula = "DEL" + uniqueId;
        String correo = "delete" + uniqueId + "@test.com";
        
        Usuario usuario = usuarioRepository.save(crearUsuario(cedula, "Para Eliminar", correo));

        // Act
        usuarioRepository.deleteById(usuario.getCedula());
        usuarioRepository.flush();

        // Assert
        assertFalse(usuarioRepository.existsById(cedula));
    }

    @Test
    @Order(8)
    @DisplayName("Debe actualizar un usuario")
    void testUpdateUsuario() {
        // Arrange
        String cedula = "UPD" + uniqueId;
        String correo = "update" + uniqueId + "@test.com";
        
        Usuario usuario = usuarioRepository.save(crearUsuario(cedula, "Nombre Original", correo));

        // Act
        usuario.setNombre("Nombre Actualizado");
        usuario.setTelefono("0999999999");
        Usuario actualizado = usuarioRepository.save(usuario);

        // Assert
        assertEquals("Nombre Actualizado", actualizado.getNombre());
        assertEquals("0999999999", actualizado.getTelefono());
    }

    @Test
    @Order(9)
    @DisplayName("Debe contar usuarios correctamente")
    void testCountUsuarios() {
        // Arrange - contar usuarios existentes
        long countInicial = usuarioRepository.count();
        
        usuarioRepository.save(crearUsuario("CNT1" + uniqueId, "Usuario 1", "cnt1" + uniqueId + "@test.com"));
        usuarioRepository.save(crearUsuario("CNT2" + uniqueId, "Usuario 2", "cnt2" + uniqueId + "@test.com"));

        // Act
        long count = usuarioRepository.count();

        // Assert - debe haber 2 más que antes
        assertEquals(countInicial + 2, count);
    }

    // ===================== Método auxiliar =====================

    private Usuario crearUsuario(String cedula, String nombre, String correo) {
        return Usuario.builder()
                .cedula(cedula)
                .nombre(nombre)
                .correo(correo)
                .telefono("0990000000")
                .direccion("Dirección Test")
                .password("password123")
                .rol(rolCliente)
                .estado(true)
                .build();
    }
}
