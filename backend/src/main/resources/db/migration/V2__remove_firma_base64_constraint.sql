-- Migración para eliminar la restricción NOT NULL de firma_base64
-- La firma ahora se almacena únicamente dentro del PDF por razones legales

-- Permitir NULL en la columna firma_base64
ALTER TABLE firmas_orden_trabajo ALTER COLUMN firma_base64 DROP NOT NULL;

-- Opcionalmente, si deseas eliminar la columna completamente (descomentar):
-- ALTER TABLE firmas_orden_trabajo DROP COLUMN IF EXISTS firma_base64;
