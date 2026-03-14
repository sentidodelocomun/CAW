-- ====================================
-- Extensión de Schema: Sistema de Turnos
-- ====================================
-- Este script añade las tablas necesarias para el sistema de turnos

USE control_acceso;

-- ====================================
-- Tabla: turnos
-- Define los turnos de trabajo con horarios
-- ====================================
CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL COMMENT 'Ej: Turno Mañana, Turno Tarde, Turno Noche',
  descripcion TEXT DEFAULT NULL,
  hora_inicio TIME NOT NULL COMMENT 'Hora de inicio del turno',
  hora_fin TIME NOT NULL COMMENT 'Hora de fin del turno',
  dias_semana JSON NOT NULL COMMENT 'Array de días: [1=Lunes, 2=Martes, ..., 7=Domingo]',
  color VARCHAR(7) DEFAULT '#667eea' COMMENT 'Color para visualización (hex)',
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Tabla: usuario_turnos
-- Asigna turnos a usuarios
-- ====================================
CREATE TABLE IF NOT EXISTS usuario_turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  turno_id INT NOT NULL,
  fecha_inicio DATE NOT NULL COMMENT 'Fecha desde la que aplica este turno',
  fecha_fin DATE DEFAULT NULL COMMENT 'Fecha hasta la que aplica (NULL = indefinido)',
  activo BOOLEAN DEFAULT TRUE,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
  INDEX idx_usuario_activo (usuario_id, activo),
  INDEX idx_turno_activo (turno_id, activo),
  INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Actualizar tabla accesos para incluir validación de turno
-- ====================================
ALTER TABLE accesos 
ADD COLUMN turno_valido BOOLEAN DEFAULT NULL COMMENT 'Si el acceso fue en horario de turno asignado',
ADD COLUMN turno_id INT DEFAULT NULL COMMENT 'ID del turno en el que se intentó el acceso',
ADD FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL;

-- ====================================
-- Añadir configuración de validación de turnos
-- ====================================
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('validar_turnos', 'true', 'Activar validación de turnos en el acceso'),
('permitir_acceso_fuera_turno', 'false', 'Permitir acceso aunque no sea el turno del usuario')
ON DUPLICATE KEY UPDATE valor=valor;

-- ====================================
-- Vista: turnos_activos
-- Turnos activos con conteo de usuarios asignados
-- ====================================
CREATE OR REPLACE VIEW turnos_activos AS
SELECT 
  t.id,
  t.nombre,
  t.descripcion,
  t.hora_inicio,
  t.hora_fin,
  t.dias_semana,
  t.color,
  COUNT(DISTINCT ut.usuario_id) AS usuarios_asignados
FROM turnos t
LEFT JOIN usuario_turnos ut ON t.id = ut.turno_id AND ut.activo = TRUE
WHERE t.activo = TRUE
GROUP BY t.id;

-- ====================================
-- Vista: usuarios_con_turnos
-- Usuarios con sus turnos asignados
-- ====================================
CREATE OR REPLACE VIEW usuarios_con_turnos AS
SELECT 
  u.id AS usuario_id,
  u.nombre,
  u.apellidos,
  u.email,
  u.identificacion,
  t.id AS turno_id,
  t.nombre AS turno_nombre,
  t.hora_inicio,
  t.hora_fin,
  t.dias_semana,
  t.color,
  ut.fecha_inicio,
  ut.fecha_fin,
  ut.activo AS asignacion_activa
FROM usuarios u
INNER JOIN usuario_turnos ut ON u.id = ut.usuario_id
INNER JOIN turnos t ON ut.turno_id = t.id
WHERE u.activo = TRUE AND t.activo = TRUE;

-- ====================================
-- Función: verificar_turno_usuario
-- Verifica si un usuario tiene un turno activo en el momento actual
-- ====================================
DELIMITER //
CREATE FUNCTION verificar_turno_usuario(
  p_usuario_id INT,
  p_fecha_hora DATETIME
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  DECLARE v_tiene_turno BOOLEAN DEFAULT FALSE;
  DECLARE v_dia_semana INT;
  DECLARE v_hora_actual TIME;
  
  -- Obtener día de la semana (1=Lunes, 7=Domingo)
  SET v_dia_semana = DAYOFWEEK(p_fecha_hora) - 1;
  IF v_dia_semana = 0 THEN SET v_dia_semana = 7; END IF;
  
  -- Obtener hora
  SET v_hora_actual = TIME(p_fecha_hora);
  
  -- Verificar si tiene turno activo en este momento
  SELECT EXISTS(
    SELECT 1
    FROM usuario_turnos ut
    INNER JOIN turnos t ON ut.turno_id = t.id
    WHERE ut.usuario_id = p_usuario_id
      AND ut.activo = TRUE
      AND t.activo = TRUE
      AND (ut.fecha_inicio <= DATE(p_fecha_hora))
      AND (ut.fecha_fin IS NULL OR ut.fecha_fin >= DATE(p_fecha_hora))
      AND JSON_CONTAINS(t.dias_semana, CAST(v_dia_semana AS CHAR))
      AND (
        (t.hora_inicio <= t.hora_fin AND v_hora_actual BETWEEN t.hora_inicio AND t.hora_fin)
        OR
        (t.hora_inicio > t.hora_fin AND (v_hora_actual >= t.hora_inicio OR v_hora_actual <= t.hora_fin))
      )
  ) INTO v_tiene_turno;
  
  RETURN v_tiene_turno;
END //
DELIMITER ;

-- ====================================
-- Procedimiento: obtener_turno_actual
-- Obtiene el turno actual de un usuario
-- ====================================
DELIMITER //
CREATE PROCEDURE obtener_turno_actual(
  IN p_usuario_id INT,
  IN p_fecha_hora DATETIME
)
BEGIN
  DECLARE v_dia_semana INT;
  DECLARE v_hora_actual TIME;
  
  SET v_dia_semana = DAYOFWEEK(p_fecha_hora) - 1;
  IF v_dia_semana = 0 THEN SET v_dia_semana = 7; END IF;
  SET v_hora_actual = TIME(p_fecha_hora);
  
  SELECT 
    t.id,
    t.nombre,
    t.hora_inicio,
    t.hora_fin,
    t.dias_semana,
    ut.fecha_inicio,
    ut.fecha_fin
  FROM usuario_turnos ut
  INNER JOIN turnos t ON ut.turno_id = t.id
  WHERE ut.usuario_id = p_usuario_id
    AND ut.activo = TRUE
    AND t.activo = TRUE
    AND (ut.fecha_inicio <= DATE(p_fecha_hora))
    AND (ut.fecha_fin IS NULL OR ut.fecha_fin >= DATE(p_fecha_hora))
    AND JSON_CONTAINS(t.dias_semana, CAST(v_dia_semana AS CHAR))
    AND (
      (t.hora_inicio <= t.hora_fin AND v_hora_actual BETWEEN t.hora_inicio AND t.hora_fin)
      OR
      (t.hora_inicio > t.hora_fin AND (v_hora_actual >= t.hora_inicio OR v_hora_actual <= t.hora_fin))
    )
  LIMIT 1;
END //
DELIMITER ;

-- ====================================
-- Datos de ejemplo (comentar en producción)
-- ====================================
/*
INSERT INTO turnos (nombre, descripcion, hora_inicio, hora_fin, dias_semana, color) VALUES
('Turno Mañana', 'Horario de 7:00 a 15:00', '07:00:00', '15:00:00', '[1,2,3,4,5]', '#4CAF50'),
('Turno Tarde', 'Horario de 15:00 a 23:00', '15:00:00', '23:00:00', '[1,2,3,4,5]', '#FF9800'),
('Turno Noche', 'Horario de 23:00 a 7:00', '23:00:00', '07:00:00', '[1,2,3,4,5]', '#9C27B0'),
('Fin de Semana', 'Sábados y Domingos todo el día', '00:00:00', '23:59:59', '[6,7]', '#2196F3');
*/

-- ====================================
-- Fin del script
-- ====================================
SELECT '✅ Sistema de turnos instalado correctamente' AS resultado;

