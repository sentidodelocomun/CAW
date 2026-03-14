-- ============================================
-- Script para Limpiar TODOS los Datos de las Tablas
-- ============================================
-- ADVERTENCIA: Este script elimina TODOS los registros
-- de la base de datos. Úsalo solo para pruebas/desarrollo.
-- ============================================

USE control_acceso;

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todos los registros de cada tabla
TRUNCATE TABLE accesos;
TRUNCATE TABLE fotos;
TRUNCATE TABLE descriptores_faciales;
TRUNCATE TABLE usuarios;

-- La tabla configuracion NO se limpia para mantener los valores por defecto
-- Si quieres limpiarla también, descomenta la siguiente línea:
-- TRUNCATE TABLE configuracion;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Resetear AUTO_INCREMENT (ya lo hace TRUNCATE, pero por si acaso)
ALTER TABLE usuarios AUTO_INCREMENT = 1;
ALTER TABLE descriptores_faciales AUTO_INCREMENT = 1;
ALTER TABLE fotos AUTO_INCREMENT = 1;
ALTER TABLE accesos AUTO_INCREMENT = 1;

-- Verificar que las tablas están vacías
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'descriptores_faciales', COUNT(*) FROM descriptores_faciales
UNION ALL
SELECT 'fotos', COUNT(*) FROM fotos
UNION ALL
SELECT 'accesos', COUNT(*) FROM accesos
UNION ALL
SELECT 'configuracion', COUNT(*) FROM configuracion;

SELECT '✅ Base de datos limpiada correctamente' as resultado;

