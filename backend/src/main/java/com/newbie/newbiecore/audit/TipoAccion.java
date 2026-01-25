package com.newbie.newbiecore.audit;

/**
 * Tipos de acciones que se pueden auditar en el sistema
 */
public enum TipoAccion {
    // Operaciones CRUD
    CREAR("Creación de registro"),
    LEER("Consulta de registro"),
    ACTUALIZAR("Actualización de registro"),
    ELIMINAR("Eliminación de registro"),
    
    // Autenticación
    LOGIN("Inicio de sesión"),
    LOGOUT("Cierre de sesión"),
    LOGIN_FALLIDO("Intento de inicio de sesión fallido"),
    
    // Órdenes de trabajo
    OT_CREADA("Orden de trabajo creada"),
    OT_ASIGNADA("Orden de trabajo asignada"),
    OT_ESTADO_CAMBIADO("Cambio de estado de orden"),
    OT_CERRADA("Orden de trabajo cerrada"),
    
    // Firmas y documentos
    FIRMA_CONFORMIDAD("Firma de conformidad registrada"),
    FIRMA_RECIBO("Firma de recibo registrada"),
    PDF_GENERADO("Documento PDF generado"),
    
    // Fichas técnicas
    FICHA_CREADA("Ficha técnica creada"),
    FICHA_ACTUALIZADA("Ficha técnica actualizada"),
    FICHA_CERRADA("Ficha técnica cerrada"),
    
    // Configuración
    CONFIG_MODIFICADA("Configuración del sistema modificada"),
    
    // Usuarios
    USUARIO_CREADO("Usuario creado"),
    USUARIO_MODIFICADO("Usuario modificado"),
    USUARIO_DESACTIVADO("Usuario desactivado"),
    PASSWORD_CAMBIADO("Contraseña modificada"),
    
    // Catálogo
    ITEM_CATALOGO_CREADO("Item de catálogo creado"),
    ITEM_CATALOGO_MODIFICADO("Item de catálogo modificado"),
    
    // Costos
    COSTO_AGREGADO("Costo agregado a orden"),
    COSTO_MODIFICADO("Costo modificado"),
    COSTO_ELIMINADO("Costo eliminado"),
    
    // Imágenes
    IMAGEN_SUBIDA("Imagen subida"),
    IMAGEN_ELIMINADA("Imagen eliminada"),
    
    // Otros
    EXPORTACION("Exportación de datos"),
    IMPORTACION("Importación de datos"),
    ERROR_SISTEMA("Error del sistema"),
    OTRO("Otra acción");

    private final String descripcion;

    TipoAccion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
