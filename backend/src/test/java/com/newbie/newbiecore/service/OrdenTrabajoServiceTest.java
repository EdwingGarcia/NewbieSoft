package com.newbie.newbiecore.service;

import com.newbie.newbiecore.config.TestContainersConfig;
import com.newbie.newbiecore.dto.OrdenTrabajo.*;
import com.newbie.newbiecore.entity.*;
import com.newbie.newbiecore.repository.*;
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
class OrdenTrabajoServiceTest {

    @Autowired
    private OrdenTrabajoService ordenTrabajoService;

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

    private Usuario cliente;
    private Usuario tecnico;
    private Usuario admin;
    private Equipo equipo;
    private Rol rolCliente;
    private Rol rolTecnico;
    private Rol rolAdmin;

    @BeforeEach
    void setUp() {
        // Limpiar datos
        ordenTrabajoRepository.deleteAll();
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

        // Crear equipo
        equipo = equipoRepository.save(Equipo.builder()
                .usuario(cliente)
                .tecnico(tecnico)
                .numeroSerie("SN-TEST-001")
                .modelo("Laptop Test")
                .marca("TestBrand")
                .fechaRegistro(Instant.now())
                .build());
    }

    @Test
    @Order(1)
    @DisplayName("Debe crear una orden de trabajo correctamente")
    void testCrearOrden() {
        // Arrange
        CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
        request.setClienteCedula("CLI001");
        request.setTecnicoCedula("TEC001");
        request.setEquipoId(equipo.getIdEquipo());
        request.setMedioContacto("PRESENCIAL");
        request.setContrasenaEquipo("1234");
        request.setAccesorios("Cargador, mouse");
        request.setProblemaReportado("La laptop no enciende");
        request.setObservacionesIngreso("Equipo sin daños físicos");
        request.setTipoServicio("REPARACION");
        request.setPrioridad("ALTA");

        Authentication auth = crearAuthentication(admin.getCorreo(), "ROLE_ADMIN");

        // Act
        OrdenTrabajoIngresoDto resultado = ordenTrabajoService.crearOrden(request, auth);

        // Assert
        assertNotNull(resultado);
        assertNotNull(resultado.ordenId());
        assertTrue(resultado.numeroOrden().startsWith("OT-"));
        assertEquals("PRESENCIAL", resultado.medioContacto());
        assertEquals("CLI001", resultado.clienteCedula());
        assertEquals("TEC001", resultado.tecnicoCedula());
        assertEquals("La laptop no enciende", resultado.problemaReportado());
    }

    @Test
    @Order(2)
    @DisplayName("Técnico debe poder crear orden asignándose a sí mismo")
    void testCrearOrdenPorTecnico() {
        // Arrange
        CrearOrdenTrabajoRequest request = new CrearOrdenTrabajoRequest();
        request.setClienteCedula("CLI001");
        request.setEquipoId(equipo.getIdEquipo());
        request.setMedioContacto("TELEFONO");
        request.setProblemaReportado("Problema de software");
        request.setTipoServicio("MANTENIMIENTO");
        request.setPrioridad("MEDIA");

        Authentication auth = crearAuthentication(tecnico.getCorreo(), "ROLE_TECNICO");

        // Act
        OrdenTrabajoIngresoDto resultado = ordenTrabajoService.crearOrden(request, auth);

        // Assert
        assertNotNull(resultado);
        assertEquals("TEC001", resultado.tecnicoCedula()); // Se asigna a sí mismo
    }

    @Test
    @Order(3)
    @DisplayName("Debe obtener ingreso de una orden")
    void testObtenerIngreso() {
        // Arrange
        OrdenTrabajo orden = crearOrdenDePrueba();

        // Act
        OrdenTrabajoIngresoDto resultado = ordenTrabajoService.obtenerIngreso(orden.getId());

        // Assert
        assertNotNull(resultado);
        assertEquals(orden.getNumeroOrden(), resultado.numeroOrden());
        assertEquals("CLI001", resultado.clienteCedula());
    }

    @Test
    @Order(4)
    @DisplayName("Debe lanzar excepción cuando orden no existe")
    void testObtenerIngresoNoExiste() {
        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ordenTrabajoService.obtenerIngreso(99999L);
        });
    }

    @Test
    @Order(5)
    @DisplayName("Debe actualizar datos de entrega")
    void testActualizarEntrega() {
        // Arrange
        OrdenTrabajo orden = crearOrdenDePrueba();

        ActualizarEntregaRequest request = new ActualizarEntregaRequest(
                "REPARACION",           // tipoServicio
                "ALTA",                 // prioridad
                "EN_DIAGNOSTICO",       // estado
                false,                  // cerrarOrden
                "Diagnóstico: Problema de disco duro",  // diagnosticoTrabajo
                "Recomendación: Reemplazar disco",      // observacionesRecomendaciones
                null,                   // costoManoObra
                null,                   // costoRepuestos
                null,                   // costoOtros
                null,                   // descuento
                null,                   // subtotal
                null,                   // iva
                null,                   // total
                null,                   // esEnGarantia
                null,                   // referenciaOrdenGarantia
                null,                   // motivoCierre
                null,                   // cerradaPor
                null,                   // otpCodigo
                null                    // otpValidado
        );

        // Act
        ordenTrabajoService.actualizarEntrega(orden.getId(), request);

        // Assert
        OrdenTrabajo ordenActualizada = ordenTrabajoRepository.findById(orden.getId()).orElseThrow();
        assertEquals("Diagnóstico: Problema de disco duro", ordenActualizada.getDiagnosticoTrabajo());
        assertEquals("Recomendación: Reemplazar disco", ordenActualizada.getObservacionesRecomendaciones());
    }

    @Test
    @Order(6)
    @DisplayName("Debe listar órdenes de trabajo")
    void testListarOrdenes() {
        // Arrange
        crearOrdenDePrueba();
        crearOrdenDePrueba();
        crearOrdenDePrueba();

        // Act
        List<OrdenTrabajoListaDto> ordenes = ordenTrabajoService.listarOrdenes();

        // Assert
        assertEquals(3, ordenes.size());
    }

    @Test
    @Order(7)
    @DisplayName("Debe contar órdenes pendientes usando repository")
    void testContarPendientes() {
        // Arrange
        crearOrdenDePrueba(); // Estado PENDIENTE por defecto
        crearOrdenDePrueba();

        // Act - usar el repository directamente
        long count = ordenTrabajoRepository.countByEstado("PENDIENTE");

        // Assert
        assertEquals(2, count);
    }

    @Test
    @Order(8)
    @DisplayName("Debe generar número de orden único")
    void testNumeroOrdenUnico() {
        // Arrange & Act
        OrdenTrabajo orden1 = crearOrdenDePrueba();
        OrdenTrabajo orden2 = crearOrdenDePrueba();
        OrdenTrabajo orden3 = crearOrdenDePrueba();

        // Assert
        assertNotEquals(orden1.getNumeroOrden(), orden2.getNumeroOrden());
        assertNotEquals(orden2.getNumeroOrden(), orden3.getNumeroOrden());
        assertTrue(orden1.getNumeroOrden().startsWith("OT-"));
    }

    // ===================== Métodos auxiliares =====================

    private Authentication crearAuthentication(String correo, String rol) {
        return new UsernamePasswordAuthenticationToken(
                correo,
                null,
                Collections.singletonList(new SimpleGrantedAuthority(rol))
        );
    }

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
