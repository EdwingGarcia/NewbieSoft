-- ============================================================================
-- SCRIPT DE LIMPIEZA - NEWBIE SYSTEM
-- ⚠️ CUIDADO: Este script elimina TODOS los datos de la base de datos
-- ============================================================================

-- Confirmar antes de ejecutar (comentar esta línea para ejecutar)
-- \echo 'ADVERTENCIA: Este script eliminará todos los datos. Descomenta las líneas para ejecutar.'
-- \quit

-- ============================================================================
-- ELIMINAR DATOS EN ORDEN (respetando foreign keys)
-- ============================================================================

-- Firmas y documentos
TRUNCATE TABLE firma_orden_trabajo CASCADE;
TRUNCATE TABLE signed_documents CASCADE;
TRUNCATE TABLE firma_digital CASCADE;

-- Órdenes de trabajo y relacionados
TRUNCATE TABLE orden_trabajo_costo CASCADE;
TRUNCATE TABLE imagenes CASCADE;
TRUNCATE TABLE fichas_tecnicas CASCADE;
TRUNCATE TABLE notificaciones_ot CASCADE;
TRUNCATE TABLE citas CASCADE;
TRUNCATE TABLE ordenes_trabajo CASCADE;

-- Equipos
TRUNCATE TABLE equipos CASCADE;

-- Usuarios (excepto el admin si lo deseas mantener)
-- DELETE FROM usuarios WHERE correo != 'admin@newbie.com';
TRUNCATE TABLE usuarios CASCADE;

-- Catálogo
TRUNCATE TABLE catalogo_items CASCADE;

-- Configuración
TRUNCATE TABLE configuration_property CASCADE;

-- Auditoría
TRUNCATE TABLE audit_log CASCADE;

-- Tokens y validaciones
TRUNCATE TABLE blacklisted_tokens CASCADE;
TRUNCATE TABLE otp_validacion CASCADE;

-- Roles (al final, ya que usuarios depende de ellos)
TRUNCATE TABLE roles CASCADE;

-- ============================================================================
-- REINICIAR SECUENCIAS
-- ============================================================================
ALTER SEQUENCE IF EXISTS roles_id_rol_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ordenes_trabajo_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS equipos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS catalogo_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS configuration_property_id_seq RESTART WITH 1;

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================
SELECT 'Base de datos limpiada exitosamente. Ejecuta init-database.sql para reinicializar.' AS mensaje;
