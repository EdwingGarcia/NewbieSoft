package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de repositorio para OrdenTrabajo usando PostgreSQL local.
 * TODO: Actualizar para usar IDs únicos como UsuarioRepositoryTest
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Disabled("Requiere actualización para usar IDs únicos - ver UsuarioRepositoryTest como ejemplo")
class OrdenTrabajoRepositoryTest {

    @Autowired
    private OrdenTrabajoRepository ordenTrabajoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private RolRepository rolRepository;

    private Usuario cliente;
    private Usuario tecnico;
    private Equipo equipo;

    @BeforeEach
    void setUp() {
        ordenTrabajoRepository.deleteAll();
        equipoRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolRepository.deleteAll();

        Rol rolCliente = rolRepository.save(Rol.builder()
                .nombre("ROLE_CLIENTE")
                .descripcion("Cliente")
                .build());

        Rol rolTecnico = rolRepository.save(Rol.builder()
                .nombre("ROLE_TECNICO")
                .descripcion("Técnico")
                .build());

        cliente = usuarioRepository.save(Usuario.builder()
                .cedula("CLI001")
                .nombre("Cliente Test")
                .correo("cliente@test.com")
                .password("password")
                .rol(rolCliente)
                .estado(true)
                .build());

        tecnico = usuarioRepository.save(Usuario.builder()
                .cedula("TEC001")
                .nombre("Técnico Test")
                .correo("tecnico@test.com")
                .password("password")
                .rol(rolTecnico)
                .estado(true)
                .build());

        equipo = equipoRepository.save(Equipo.builder()
                .usuario(cliente)
                .tecnico(tecnico)
                .numeroSerie("SN-001")
                .modelo("Test Model")
                .marca("Test Brand")
                .fechaRegistro(Instant.now())
                .build());
    }

    @Test
    @Order(1)
    @DisplayName("Debe guardar una orden de trabajo")
    void testGuardarOrden() {
        // Arrange
        OrdenTrabajo orden = crearOrdenDePrueba("OT-00001");

        // Act
        OrdenTrabajo guardada = ordenTrabajoRepository.save(orden);

        // Assert
        assertNotNull(guardada);
        assertNotNull(guardada.getId());
        assertEquals("OT-00001", guardada.getNumeroOrden());
    }

    @Test
    @Order(2)
    @DisplayName("Debe encontrar orden por número")
    void testFindByNumeroOrden() {
        // Arrange
        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-00002"));

        // Act
        Optional<OrdenTrabajo> resultado = ordenTrabajoRepository.findByNumeroOrden("OT-00002");

        // Assert
        assertTrue(resultado.isPresent());
        assertEquals("OT-00002", resultado.get().getNumeroOrden());
    }

    @Test
    @Order(3)
    @DisplayName("Debe contar órdenes por estado usando countByEstado")
    void testCountByEstadoMultiple() {
        // Arrange
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-P01", "PENDIENTE"));
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-P02", "PENDIENTE"));
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-E01", "EN_DIAGNOSTICO"));
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-C01", "CERRADA"));

        // Act
        long pendientes = ordenTrabajoRepository.countByEstado("PENDIENTE");
        long enDiagnostico = ordenTrabajoRepository.countByEstado("EN_DIAGNOSTICO");
        long cerradas = ordenTrabajoRepository.countByEstado("CERRADA");

        // Assert
        assertEquals(2, pendientes);
        assertEquals(1, enDiagnostico);
        assertEquals(1, cerradas);
    }

    @Test
    @Order(4)
    @DisplayName("Debe contar órdenes por estado")
    void testCountByEstado() {
        // Arrange
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-001", "PENDIENTE"));
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-002", "PENDIENTE"));
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-003", "PENDIENTE"));
        ordenTrabajoRepository.save(crearOrdenConEstado("OT-004", "CERRADA"));

        // Act
        long countPendientes = ordenTrabajoRepository.countByEstado("PENDIENTE");
        long countCerradas = ordenTrabajoRepository.countByEstado("CERRADA");

        // Assert
        assertEquals(3, countPendientes);
        assertEquals(1, countCerradas);
    }

    @Test
    @Order(5)
    @DisplayName("Debe listar órdenes por técnico")
    void testFindByTecnicoAsignado() {
        // Arrange
        Usuario tecnico2 = usuarioRepository.save(Usuario.builder()
                .cedula("TEC002")
                .nombre("Técnico 2")
                .correo("tecnico2@test.com")
                .password("password")
                .rol(tecnico.getRol())
                .estado(true)
                .build());

        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-T1-01"));
        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-T1-02"));

        OrdenTrabajo ordenTec2 = crearOrdenDePrueba("OT-T2-01");
        ordenTec2.setTecnicoAsignado(tecnico2);
        ordenTrabajoRepository.save(ordenTec2);

        // Act
        List<OrdenTrabajo> ordenesTec1 = ordenTrabajoRepository.findByTecnicoAsignado_CedulaOrderByFechaHoraIngresoDesc("TEC001");
        List<OrdenTrabajo> ordenesTec2 = ordenTrabajoRepository.findByTecnicoAsignado_CedulaOrderByFechaHoraIngresoDesc("TEC002");

        // Assert
        assertEquals(2, ordenesTec1.size());
        assertEquals(1, ordenesTec2.size());
    }

    @Test
    @Order(6)
    @DisplayName("Debe listar órdenes por cliente")
    void testFindByCliente() {
        // Arrange
        Usuario cliente2 = usuarioRepository.save(Usuario.builder()
                .cedula("CLI002")
                .nombre("Cliente 2")
                .correo("cliente2@test.com")
                .password("password")
                .rol(cliente.getRol())
                .estado(true)
                .build());

        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-C1-01"));
        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-C1-02"));

        OrdenTrabajo ordenCli2 = crearOrdenDePrueba("OT-C2-01");
        ordenCli2.setCliente(cliente2);
        ordenTrabajoRepository.save(ordenCli2);

        // Act
        List<OrdenTrabajo> ordenesCli1 = ordenTrabajoRepository.findByCliente_CedulaOrderByFechaHoraIngresoDesc("CLI001");
        List<OrdenTrabajo> ordenesCli2 = ordenTrabajoRepository.findByCliente_CedulaOrderByFechaHoraIngresoDesc("CLI002");

        // Assert
        assertEquals(2, ordenesCli1.size());
        assertEquals(1, ordenesCli2.size());
    }

    @Test
    @Order(7)
    @DisplayName("Debe actualizar estado de orden")
    void testActualizarEstado() {
        // Arrange
        OrdenTrabajo orden = ordenTrabajoRepository.save(crearOrdenConEstado("OT-UPD", "PENDIENTE"));

        // Act
        orden.setEstado("EN_PROCESO");
        OrdenTrabajo actualizada = ordenTrabajoRepository.save(orden);

        // Assert
        assertEquals("EN_PROCESO", actualizada.getEstado());
    }

    @Test
    @Order(8)
    @DisplayName("Debe listar todas las órdenes")
    void testFindAll() {
        // Arrange
        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-001"));
        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-002"));
        ordenTrabajoRepository.save(crearOrdenDePrueba("OT-003"));

        // Act
        List<OrdenTrabajo> ordenes = ordenTrabajoRepository.findAll();

        // Assert
        assertEquals(3, ordenes.size());
    }

    @Test
    @Order(9)
    @DisplayName("Debe eliminar una orden")
    void testDeleteOrden() {
        // Arrange
        OrdenTrabajo orden = ordenTrabajoRepository.save(crearOrdenDePrueba("OT-DEL"));
        Long id = orden.getId();

        // Act
        ordenTrabajoRepository.deleteById(id);

        // Assert
        assertFalse(ordenTrabajoRepository.existsById(id));
    }

    // ===================== Métodos auxiliares =====================

    private OrdenTrabajo crearOrdenDePrueba(String numeroOrden) {
        return OrdenTrabajo.builder()
                .numeroOrden(numeroOrden)
                .medioContacto("PRESENCIAL")
                .tecnicoAsignado(tecnico)
                .cliente(cliente)
                .equipo(equipo)
                .problemaReportado("Problema de prueba")
                .tipoServicio("REPARACION")
                .prioridad("MEDIA")
                .estado("PENDIENTE")
                .condicionesAceptadas(true)
                .build();
    }

    private OrdenTrabajo crearOrdenConEstado(String numeroOrden, String estado) {
        OrdenTrabajo orden = crearOrdenDePrueba(numeroOrden);
        orden.setEstado(estado);
        return orden;
    }
}
