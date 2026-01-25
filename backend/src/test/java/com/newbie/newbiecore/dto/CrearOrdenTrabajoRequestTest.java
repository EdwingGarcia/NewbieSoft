package com.newbie.newbiecore.dto;

import com.newbie.newbiecore.dto.OrdenTrabajo.CrearOrdenTrabajoRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.*;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CrearOrdenTrabajoRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Request válido no debe tener violaciones")
    void testRequestValido() {
        // Arrange
        CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
        request.setClienteCedula("1234567890");
        request.setTecnicoCedula("0987654321");
        request.setEquipoId(1L);
        request.setMedioContacto("PRESENCIAL");
        request.setProblemaReportado("El equipo no enciende");
        request.setTipoServicio("REPARACION");
        request.setPrioridad("ALTA");

        // Act
        Set<ConstraintViolation<CrearOrdenTrabajoRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Debe permitir campos opcionales vacíos")
    void testCamposOpcionales() {
        // Arrange
        CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
        request.setClienteCedula("1234567890");
        request.setEquipoId(1L);
        request.setMedioContacto("TELEFONO");
        request.setProblemaReportado("Problema de software");
        request.setTipoServicio("MANTENIMIENTO");
        request.setPrioridad("MEDIA");
        // Sin contraseña, accesorios, observaciones (opcionales)

        // Act
        Set<ConstraintViolation<CrearOrdenTrabajoRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Debe poder establecer todos los campos")
    void testSetterYGetter() {
        // Arrange & Act
        CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
        request.setClienteCedula("CLI001");
        request.setTecnicoCedula("TEC001");
        request.setEquipoId(100L);
        request.setMedioContacto("WHATSAPP");
        request.setContrasenaEquipo("1234");
        request.setAccesorios("Cargador, Mouse, Teclado");
        request.setProblemaReportado("Pantalla azul constante");
        request.setObservacionesIngreso("Equipo en buen estado físico");
        request.setTipoServicio("DIAGNOSTICO");
        request.setPrioridad("URGENTE");

        // Assert
        assertEquals("CLI001", request.getClienteCedula());
        assertEquals("TEC001", request.getTecnicoCedula());
        assertEquals(100L, request.getEquipoId());
        assertEquals("WHATSAPP", request.getMedioContacto());
        assertEquals("1234", request.getContrasenaEquipo());
        assertEquals("Cargador, Mouse, Teclado", request.getAccesorios());
        assertEquals("Pantalla azul constante", request.getProblemaReportado());
        assertEquals("Equipo en buen estado físico", request.getObservacionesIngreso());
        assertEquals("DIAGNOSTICO", request.getTipoServicio());
        assertEquals("URGENTE", request.getPrioridad());
    }

    @Test
    @DisplayName("Debe manejar diferentes medios de contacto")
    void testMediosContacto() {
        // Arrange
        String[] mediosValidos = {"PRESENCIAL", "TELEFONO", "WHATSAPP", "EMAIL", "REDES_SOCIALES"};

        for (String medio : mediosValidos) {
            CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
            request.setClienteCedula("CLI001");
            request.setEquipoId(1L);
            request.setMedioContacto(medio);
            request.setProblemaReportado("Problema");
            request.setTipoServicio("REPARACION");
            request.setPrioridad("MEDIA");

            // Act
            Set<ConstraintViolation<CrearOrdenTrabajoRequest>> violations = validator.validate(request);

            // Assert
            assertTrue(violations.isEmpty(), "Medio de contacto " + medio + " debería ser válido");
        }
    }

    @Test
    @DisplayName("Debe manejar diferentes tipos de servicio")
    void testTiposServicio() {
        // Arrange
        String[] tipos = {"REPARACION", "MANTENIMIENTO", "DIAGNOSTICO", "INSTALACION", "ACTUALIZACION"};

        for (String tipo : tipos) {
            CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
            request.setClienteCedula("CLI001");
            request.setEquipoId(1L);
            request.setMedioContacto("PRESENCIAL");
            request.setProblemaReportado("Problema");
            request.setTipoServicio(tipo);
            request.setPrioridad("MEDIA");

            // Act
            Set<ConstraintViolation<CrearOrdenTrabajoRequest>> violations = validator.validate(request);

            // Assert
            assertTrue(violations.isEmpty(), "Tipo de servicio " + tipo + " debería ser válido");
        }
    }

    @Test
    @DisplayName("Debe manejar diferentes prioridades")
    void testPrioridades() {
        // Arrange
        String[] prioridades = {"BAJA", "MEDIA", "ALTA", "URGENTE"};

        for (String prioridad : prioridades) {
            CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
            request.setClienteCedula("CLI001");
            request.setEquipoId(1L);
            request.setMedioContacto("PRESENCIAL");
            request.setProblemaReportado("Problema");
            request.setTipoServicio("REPARACION");
            request.setPrioridad(prioridad);

            // Act
            Set<ConstraintViolation<CrearOrdenTrabajoRequest>> violations = validator.validate(request);

            // Assert
            assertTrue(violations.isEmpty(), "Prioridad " + prioridad + " debería ser válida");
        }
    }
}
