package com.newbie.newbiecore.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class OrdenTrabajoTest {

    @Test
    @DisplayName("Debe crear una orden de trabajo con builder")
    void testCrearOrdenConBuilder() {
        // Arrange & Act
        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden("OT-00001")
                .medioContacto("PRESENCIAL")
                .contrasenaEquipo("1234")
                .accesorios("Cargador, mouse")
                .problemaReportado("La laptop no enciende")
                .observacionesIngreso("Sin daños físicos")
                .tipoServicio("REPARACION")
                .prioridad("ALTA")
                .estado("PENDIENTE")
                .condicionesAceptadas(true)
                .build();

        // Assert
        assertNotNull(orden);
        assertEquals("OT-00001", orden.getNumeroOrden());
        assertEquals("PRESENCIAL", orden.getMedioContacto());
        assertEquals("REPARACION", orden.getTipoServicio());
        assertEquals("ALTA", orden.getPrioridad());
        assertEquals("PENDIENTE", orden.getEstado());
        assertTrue(orden.isCondicionesAceptadas());
    }

    @Test
    @DisplayName("Las listas deben inicializarse vacías por defecto")
    void testListasInicializadasVacias() {
        // Arrange & Act
        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden("OT-00002")
                .build();

        // Assert
        assertNotNull(orden.getImagenes());
        assertNotNull(orden.getCostos());
        assertTrue(orden.getImagenes().isEmpty());
        assertTrue(orden.getCostos().isEmpty());
    }

    @Test
    @DisplayName("Debe poder agregar imágenes a la orden")
    void testAgregarImagenes() {
        // Arrange
        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden("OT-00003")
                .imagenes(new ArrayList<>())
                .build();

        Imagen imagen = new Imagen();
        imagen.setRuta("/uploads/test.jpg");
        imagen.setCategoria(CategoriaImagen.OTRO);
        imagen.setOrdenTrabajo(orden);

        // Act
        orden.getImagenes().add(imagen);

        // Assert
        assertEquals(1, orden.getImagenes().size());
        assertEquals("/uploads/test.jpg", orden.getImagenes().get(0).getRuta());
    }

    @Test
    @DisplayName("Debe poder agregar costos a la orden")
    void testAgregarCostos() {
        // Arrange
        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden("OT-00004")
                .costos(new ArrayList<>())
                .build();

        OrdenTrabajoCosto costo = new OrdenTrabajoCosto();
        costo.setDescripcion("Mano de obra");
        costo.setTipo("SERVICIO");
        costo.setCostoUnitario(new BigDecimal("50.00"));
        costo.setCantidad(1);
        costo.setOrdenTrabajo(orden);

        // Act
        orden.getCostos().add(costo);

        // Assert
        assertEquals(1, orden.getCostos().size());
        assertEquals("Mano de obra", orden.getCostos().get(0).getDescripcion());
    }

    @Test
    @DisplayName("Debe manejar garantía correctamente")
    void testGarantia() {
        // Arrange & Act
        OrdenTrabajo ordenSinGarantia = OrdenTrabajo.builder()
                .numeroOrden("OT-00005")
                .esEnGarantia(false)
                .build();

        OrdenTrabajo ordenConGarantia = OrdenTrabajo.builder()
                .numeroOrden("OT-00006")
                .esEnGarantia(true)
                .referenciaOrdenGarantia(1L)
                .build();

        // Assert
        assertFalse(ordenSinGarantia.getEsEnGarantia());
        assertNull(ordenSinGarantia.getReferenciaOrdenGarantia());

        assertTrue(ordenConGarantia.getEsEnGarantia());
        assertEquals(1L, ordenConGarantia.getReferenciaOrdenGarantia());
    }

    @Test
    @DisplayName("Debe manejar diferentes estados")
    void testEstados() {
        // Arrange
        String[] estados = {"PENDIENTE", "EN_PROCESO", "FINALIZADO", "CERRADA", "CANCELADO"};

        for (String estado : estados) {
            // Act
            OrdenTrabajo orden = OrdenTrabajo.builder()
                    .numeroOrden("OT-TEST")
                    .estado(estado)
                    .build();

            // Assert
            assertEquals(estado, orden.getEstado());
        }
    }

    @Test
    @DisplayName("Debe manejar diferentes prioridades")
    void testPrioridades() {
        // Arrange
        String[] prioridades = {"BAJA", "MEDIA", "ALTA", "URGENTE"};

        for (String prioridad : prioridades) {
            // Act
            OrdenTrabajo orden = OrdenTrabajo.builder()
                    .numeroOrden("OT-TEST")
                    .prioridad(prioridad)
                    .build();

            // Assert
            assertEquals(prioridad, orden.getPrioridad());
        }
    }

    @Test
    @DisplayName("Debe manejar campos de cierre")
    void testCamposCierre() {
        // Act
        OrdenTrabajo orden = OrdenTrabajo.builder()
                .numeroOrden("OT-00007")
                .estado("CERRADA")
                .motivoCierre("Equipo reparado correctamente")
                .cerradaPor("admin@test.com")
                .build();

        // Assert
        assertEquals("CERRADA", orden.getEstado());
        assertEquals("Equipo reparado correctamente", orden.getMotivoCierre());
        assertEquals("admin@test.com", orden.getCerradaPor());
    }
}
