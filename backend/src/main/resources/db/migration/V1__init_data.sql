-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN DE DATOS - NEWBIE SYSTEM
-- Ejecutar después de que Hibernate cree las tablas (ddl-auto: update)
-- ============================================================================
-- NOTA: Las contraseñas están hasheadas con BCrypt
-- Contraseña por defecto para admin: Admin123!
-- ============================================================================

-- ============================================================================
-- 1. ROLES DEL SISTEMA
-- ============================================================================
INSERT INTO roles (nombre, descripcion) VALUES 
    ('ROLE_ADMIN', 'Administrador del sistema con acceso total'),
    ('ROLE_TECNICO', 'Técnico de servicio técnico'),
    ('ROLE_CLIENTE', 'Cliente del servicio técnico')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- 2. USUARIO ADMINISTRADOR
-- ============================================================================
-- Contraseña: Admin123! (hasheada con BCrypt)
-- IMPORTANTE: Cambiar esta contraseña después del primer login
INSERT INTO usuarios (cedula, nombre, correo, telefono, direccion, password, rol_id, estado) 
SELECT 
    'ADMIN001',
    'Administrador del Sistema',
    'admin@newbie.com',
    '+593999999999',
    'Oficina Central',
    '$2a$10$PojL377ml.dxjc1DJ9u.AOnBcwyp.egzVOywp5OFT8SHfBrYmWgh2', -- Admin123!
    r.id_rol,
    true
FROM roles r 
WHERE r.nombre = 'ROLE_ADMIN'
ON CONFLICT (cedula) DO NOTHING;

-- ============================================================================
-- 3. CATÁLOGO INICIAL DE PRODUCTOS Y SERVICIOS
-- ============================================================================
-- SERVICIOS COMUNES
INSERT INTO catalogo_items (tipo, descripcion, costo, activo) VALUES
    -- Servicios de Diagnóstico
    ('SERVICIO', 'Diagnóstico general de equipo', 15.00, true),
    ('SERVICIO', 'Diagnóstico avanzado con reporte técnico', 25.00, true),
    
    -- Servicios de Mantenimiento
    ('SERVICIO', 'Mantenimiento preventivo básico', 20.00, true),
    ('SERVICIO', 'Mantenimiento preventivo completo', 35.00, true),
    ('SERVICIO', 'Limpieza interna de equipo', 15.00, true),
    ('SERVICIO', 'Limpieza de sistema de refrigeración', 20.00, true),
    
    -- Servicios de Software
    ('SERVICIO', 'Formateo e instalación de SO', 30.00, true),
    ('SERVICIO', 'Instalación de Windows 10/11', 25.00, true),
    ('SERVICIO', 'Instalación de Linux', 25.00, true),
    ('SERVICIO', 'Respaldo de datos', 20.00, true),
    ('SERVICIO', 'Recuperación de datos', 50.00, true),
    ('SERVICIO', 'Eliminación de virus/malware', 25.00, true),
    ('SERVICIO', 'Optimización de sistema operativo', 20.00, true),
    ('SERVICIO', 'Instalación de drivers', 15.00, true),
    ('SERVICIO', 'Configuración de software', 15.00, true),
    
    -- Servicios de Hardware
    ('SERVICIO', 'Cambio de pasta térmica', 15.00, true),
    ('SERVICIO', 'Instalación de memoria RAM', 10.00, true),
    ('SERVICIO', 'Instalación de disco duro/SSD', 15.00, true),
    ('SERVICIO', 'Reemplazo de pantalla de laptop', 30.00, true),
    ('SERVICIO', 'Reemplazo de teclado de laptop', 25.00, true),
    ('SERVICIO', 'Reemplazo de batería de laptop', 15.00, true),
    ('SERVICIO', 'Soldadura de componentes', 40.00, true),
    ('SERVICIO', 'Reparación de puerto USB/HDMI', 35.00, true),
    ('SERVICIO', 'Reparación de jack de audio', 25.00, true),
    ('SERVICIO', 'Reparación de conector de carga', 30.00, true),
    
    -- Servicios de Red
    ('SERVICIO', 'Configuración de red WiFi', 20.00, true),
    ('SERVICIO', 'Configuración de red empresarial', 50.00, true),
    ('SERVICIO', 'Instalación de router/switch', 15.00, true),
    
    -- Productos - Almacenamiento
    ('PRODUCTO', 'SSD 240GB SATA', 45.00, true),
    ('PRODUCTO', 'SSD 480GB SATA', 65.00, true),
    ('PRODUCTO', 'SSD 1TB SATA', 95.00, true),
    ('PRODUCTO', 'SSD NVMe 256GB', 55.00, true),
    ('PRODUCTO', 'SSD NVMe 512GB', 75.00, true),
    ('PRODUCTO', 'SSD NVMe 1TB', 120.00, true),
    ('PRODUCTO', 'HDD 500GB', 35.00, true),
    ('PRODUCTO', 'HDD 1TB', 50.00, true),
    
    -- Productos - Memoria RAM
    ('PRODUCTO', 'RAM DDR3 4GB', 25.00, true),
    ('PRODUCTO', 'RAM DDR3 8GB', 40.00, true),
    ('PRODUCTO', 'RAM DDR4 4GB', 30.00, true),
    ('PRODUCTO', 'RAM DDR4 8GB', 45.00, true),
    ('PRODUCTO', 'RAM DDR4 16GB', 75.00, true),
    ('PRODUCTO', 'RAM DDR5 8GB', 55.00, true),
    ('PRODUCTO', 'RAM DDR5 16GB', 90.00, true),
    ('PRODUCTO', 'RAM DDR5 32GB', 160.00, true),
    
    -- Productos - Componentes
    ('PRODUCTO', 'Pasta térmica estándar', 5.00, true),
    ('PRODUCTO', 'Pasta térmica premium', 12.00, true),
    ('PRODUCTO', 'Ventilador de laptop universal', 25.00, true),
    ('PRODUCTO', 'Batería de laptop genérica', 45.00, true),
    ('PRODUCTO', 'Cargador de laptop universal', 35.00, true),
    ('PRODUCTO', 'Teclado USB estándar', 15.00, true),
    ('PRODUCTO', 'Mouse USB estándar', 10.00, true),
    ('PRODUCTO', 'Cable HDMI 1.8m', 8.00, true),
    ('PRODUCTO', 'Cable USB-C a USB-A', 8.00, true),
    ('PRODUCTO', 'Hub USB 4 puertos', 15.00, true),
    
    -- Productos - Periféricos
    ('PRODUCTO', 'Webcam HD', 35.00, true),
    ('PRODUCTO', 'Audífonos con micrófono', 20.00, true),
    ('PRODUCTO', 'Parlantes USB', 25.00, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. CONFIGURACIÓN INICIAL DEL SISTEMA
-- ============================================================================
INSERT INTO configuration_property (key, value, category, description, is_sensitive, is_editable, is_active, value_type, updated_by) VALUES
    -- Configuración de Email
    ('spring.mail.host', 'smtp.gmail.com', 'EMAIL', 'Servidor SMTP para envío de correos', false, true, true, 'STRING', 'system'),
    ('spring.mail.port', '587', 'EMAIL', 'Puerto del servidor SMTP', false, true, true, 'NUMBER', 'system'),
    ('spring.mail.username', '', 'EMAIL', 'Usuario de correo para envíos', false, true, true, 'EMAIL', 'system'),
    ('spring.mail.password', '', 'EMAIL', 'Contraseña del correo (usar App Password para Gmail)', true, true, true, 'PASSWORD', 'system'),
    ('spring.mail.properties.mail.smtp.auth', 'true', 'EMAIL', 'Habilitar autenticación SMTP', false, true, true, 'BOOLEAN', 'system'),
    ('spring.mail.properties.mail.smtp.starttls.enable', 'true', 'EMAIL', 'Habilitar TLS para SMTP', false, true, true, 'BOOLEAN', 'system'),
    
    -- Configuración de la empresa
    ('app.empresa.nombre', 'Newbie Tech Solutions', 'EMPRESA', 'Nombre de la empresa', false, true, true, 'STRING', 'system'),
    ('app.empresa.ruc', '0000000000001', 'EMPRESA', 'RUC de la empresa', false, true, true, 'STRING', 'system'),
    ('app.empresa.direccion', 'Dirección de la empresa', 'EMPRESA', 'Dirección física', false, true, true, 'STRING', 'system'),
    ('app.empresa.telefono', '+593999999999', 'EMPRESA', 'Teléfono de contacto', false, true, true, 'STRING', 'system'),
    ('app.empresa.email', 'contacto@newbie.com', 'EMPRESA', 'Email de contacto', false, true, true, 'EMAIL', 'system'),
    
    -- Configuración de órdenes
    ('app.ordenes.prefijo', 'OT', 'ORDENES', 'Prefijo para números de orden', false, true, true, 'STRING', 'system'),
    ('app.ordenes.siguiente', '1', 'ORDENES', 'Siguiente número de orden', false, false, true, 'NUMBER', 'system'),
    
    -- Configuración de notificaciones
    ('app.notificaciones.email.habilitado', 'true', 'NOTIFICACIONES', 'Habilitar notificaciones por email', false, true, true, 'BOOLEAN', 'system'),
    ('app.notificaciones.sms.habilitado', 'false', 'NOTIFICACIONES', 'Habilitar notificaciones por SMS', false, true, true, 'BOOLEAN', 'system')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
