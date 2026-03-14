-- ====================================
-- VERIFICAR INSTALACIÓN DE BASE DE DATOS
-- ====================================

-- Mostrar todas las tablas
SELECT '=== TABLAS EXISTENTES ===' as '';
SHOW TABLES;

-- Verificar tabla de turnos
SELECT '' as '';
SELECT '=== VERIFICAR TABLA TURNOS ===' as '';
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Tabla turnos existe'
        ELSE '❌ Tabla turnos NO existe'
    END as Estado
FROM information_schema.tables 
WHERE table_schema = 'control_acceso' 
  AND table_name = 'turnos';

-- Verificar tabla usuario_turnos
SELECT '' as '';
SELECT '=== VERIFICAR TABLA USUARIO_TURNOS ===' as '';
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Tabla usuario_turnos existe'
        ELSE '❌ Tabla usuario_turnos NO existe'
    END as Estado
FROM information_schema.tables 
WHERE table_schema = 'control_acceso' 
  AND table_name = 'usuario_turnos';

-- Verificar campos en tabla accesos
SELECT '' as '';
SELECT '=== VERIFICAR CAMPOS EN ACCESOS ===' as '';
SELECT 
    COLUMN_NAME as Campo,
    COLUMN_TYPE as Tipo
FROM information_schema.COLUMNS 
WHERE table_schema = 'control_acceso' 
  AND table_name = 'accesos'
  AND COLUMN_NAME IN ('tipo_acceso', 'turno_valido', 'turno_id');

-- Verificar procedimiento almacenado
SELECT '' as '';
SELECT '=== VERIFICAR PROCEDIMIENTO ALMACENADO ===' as '';
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Procedimiento obtener_turno_actual existe'
        ELSE '❌ Procedimiento obtener_turno_actual NO existe'
    END as Estado
FROM information_schema.routines 
WHERE routine_schema = 'control_acceso' 
  AND routine_name = 'obtener_turno_actual';

-- Contar registros
SELECT '' as '';
SELECT '=== ESTADÍSTICAS ===' as '';
SELECT 'Usuarios' as Tabla, COUNT(*) as Total FROM usuarios
UNION ALL
SELECT 'Descriptores', COUNT(*) FROM descriptores_faciales
UNION ALL
SELECT 'Fotos', COUNT(*) FROM fotos
UNION ALL
SELECT 'Accesos', COUNT(*) FROM accesos
UNION ALL
SELECT 'Turnos', 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'control_acceso' AND table_name = 'turnos') > 0
        THEN (SELECT COUNT(*) FROM turnos)
        ELSE 0
    END
UNION ALL
SELECT 'Usuario-Turnos', 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'control_acceso' AND table_name = 'usuario_turnos') > 0
        THEN (SELECT COUNT(*) FROM usuario_turnos)
        ELSE 0
    END;

-- Últimos 3 accesos con tipo
SELECT '' as '';
SELECT '=== ÚLTIMOS 3 ACCESOS ===' as '';
SELECT 
    id,
    CONCAT(SUBSTRING(fecha_acceso, 1, 19)) as Fecha,
    tipo_acceso as Tipo,
    estado as Estado,
    usuario_id as Usuario
FROM accesos
ORDER BY fecha_acceso DESC
LIMIT 3;

SELECT '' as '';
SELECT '=== FIN DE VERIFICACIÓN ===' as '';

