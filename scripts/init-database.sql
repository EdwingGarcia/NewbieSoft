-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN RÁPIDA - NEWBIE SYSTEM
-- Para ejecutar directamente en PostgreSQL
-- ============================================================================
-- 
-- CREDENCIALES DEL ADMIN:
--   Email:      admin@newbie.com
--   Contraseña: Admin123!
--
-- IMPORTANTE: Cambiar la contraseña después del primer login
-- ============================================================================

-- Limpiar datos existentes (SOLO para instalación limpia, comentar si ya hay datos)
-- TRUNCATE TABLE ordenes_trabajo CASCADE;
-- TRUNCATE TABLE equipos CASCADE;
-- TRUNCATE TABLE usuarios CASCADE;
-- TRUNCATE TABLE roles CASCADE;

-- ============================================================================
-- 1. ROLES DEL SISTEMA
-- ============================================================================
INSERT INTO roles (nombre, descripcion) VALUES 
    ('ROLE_ADMIN', 'Administrador del sistema con acceso total'),
    ('ROLE_TECNICO', 'Técnico de servicio técnico'),
    ('ROLE_CLIENTE', 'Cliente del servicio técnico')
ON CONFLICT DO NOTHING;

-- Verificar roles creados
SELECT * FROM roles;

-- ============================================================================
-- 2. USUARIO ADMINISTRADOR
-- ============================================================================
-- Hash BCrypt para "Admin123!": $2a$10$PojL377ml.dxjc1DJ9u.AOnBcwyp.egzVOywp5OFT8SHfBrYmWgh2

DO $$
DECLARE
    admin_rol_id BIGINT;
BEGIN
    -- Obtener el ID del rol admin
    SELECT id_rol INTO admin_rol_id FROM roles WHERE nombre = 'ROLE_ADMIN';
    
    -- Insertar usuario admin si no existe
    INSERT INTO usuarios (cedula, nombre, correo, telefono, direccion, password, rol_id, estado)
    VALUES (
        'ADMIN001',
        'Administrador del Sistema',
        'admin@newbie.com',
        '+593999999999',
        'Oficina Central',
        '$2a$10$PojL377ml.dxjc1DJ9u.AOnBcwyp.egzVOywp5OFT8SHfBrYmWgh2',
        admin_rol_id,
        true
    )
    ON CONFLICT (cedula) DO NOTHING;
    
    RAISE NOTICE 'Usuario admin creado exitosamente';
END $$;

-- Verificar usuario admin
SELECT u.cedula, u.nombre, u.correo, r.nombre as rol 
FROM usuarios u 
JOIN roles r ON u.rol_id = r.id_rol 
WHERE u.correo = 'admin@newbie.com';

-- ============================================================================
-- 3. CATÁLOGO DE SERVICIOS Y PRODUCTOS
-- ============================================================================
INSERT INTO catalogo_items (tipo, descripcion, costo, activo) VALUES
    -- SERVICIOS DE DIAGNÓSTICO
    ('SERVICIO', 'Diagnóstico general de equipo', 15.00, true),
    ('SERVICIO', 'Diagnóstico avanzado con reporte', 25.00, true),
    
    -- SERVICIOS DE MANTENIMIENTO
    ('SERVICIO', 'Mantenimiento preventivo básico', 20.00, true),
    ('SERVICIO', 'Mantenimiento preventivo completo', 35.00, true),
    ('SERVICIO', 'Limpieza interna de equipo', 15.00, true),
    ('SERVICIO', 'Limpieza sistema de refrigeración', 20.00, true),
    
    -- SERVICIOS DE SOFTWARE
    ('SERVICIO', 'Formateo e instalación de SO', 30.00, true),
    ('SERVICIO', 'Instalación de Windows 10/11', 25.00, true),
    ('SERVICIO', 'Instalación de Linux', 25.00, true),
    ('SERVICIO', 'Respaldo de datos', 20.00, true),
    ('SERVICIO', 'Recuperación de datos', 50.00, true),
    ('SERVICIO', 'Eliminación de virus/malware', 25.00, true),
    ('SERVICIO', 'Optimización de sistema', 20.00, true),
    ('SERVICIO', 'Instalación de drivers', 15.00, true),
    
    -- SERVICIOS DE HARDWARE
    ('SERVICIO', 'Cambio de pasta térmica', 15.00, true),
    ('SERVICIO', 'Instalación de RAM', 10.00, true),
    ('SERVICIO', 'Instalación de disco HDD/SSD', 15.00, true),
    ('SERVICIO', 'Reemplazo de pantalla laptop', 30.00, true),
    ('SERVICIO', 'Reemplazo de teclado laptop', 25.00, true),
    ('SERVICIO', 'Reemplazo de batería laptop', 15.00, true),
    ('SERVICIO', 'Soldadura de componentes', 40.00, true),
    ('SERVICIO', 'Reparación de puertos', 35.00, true),
    
    -- SERVICIOS DE RED
    ('SERVICIO', 'Configuración de red WiFi', 20.00, true),
    ('SERVICIO', 'Configuración red empresarial', 50.00, true),
    
    -- PRODUCTOS - ALMACENAMIENTO
    ('PRODUCTO', 'SSD 240GB SATA', 45.00, true),
    ('PRODUCTO', 'SSD 480GB SATA', 65.00, true),
    ('PRODUCTO', 'SSD 1TB SATA', 95.00, true),
    ('PRODUCTO', 'SSD NVMe 256GB', 55.00, true),
    ('PRODUCTO', 'SSD NVMe 512GB', 75.00, true),
    ('PRODUCTO', 'SSD NVMe 1TB', 120.00, true),
    ('PRODUCTO', 'HDD 500GB', 35.00, true),
    ('PRODUCTO', 'HDD 1TB', 50.00, true),
    
    -- PRODUCTOS - MEMORIA RAM
    ('PRODUCTO', 'RAM DDR3 4GB', 25.00, true),
    ('PRODUCTO', 'RAM DDR3 8GB', 40.00, true),
    ('PRODUCTO', 'RAM DDR4 4GB', 30.00, true),
    ('PRODUCTO', 'RAM DDR4 8GB', 45.00, true),
    ('PRODUCTO', 'RAM DDR4 16GB', 75.00, true),
    ('PRODUCTO', 'RAM DDR5 8GB', 55.00, true),
    ('PRODUCTO', 'RAM DDR5 16GB', 90.00, true),
    ('PRODUCTO', 'RAM DDR5 32GB', 160.00, true),
    
    -- PRODUCTOS - COMPONENTES
    ('PRODUCTO', 'Pasta térmica estándar', 5.00, true),
    ('PRODUCTO', 'Pasta térmica premium', 12.00, true),
    ('PRODUCTO', 'Ventilador laptop universal', 25.00, true),
    ('PRODUCTO', 'Batería laptop genérica', 45.00, true),
    ('PRODUCTO', 'Cargador laptop universal', 35.00, true),
    ('PRODUCTO', 'Teclado USB', 15.00, true),
    ('PRODUCTO', 'Mouse USB', 10.00, true),
    ('PRODUCTO', 'Cable HDMI 1.8m', 8.00, true),
    ('PRODUCTO', 'Cable USB-C', 8.00, true),
    ('PRODUCTO', 'Hub USB 4 puertos', 15.00, true),
    ('PRODUCTO', 'Webcam HD', 35.00, true),
    ('PRODUCTO', 'Audífonos con micrófono', 20.00, true)
ON CONFLICT DO NOTHING;

-- Verificar catálogo
SELECT tipo, COUNT(*) as cantidad FROM catalogo_items GROUP BY tipo;

-- ============================================================================
-- 4. CONFIGURACIÓN DEL SISTEMA (opcional)
-- ============================================================================
INSERT INTO configuration_property (key, value, category, description, is_sensitive, is_editable, is_active, value_type, updated_by) VALUES
    -- Email (configurar después)
    ('spring.mail.host', 'smtp.gmail.com', 'EMAIL', 'Servidor SMTP', false, true, true, 'STRING', 'system'),
    ('spring.mail.port', '587', 'EMAIL', 'Puerto SMTP', false, true, true, 'NUMBER', 'system'),
    ('spring.mail.username', '', 'EMAIL', 'Usuario email', false, true, true, 'EMAIL', 'system'),
    ('spring.mail.password', '', 'EMAIL', 'Contraseña email', true, true, true, 'PASSWORD', 'system'),
    
    -- Empresa
    ('app.empresa.nombre', 'Newbie Tech Solutions', 'EMPRESA', 'Nombre empresa', false, true, true, 'STRING', 'system'),
    ('app.empresa.ruc', '0000000000001', 'EMPRESA', 'RUC', false, true, true, 'STRING', 'system'),
    ('app.empresa.direccion', 'Dirección', 'EMPRESA', 'Dirección física', false, true, true, 'STRING', 'system'),
    ('app.empresa.telefono', '+593999999999', 'EMPRESA', 'Teléfono', false, true, true, 'STRING', 'system'),
    ('app.empresa.email', 'contacto@newbie.com', 'EMPRESA', 'Email contacto', false, true, true, 'EMAIL', 'system')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================
SELECT 'ROLES' as tabla, COUNT(*) as registros FROM roles
UNION ALL
SELECT 'USUARIOS', COUNT(*) FROM usuarios
UNION ALL
SELECT 'CATALOGO', COUNT(*) FROM catalogo_items
UNION ALL
SELECT 'CONFIGURACION', COUNT(*) FROM configuration_property;

-- ============================================================================
-- ¡LISTO! El sistema está configurado.
-- 
-- Credenciales de acceso:
--   URL:        http://localhost:3000
--   Email:      admin@newbie.com
--   Contraseña: Admin123!
-- ============================================================================
