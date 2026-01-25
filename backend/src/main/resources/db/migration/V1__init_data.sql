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
    -- Aplicación
    ('spring.application.name', 'NewbieCore', 'Aplicación', 'Nombre de la aplicación', false, true, true, 'STRING', 'system'),
    ('server.port', '8080', 'Aplicación', 'Puerto del servidor', false, true, true, 'NUMBER', 'system'),
    
    -- Base de Datos
    ('spring.datasource.url', 'jdbc:postgresql://localhost:5432/newbie_db', 'Base de Datos', 'URL de conexión', false, true, true, 'URL', 'system'),
    ('spring.datasource.username', 'postgres', 'Base de Datos', 'Usuario de base de datos', false, true, true, 'STRING', 'system'),
    ('spring.datasource.password', 'postgres', 'Base de Datos', 'Contraseña', true, true, true, 'PASSWORD', 'system'),
    ('spring.jpa.hibernate.ddl-auto', 'update', 'Base de Datos', 'Estrategia DDL', false, true, true, 'STRING', 'system'),
    ('spring.jpa.properties.hibernate.dialect', 'org.hibernate.dialect.PostgreSQLDialect', 'Base de Datos', 'Dialecto de Hibernate', false, true, true, 'STRING', 'system'),
    ('spring.jpa.show-sql', 'false', 'Base de Datos', 'Mostrar consultas SQL', false, true, true, 'BOOLEAN', 'system'),
    
    -- Seguridad (JWT)
    ('app.jwt.secret', 'MySuperSecretKeyForJWT2024NewbieSoft', 'Seguridad', 'Clave secreta JWT', true, true, true, 'PASSWORD', 'system'),
    ('app.jwt.expiration', '3600000', 'Seguridad', 'Tiempo de expiración del token (ms)', false, true, true, 'NUMBER', 'system'),
    ('app.jwt.refresh-expiration', '604800000', 'Seguridad', 'Tiempo de expiración del refresh token (ms)', false, true, true, 'NUMBER', 'system'),
    
    -- Correo SMTP
    ('spring.mail.host', 'smtp.gmail.com', 'Correo SMTP', 'Servidor SMTP', false, true, true, 'STRING', 'system'),
    ('spring.mail.port', '587', 'Correo SMTP', 'Puerto SMTP', false, true, true, 'NUMBER', 'system'),
    ('spring.mail.username', '', 'Correo SMTP', 'Usuario de correo', false, true, true, 'EMAIL', 'system'),
    ('spring.mail.password', '', 'Correo SMTP', 'Contraseña de correo', true, true, true, 'PASSWORD', 'system'),
    ('spring.mail.properties.mail.smtp.auth', 'true', 'Correo SMTP', 'Habilitar autenticación', false, true, true, 'BOOLEAN', 'system'),
    ('spring.mail.properties.mail.smtp.starttls.enable', 'true', 'Correo SMTP', 'Habilitar STARTTLS', false, true, true, 'BOOLEAN', 'system'),
    ('spring.mail.properties.mail.smtp.starttls.required', 'true', 'Correo SMTP', 'Requerir STARTTLS', false, true, true, 'BOOLEAN', 'system'),
    ('spring.mail.properties.mail.smtp.connectiontimeout', '5000', 'Correo SMTP', 'Timeout de conexión', false, true, true, 'NUMBER', 'system'),
    ('spring.mail.properties.mail.smtp.timeout', '5000', 'Correo SMTP', 'Timeout de lectura', false, true, true, 'NUMBER', 'system'),
    ('spring.mail.properties.mail.smtp.writetimeout', '5000', 'Correo SMTP', 'Timeout de escritura', false, true, true, 'NUMBER', 'system'),
    ('spring.mail.properties.mail.debug', 'false', 'Correo SMTP', 'Modo debug', false, true, true, 'BOOLEAN', 'system'),
    ('spring.mail.properties.mail.smtp.localhost', 'gmail.com', 'Correo SMTP', 'Dominio HELO', false, true, true, 'STRING', 'system'),
    
    -- Logging
    ('logging.level.root', 'INFO', 'Logging', 'Nivel de log raíz', false, true, true, 'STRING', 'system'),
    ('logging.level.com.newbie', 'DEBUG', 'Logging', 'Nivel de log de la aplicación', false, true, true, 'STRING', 'system'),
    ('logging.level.org.springframework.security', 'DEBUG', 'Logging', 'Nivel de log de seguridad', false, true, true, 'STRING', 'system'),
    
    -- Archivos
    ('spring.servlet.multipart.max-file-size', '20MB', 'Archivos', 'Tamaño máximo de archivo', false, true, true, 'STRING', 'system'),
    ('spring.servlet.multipart.max-request-size', '20MB', 'Archivos', 'Tamaño máximo de request', false, true, true, 'STRING', 'system'),
    ('app.upload.directory', 'C:/uploads/newbie', 'Archivos', 'Directorio de uploads', false, true, true, 'STRING', 'system'),
    
    -- Servicios Externos
    ('google.recaptcha.secret', '', 'Servicios Externos', 'Clave secreta de reCAPTCHA', true, true, true, 'PASSWORD', 'system'),
    
    -- Actuator
    ('management.endpoints.web.exposure.include', 'health,info,metrics', 'Actuator', 'Endpoints expuestos', false, true, true, 'STRING', 'system')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
