package com.newbie.newbiecore.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UsuarioTest {

    @Test
    @DisplayName("Debe crear un usuario con builder")
    void testCrearUsuarioConBuilder() {
        // Arrange
        Rol rol = Rol.builder()
                .idRol(1L)
                .nombre("ROLE_CLIENTE")
                .descripcion("Cliente del sistema")
                .build();

        // Act
        Usuario usuario = Usuario.builder()
                .cedula("1234567890")
                .nombre("Juan Pérez")
                .correo("juan.perez@test.com")
                .telefono("0991234567")
                .direccion("Av. Principal 123")
                .password("encodedPassword")
                .rol(rol)
                .estado(true)
                .build();

        // Assert
        assertNotNull(usuario);
        assertEquals("1234567890", usuario.getCedula());
        assertEquals("Juan Pérez", usuario.getNombre());
        assertEquals("juan.perez@test.com", usuario.getCorreo());
        assertEquals("0991234567", usuario.getTelefono());
        assertEquals("Av. Principal 123", usuario.getDireccion());
        assertTrue(usuario.getEstado());
        assertEquals("ROLE_CLIENTE", usuario.getRol().getNombre());
    }

    @Test
    @DisplayName("Debe poder modificar datos del usuario")
    void testModificarUsuario() {
        // Arrange
        Usuario usuario = Usuario.builder()
                .cedula("1234567890")
                .nombre("Nombre Original")
                .correo("original@test.com")
                .estado(true)
                .build();

        // Act
        usuario.setNombre("Nombre Modificado");
        usuario.setCorreo("modificado@test.com");
        usuario.setTelefono("0999999999");

        // Assert
        assertEquals("Nombre Modificado", usuario.getNombre());
        assertEquals("modificado@test.com", usuario.getCorreo());
        assertEquals("0999999999", usuario.getTelefono());
    }

    @Test
    @DisplayName("Estado activo por defecto debe ser true")
    void testEstadoActivoPorDefecto() {
        // Arrange & Act
        Usuario usuario = new Usuario();
        usuario.setCedula("TEST001");
        usuario.setNombre("Test");
        usuario.setCorreo("test@test.com");
        usuario.setPassword("password");

        // Assert - El estado por defecto es true según la entidad
        assertTrue(usuario.getEstado());
    }

    @Test
    @DisplayName("Debe poder desactivar usuario")
    void testDesactivarUsuario() {
        // Arrange
        Usuario usuario = Usuario.builder()
                .cedula("1234567890")
                .nombre("Usuario Activo")
                .correo("activo@test.com")
                .password("password")
                .estado(true)
                .build();

        // Act
        usuario.setEstado(false);

        // Assert
        assertFalse(usuario.getEstado());
    }

    @Test
    @DisplayName("Debe poder asignar diferentes roles")
    void testAsignarRoles() {
        // Arrange
        Rol rolAdmin = Rol.builder().nombre("ROLE_ADMIN").descripcion("Administrador").build();
        Rol rolTecnico = Rol.builder().nombre("ROLE_TECNICO").descripcion("Técnico").build();
        Rol rolCliente = Rol.builder().nombre("ROLE_CLIENTE").descripcion("Cliente").build();

        Usuario usuario = Usuario.builder()
                .cedula("1234567890")
                .nombre("Test User")
                .correo("test@test.com")
                .password("password")
                .estado(true)
                .build();

        // Act & Assert - Admin
        usuario.setRol(rolAdmin);
        assertEquals("ROLE_ADMIN", usuario.getRol().getNombre());

        // Act & Assert - Técnico
        usuario.setRol(rolTecnico);
        assertEquals("ROLE_TECNICO", usuario.getRol().getNombre());

        // Act & Assert - Cliente
        usuario.setRol(rolCliente);
        assertEquals("ROLE_CLIENTE", usuario.getRol().getNombre());
    }

    @Test
    @DisplayName("Cédula debe ser único identificador")
    void testCedulaComoId() {
        // Arrange
        Usuario usuario1 = Usuario.builder()
                .cedula("1111111111")
                .nombre("Usuario 1")
                .correo("user1@test.com")
                .password("password")
                .build();

        Usuario usuario2 = Usuario.builder()
                .cedula("2222222222")
                .nombre("Usuario 2")
                .correo("user2@test.com")
                .password("password")
                .build();

        // Assert
        assertNotEquals(usuario1.getCedula(), usuario2.getCedula());
        assertEquals("1111111111", usuario1.getCedula());
        assertEquals("2222222222", usuario2.getCedula());
    }
}
