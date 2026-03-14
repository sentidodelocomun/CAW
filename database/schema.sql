-- ====================================
-- Base de Datos: Control de Acceso
-- ====================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS control_acceso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE control_acceso;

-- ====================================
-- Tabla: usuarios
-- Almacena información de usuarios registrados en el sistema
-- ====================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  identificacion VARCHAR(50) UNIQUE NOT NULL COMMENT 'DNI, NIE, Pasaporte, etc.',
  departamento VARCHAR(100) DEFAULT NULL,
  cargo VARCHAR(100) DEFAULT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_identificacion (identificacion),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Tabla: descriptores_faciales
-- Almacena los descriptores faciales (embeddings) de cada usuario
-- Un usuario puede tener múltiples descriptores para mejor precisión
-- ====================================
CREATE TABLE IF NOT EXISTS descriptores_faciales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  descriptor JSON NOT NULL COMMENT 'Array de 128 dimensiones del descriptor facial',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_activo (usuario_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Tabla: fotos
-- Almacena las fotografías capturadas (opcional, para histórico)
-- ====================================
CREATE TABLE IF NOT EXISTS fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT DEFAULT NULL COMMENT 'NULL si es un intento no identificado',
  imagen MEDIUMBLOB NOT NULL,
  tipo_captura ENUM('registro', 'verificacion', 'desconocido') DEFAULT 'desconocido',
  fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_usuario_fecha (usuario_id, fecha_captura),
  INDEX idx_tipo_fecha (tipo_captura, fecha_captura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Tabla: accesos
-- Registra todos los intentos de acceso (exitosos y fallidos)
-- ====================================
CREATE TABLE IF NOT EXISTS accesos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT DEFAULT NULL COMMENT 'NULL si no se pudo identificar',
  tipo_acceso ENUM('entrada', 'salida') DEFAULT 'entrada',
  estado ENUM('autorizado', 'denegado', 'error') NOT NULL,
  similitud_facial DECIMAL(5,4) DEFAULT NULL COMMENT 'Puntuación de similitud (0.0 - 1.0)',
  motivo_denegacion VARCHAR(255) DEFAULT NULL COMMENT 'Razón si fue denegado',
  foto_id INT DEFAULT NULL COMMENT 'Referencia a la foto capturada',
  fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) DEFAULT NULL,
  ubicacion VARCHAR(100) DEFAULT NULL COMMENT 'Ubicación del punto de acceso',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (foto_id) REFERENCES fotos(id) ON DELETE SET NULL,
  INDEX idx_usuario_fecha (usuario_id, fecha_acceso),
  INDEX idx_estado_fecha (estado, fecha_acceso),
  INDEX idx_fecha (fecha_acceso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Tabla: configuracion
-- Parámetros de configuración del sistema
-- ====================================
CREATE TABLE IF NOT EXISTS configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT DEFAULT NULL,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('umbral_similitud', '0.6', 'Umbral mínimo de similitud facial para autorizar acceso (0.0 - 1.0)'),
('max_descriptores_por_usuario', '3', 'Número máximo de descriptores faciales por usuario'),
('dias_retencion_fotos', '30', 'Días que se conservan las fotos en el sistema'),
('dias_retencion_logs', '90', 'Días que se conservan los logs de acceso'),
('requiere_multiples_angulos', 'false', 'Si se requieren fotos desde múltiples ángulos en el registro')
ON DUPLICATE KEY UPDATE valor=valor;

-- ====================================
-- Vista: ultimos_accesos
-- Vista para consultas rápidas de accesos recientes
-- ====================================
CREATE OR REPLACE VIEW ultimos_accesos AS
SELECT 
  a.id,
  a.usuario_id,
  CONCAT(u.nombre, ' ', u.apellidos) AS nombre_completo,
  u.identificacion,
  u.departamento,
  a.tipo_acceso,
  a.estado,
  a.similitud_facial,
  a.motivo_denegacion,
  a.fecha_acceso,
  a.ubicacion
FROM accesos a
LEFT JOIN usuarios u ON a.usuario_id = u.id
ORDER BY a.fecha_acceso DESC
LIMIT 100;

-- ====================================
-- Vista: estadisticas_usuarios
-- Estadísticas de acceso por usuario
-- ====================================
CREATE OR REPLACE VIEW estadisticas_usuarios AS
SELECT 
  u.id,
  u.nombre,
  u.apellidos,
  u.email,
  u.identificacion,
  u.departamento,
  u.activo,
  COUNT(DISTINCT df.id) AS num_descriptores,
  COUNT(DISTINCT CASE WHEN a.estado = 'autorizado' THEN a.id END) AS accesos_autorizados,
  COUNT(DISTINCT CASE WHEN a.estado = 'denegado' THEN a.id END) AS accesos_denegados,
  MAX(a.fecha_acceso) AS ultimo_acceso
FROM usuarios u
LEFT JOIN descriptores_faciales df ON u.id = df.usuario_id AND df.activo = TRUE
LEFT JOIN accesos a ON u.id = a.usuario_id
GROUP BY u.id;

-- ====================================
-- Procedimiento: limpiar_datos_antiguos
-- Limpia automáticamente fotos y logs antiguos según configuración
-- ====================================
DELIMITER //
CREATE PROCEDURE limpiar_datos_antiguos()
BEGIN
  DECLARE dias_fotos INT;
  DECLARE dias_logs INT;
  
  -- Obtener configuración
  SELECT CAST(valor AS UNSIGNED) INTO dias_fotos 
  FROM configuracion WHERE clave = 'dias_retencion_fotos';
  
  SELECT CAST(valor AS UNSIGNED) INTO dias_logs 
  FROM configuracion WHERE clave = 'dias_retencion_logs';
  
  -- Limpiar fotos antiguas (excepto las de registro)
  DELETE FROM fotos 
  WHERE tipo_captura != 'registro' 
    AND fecha_captura < DATE_SUB(NOW(), INTERVAL dias_fotos DAY);
  
  -- Limpiar logs antiguos
  DELETE FROM accesos 
  WHERE fecha_acceso < DATE_SUB(NOW(), INTERVAL dias_logs DAY);
  
  SELECT CONCAT('Limpieza completada. Fotos eliminadas: ', ROW_COUNT()) AS resultado;
END //
DELIMITER ;

-- ====================================
-- Datos de prueba (opcional - comentar en producción)
-- ====================================
/*
INSERT INTO usuarios (nombre, apellidos, email, identificacion, departamento, cargo) VALUES
('Juan', 'García López', 'juan.garcia@empresa.com', '12345678A', 'Tecnología', 'Desarrollador'),
('María', 'Martínez Pérez', 'maria.martinez@empresa.com', '87654321B', 'Recursos Humanos', 'Gerente'),
('Carlos', 'Rodríguez Silva', 'carlos.rodriguez@empresa.com', '11223344C', 'Administración', 'Contable');
*/

-- ====================================
-- Fin del script
-- ====================================

