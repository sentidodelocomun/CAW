const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ============================================
// Función auxiliar: Calcular distancia euclidiana
// ============================================
const euclideanDistance = (desc1, desc2) => {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
};

// ============================================
// Función auxiliar: Procesar imagen base64
// ============================================
const processBase64Image = (imageData) => {
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

// ============================================
// POST /api/register - Registrar nuevo usuario
// ============================================
router.post('/register', async (req, res) => {
  console.log('📝 Solicitud de registro recibida');
  
  const { nombre, apellidos, email, identificacion, departamento, cargo, descriptor, image } = req.body;
  
  // Validación de campos obligatorios
  if (!nombre || !apellidos || !email || !identificacion || !descriptor || !image) {
    console.error('❌ Faltan campos obligatorios');
    return res.status(400).json({ 
      success: false,
      message: 'Faltan campos obligatorios: nombre, apellidos, email, identificacion, descriptor, image' 
    });
  }
  
  // Validar descriptor (debe ser array de 128 elementos)
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    console.error('❌ Descriptor facial inválido');
    return res.status(400).json({ 
      success: false,
      message: 'El descriptor facial debe ser un array de 128 elementos' 
    });
  }
  
  try {
    // Verificar si el email o identificación ya existen
    const [existingUsers] = await db.query(
      'SELECT id, email, identificacion FROM usuarios WHERE email = ? OR identificacion = ?',
      [email, identificacion]
    );
    
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.email === email) {
        console.error('❌ Email ya registrado:', email);
        return res.status(409).json({ 
          success: false,
          message: 'El email ya está registrado en el sistema' 
        });
      }
      if (existing.identificacion === identificacion) {
        console.error('❌ Identificación ya registrada:', identificacion);
        return res.status(409).json({ 
          success: false,
          message: 'La identificación ya está registrada en el sistema' 
        });
      }
    }
    
    // Iniciar transacción
    await db.query('START TRANSACTION');
    
    try {
      // Insertar usuario
      const [userResult] = await db.query(
        `INSERT INTO usuarios (nombre, apellidos, email, identificacion, departamento, cargo) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, apellidos, email, identificacion, departamento, cargo]
      );
      
      const userId = userResult.insertId;
      console.log('✅ Usuario creado con ID:', userId);
      
      // Insertar descriptor facial
      // MySQL con tipo JSON hace la conversión automáticamente
      await db.query(
        'INSERT INTO descriptores_faciales (usuario_id, descriptor) VALUES (?, ?)',
        [userId, JSON.stringify(descriptor)]
      );
      
      console.log('✅ Descriptor facial guardado');
      
      // Guardar foto de registro
      const imageBuffer = processBase64Image(image);
      await db.query(
        'INSERT INTO fotos (usuario_id, imagen, tipo_captura) VALUES (?, ?, ?)',
        [userId, imageBuffer, 'registro']
      );
      
      console.log('✅ Foto de registro guardada');
      
      // Confirmar transacción
      await db.query('COMMIT');
      
      console.log('✅ Registro completado exitosamente para:', nombre, apellidos);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        usuario: {
          id: userId,
          nombre,
          apellidos,
          email,
          identificacion,
          departamento,
          cargo
        }
      });
      
    } catch (error) {
      // Revertir transacción en caso de error
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al registrar usuario: ' + error.message 
    });
  }
});

// ============================================
// POST /api/verify - Verificar acceso
// ============================================
router.post('/verify', async (req, res) => {
  console.log('🔍 Solicitud de verificación recibida');
  
  const { descriptor, image, tipo_acceso = 'entrada' } = req.body;
  
  // Log para debug
  console.log('📋 Tipo de acceso recibido:', tipo_acceso);
  
  // Validación
  if (!descriptor || !image) {
    console.error('❌ Faltan campos obligatorios');
    return res.status(400).json({ 
      success: false,
      message: 'Faltan campos obligatorios: descriptor, image' 
    });
  }
  
  if (tipo_acceso && !['entrada', 'salida'].includes(tipo_acceso)) {
    console.error('❌ Tipo de acceso inválido:', tipo_acceso);
    return res.status(400).json({ 
      success: false,
      message: 'El tipo_acceso debe ser "entrada" o "salida"' 
    });
  }
  
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    console.error('❌ Descriptor facial inválido');
    return res.status(400).json({ 
      success: false,
      message: 'El descriptor facial debe ser un array de 128 elementos' 
    });
  }
  
  try {
    // Obtener umbral de similitud de la configuración
    const [configResult] = await db.query(
      "SELECT valor FROM configuracion WHERE clave = 'umbral_similitud'"
    );
    
    const umbral = configResult.length > 0 
      ? parseFloat(configResult[0].valor) 
      : parseFloat(process.env.FACE_MATCH_THRESHOLD || 0.6);
    
    console.log('🎯 Umbral de similitud:', umbral);
    
    // Obtener todos los usuarios activos con sus descriptores
    const [usuarios] = await db.query(`
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.identificacion, 
        u.departamento, u.cargo,
        df.descriptor
      FROM usuarios u
      INNER JOIN descriptores_faciales df ON u.id = df.usuario_id
      WHERE u.activo = TRUE AND df.activo = TRUE
    `);
    
    if (usuarios.length === 0) {
      console.log('⚠️ No hay usuarios registrados en el sistema');
      return res.status(404).json({ 
        success: false,
        message: 'No hay usuarios registrados en el sistema' 
      });
    }
    
    console.log(`🔍 Comparando contra ${usuarios.length} descriptor(es) facial(es)...`);
    
    // Buscar el mejor match
    let bestMatch = null;
    let minDistance = Infinity;
    
    for (const usuario of usuarios) {
      // MySQL devuelve el JSON ya parseado como objeto/array
      const storedDescriptor = typeof usuario.descriptor === 'string' 
        ? JSON.parse(usuario.descriptor) 
        : usuario.descriptor;
      const distance = euclideanDistance(descriptor, storedDescriptor);
      
      console.log(`   Usuario ${usuario.nombre} ${usuario.apellidos}: distancia = ${distance.toFixed(4)}`);
      
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = usuario;
      }
    }
    
    // Convertir distancia a similitud (0-1, donde 1 es idéntico)
    // Distancia típica entre caras diferentes: ~0.6-1.0
    // Distancia típica entre la misma cara: ~0.0-0.4
    const similitud = Math.max(0, 1 - minDistance);
    
    console.log(`🎯 Mejor coincidencia: ${bestMatch.nombre} ${bestMatch.apellidos}`);
    console.log(`📊 Similitud: ${(similitud * 100).toFixed(2)}% (distancia: ${minDistance.toFixed(4)})`);
    
    // Guardar foto del intento
    const imageBuffer = processBase64Image(image);
    const [fotoResult] = await db.query(
      'INSERT INTO fotos (usuario_id, imagen, tipo_captura) VALUES (?, ?, ?)',
      [similitud >= umbral ? bestMatch.id : null, imageBuffer, 'verificacion']
    );
    
    const fotoId = fotoResult.insertId;
    
    // Verificar si supera el umbral
    if (similitud >= umbral) {
      // ✅ RECONOCIMIENTO FACIAL EXITOSO
      console.log('✅ Rostro reconocido');
      
      // Verificar configuración de turnos
      const [configTurnos] = await db.query(
        "SELECT valor FROM configuracion WHERE clave = 'validar_turnos'"
      );
      const validarTurnos = configTurnos.length > 0 && configTurnos[0].valor === 'true';
      
      let turnoValido = null;
      let turnoId = null;
      let mensajeTurno = '';
      
      if (validarTurnos) {
        // Verificar turno del usuario
        const [turnoActual] = await db.query(
          'CALL obtener_turno_actual(?, NOW())',
          [bestMatch.id]
        );
        
        if (turnoActual && turnoActual[0] && turnoActual[0].length > 0) {
          // Usuario tiene turno activo ahora
          turnoValido = true;
          turnoId = turnoActual[0][0].id;
          mensajeTurno = ` - Turno: ${turnoActual[0][0].nombre}`;
          console.log(`✅ Usuario en turno correcto: ${turnoActual[0][0].nombre}`);
        } else {
          // Usuario NO tiene turno activo ahora
          turnoValido = false;
          
          // Verificar si se permite acceso fuera de turno
          const [configPermitir] = await db.query(
            "SELECT valor FROM configuracion WHERE clave = 'permitir_acceso_fuera_turno'"
          );
          const permitirFueraTurno = configPermitir.length > 0 && configPermitir[0].valor === 'true';
          
          if (!permitirFueraTurno) {
            // ❌ ACCESO DENEGADO POR TURNO
            console.log('❌ ACCESO DENEGADO - Fuera de turno');
            
            await db.query(
              `INSERT INTO accesos (usuario_id, tipo_acceso, estado, similitud_facial, motivo_denegacion, foto_id, turno_valido, ubicacion)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [bestMatch.id, tipo_acceso, 'denegado', similitud, 'Fuera de horario de turno', fotoId, false, 'Sistema Web']
            );
            
            return res.status(403).json({
              success: false,
              message: 'Acceso denegado. Fuera de tu horario de turno asignado.',
              usuario: {
                nombre: bestMatch.nombre,
                apellidos: bestMatch.apellidos
              },
              similitud: similitud,
              motivo: 'fuera_de_turno'
            });
          } else {
            console.log('⚠️ Acceso permitido fuera de turno (configuración)');
            mensajeTurno = ' - Fuera de turno (permitido)';
          }
        }
      }
      
      // ✅ ACCESO AUTORIZADO
      console.log('✅ ACCESO AUTORIZADO' + mensajeTurno);
      console.log('📝 Registrando tipo de acceso:', tipo_acceso);
      
      // Registrar acceso autorizado
      await db.query(
        `INSERT INTO accesos (usuario_id, tipo_acceso, estado, similitud_facial, foto_id, turno_valido, turno_id, ubicacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bestMatch.id, tipo_acceso, 'autorizado', similitud, fotoId, turnoValido, turnoId, 'Sistema Web']
      );
      
      res.status(200).json({
        success: true,
        message: 'Acceso autorizado' + mensajeTurno,
        usuario: {
          id: bestMatch.id,
          nombre: bestMatch.nombre,
          apellidos: bestMatch.apellidos,
          email: bestMatch.email,
          identificacion: bestMatch.identificacion,
          departamento: bestMatch.departamento,
          cargo: bestMatch.cargo
        },
        similitud: similitud,
        turno_valido: turnoValido,
        timestamp: new Date().toISOString()
      });
      
    } else {
      // ❌ ACCESO DENEGADO
      console.log('❌ ACCESO DENEGADO - Similitud insuficiente');
      
      // Registrar acceso denegado
      await db.query(
        `INSERT INTO accesos (usuario_id, tipo_acceso, estado, similitud_facial, motivo_denegacion, foto_id, ubicacion)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [null, tipo_acceso, 'denegado', similitud, 'Similitud facial insuficiente', fotoId, 'Sistema Web']
      );
      
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. No se reconoce el rostro o la similitud es insuficiente.',
        similitud: similitud,
        umbral_requerido: umbral,
        mejor_coincidencia: {
          nombre: bestMatch.nombre,
          apellidos: bestMatch.apellidos,
          similitud: similitud
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    
    // Registrar error
    try {
      const imageBuffer = processBase64Image(image);
      const [fotoResult] = await db.query(
        'INSERT INTO fotos (imagen, tipo_captura) VALUES (?, ?)',
        [imageBuffer, 'desconocido']
      );
      
      await db.query(
        `INSERT INTO accesos (tipo_acceso, estado, motivo_denegacion, foto_id, ubicacion)
         VALUES (?, ?, ?, ?, ?)`,
        ['entrada', 'error', 'Error del sistema: ' + error.message, fotoResult.insertId, 'Sistema Web']
      );
    } catch (logError) {
      console.error('Error al registrar el error:', logError);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar acceso: ' + error.message 
    });
  }
});

// ============================================
// GET /api/usuarios - Listar usuarios (opcional)
// ============================================
router.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.identificacion,
        u.departamento, u.cargo, u.activo, u.fecha_registro,
        COUNT(DISTINCT df.id) as num_descriptores,
        COUNT(DISTINCT a.id) as total_accesos,
        MAX(a.fecha_acceso) as ultimo_acceso
      FROM usuarios u
      LEFT JOIN descriptores_faciales df ON u.id = df.usuario_id AND df.activo = TRUE
      LEFT JOIN accesos a ON u.id = a.usuario_id AND a.estado = 'autorizado'
      GROUP BY u.id
      ORDER BY u.fecha_registro DESC
    `);
    
    res.status(200).json({
      success: true,
      usuarios: usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios' 
    });
  }
});

// ============================================
// GET /api/accesos - Listar últimos accesos (opcional)
// ============================================
router.get('/accesos', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const [accesos] = await db.query(`
      SELECT 
        a.id, a.usuario_id, a.tipo_acceso, a.estado,
        a.similitud_facial, a.motivo_denegacion, a.fecha_acceso,
        a.ubicacion,
        CONCAT(u.nombre, ' ', u.apellidos) as nombre_completo,
        u.identificacion, u.departamento
      FROM accesos a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.fecha_acceso DESC
      LIMIT ?
    `, [limit]);
    
    res.status(200).json({
      success: true,
      accesos: accesos
    });
  } catch (error) {
    console.error('Error al obtener accesos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener accesos' 
    });
  }
});

// ============================================
// GET /api/configuracion - Obtener configuración del sistema
// ============================================
router.get('/configuracion', async (req, res) => {
  try {
    const [config] = await db.query('SELECT * FROM configuracion');
    
    res.status(200).json({
      success: true,
      configuracion: config
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener configuración' 
    });
  }
});

// ============================================
// POST /api/configuracion - Actualizar configuración
// ============================================
router.post('/configuracion', async (req, res) => {
  try {
    const { 
      umbral_similitud, 
      dias_retencion_fotos, 
      dias_retencion_logs, 
      max_descriptores_por_usuario 
    } = req.body;
    
    // Actualizar cada configuración
    if (umbral_similitud !== undefined) {
      await db.query(
        "UPDATE configuracion SET valor = ? WHERE clave = 'umbral_similitud'",
        [umbral_similitud.toString()]
      );
    }
    
    if (dias_retencion_fotos !== undefined) {
      await db.query(
        "UPDATE configuracion SET valor = ? WHERE clave = 'dias_retencion_fotos'",
        [dias_retencion_fotos.toString()]
      );
    }
    
    if (dias_retencion_logs !== undefined) {
      await db.query(
        "UPDATE configuracion SET valor = ? WHERE clave = 'dias_retencion_logs'",
        [dias_retencion_logs.toString()]
      );
    }
    
    if (max_descriptores_por_usuario !== undefined) {
      await db.query(
        "UPDATE configuracion SET valor = ? WHERE clave = 'max_descriptores_por_usuario'",
        [max_descriptores_por_usuario.toString()]
      );
    }
    
    if (req.body.validar_turnos !== undefined) {
      await db.query(
        "UPDATE configuracion SET valor = ? WHERE clave = 'validar_turnos'",
        [req.body.validar_turnos]
      );
    }
    
    if (req.body.permitir_acceso_fuera_turno !== undefined) {
      await db.query(
        "UPDATE configuracion SET valor = ? WHERE clave = 'permitir_acceso_fuera_turno'",
        [req.body.permitir_acceso_fuera_turno]
      );
    }
    
    console.log('✅ Configuración actualizada');
    
    res.status(200).json({
      success: true,
      message: 'Configuración actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar configuración' 
    });
  }
});

// ============================================
// POST /api/usuarios/:id/desactivar - Desactivar usuario
// ============================================
router.post('/usuarios/:id/desactivar', async (req, res) => {
  try {
    const userId = req.params.id;
    
    await db.query('UPDATE usuarios SET activo = FALSE WHERE id = ?', [userId]);
    await db.query('UPDATE descriptores_faciales SET activo = FALSE WHERE usuario_id = ?', [userId]);
    
    console.log(`✅ Usuario ${userId} desactivado`);
    
    res.status(200).json({
      success: true,
      message: 'Usuario desactivado correctamente'
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al desactivar usuario' 
    });
  }
});

// ============================================
// POST /api/usuarios/:id/activar - Activar usuario
// ============================================
router.post('/usuarios/:id/activar', async (req, res) => {
  try {
    const userId = req.params.id;
    
    await db.query('UPDATE usuarios SET activo = TRUE WHERE id = ?', [userId]);
    await db.query('UPDATE descriptores_faciales SET activo = TRUE WHERE usuario_id = ?', [userId]);
    
    console.log(`✅ Usuario ${userId} activado`);
    
    res.status(200).json({
      success: true,
      message: 'Usuario activado correctamente'
    });
  } catch (error) {
    console.error('Error al activar usuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al activar usuario' 
    });
  }
});

// ============================================
// POST /api/limpiar-bd - Limpiar toda la base de datos
// ============================================
router.post('/limpiar-bd', async (req, res) => {
  try {
    console.log('⚠️ Limpiando base de datos...');
    
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE accesos');
    await db.query('TRUNCATE TABLE fotos');
    await db.query('TRUNCATE TABLE descriptores_faciales');
    await db.query('TRUNCATE TABLE usuarios');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Base de datos limpiada');
    
    res.status(200).json({
      success: true,
      message: 'Base de datos limpiada correctamente'
    });
  } catch (error) {
    console.error('Error al limpiar base de datos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al limpiar base de datos' 
    });
  }
});

// ============================================
// GESTIÓN DE TURNOS
// ============================================

// GET /api/turnos - Listar todos los turnos
router.get('/turnos', async (req, res) => {
  try {
    const [turnos] = await db.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT ut.usuario_id) as usuarios_asignados
      FROM turnos t
      LEFT JOIN usuario_turnos ut ON t.id = ut.turno_id AND ut.activo = TRUE
      GROUP BY t.id
      ORDER BY t.hora_inicio
    `);
    
    res.status(200).json({
      success: true,
      turnos: turnos
    });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener turnos' 
    });
  }
});

// POST /api/turnos - Crear nuevo turno
router.post('/turnos', async (req, res) => {
  try {
    const { nombre, descripcion, hora_inicio, hora_fin, dias_semana, color } = req.body;
    
    if (!nombre || !hora_inicio || !hora_fin || !dias_semana) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO turnos (nombre, descripcion, hora_inicio, hora_fin, dias_semana, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, hora_inicio, hora_fin, JSON.stringify(dias_semana), color || '#667eea']
    );
    
    console.log('✅ Turno creado:', nombre);
    
    res.status(201).json({
      success: true,
      message: 'Turno creado correctamente',
      turno_id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear turno:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear turno' 
    });
  }
});

// PUT /api/turnos/:id - Actualizar turno
router.put('/turnos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, hora_inicio, hora_fin, dias_semana, color, activo } = req.body;
    
    await db.query(
      `UPDATE turnos 
       SET nombre = ?, descripcion = ?, hora_inicio = ?, hora_fin = ?, 
           dias_semana = ?, color = ?, activo = ?
       WHERE id = ?`,
      [nombre, descripcion, hora_inicio, hora_fin, JSON.stringify(dias_semana), color, activo, id]
    );
    
    console.log('✅ Turno actualizado:', id);
    
    res.status(200).json({
      success: true,
      message: 'Turno actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar turno' 
    });
  }
});

// DELETE /api/turnos/:id - Eliminar turno
router.delete('/turnos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM turnos WHERE id = ?', [id]);
    
    console.log('✅ Turno eliminado:', id);
    
    res.status(200).json({
      success: true,
      message: 'Turno eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar turno' 
    });
  }
});

// GET /api/usuarios/:id/turnos - Obtener turnos de un usuario
router.get('/usuarios/:id/turnos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [turnos] = await db.query(`
      SELECT 
        ut.id as asignacion_id,
        ut.turno_id,
        t.*,
        ut.fecha_inicio,
        ut.fecha_fin,
        ut.activo as asignacion_activa
      FROM usuario_turnos ut
      INNER JOIN turnos t ON ut.turno_id = t.id
      WHERE ut.usuario_id = ?
      ORDER BY ut.fecha_inicio DESC
    `, [id]);
    
    res.status(200).json({
      success: true,
      turnos: turnos
    });
  } catch (error) {
    console.error('Error al obtener turnos del usuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener turnos del usuario' 
    });
  }
});

// POST /api/usuarios/:id/turnos - Asignar turno a usuario
router.post('/usuarios/:id/turnos', async (req, res) => {
  try {
    const { id } = req.params;
    const { turno_id, fecha_inicio, fecha_fin } = req.body;
    
    if (!turno_id || !fecha_inicio) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    await db.query(
      `INSERT INTO usuario_turnos (usuario_id, turno_id, fecha_inicio, fecha_fin)
       VALUES (?, ?, ?, ?)`,
      [id, turno_id, fecha_inicio, fecha_fin]
    );
    
    console.log(`✅ Turno ${turno_id} asignado a usuario ${id}`);
    
    res.status(201).json({
      success: true,
      message: 'Turno asignado correctamente'
    });
  } catch (error) {
    console.error('Error al asignar turno:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al asignar turno' 
    });
  }
});

// DELETE /api/usuarios/:userId/turnos/:asignacionId - Eliminar asignación de turno
router.delete('/usuarios/:userId/turnos/:asignacionId', async (req, res) => {
  try {
    const { asignacionId } = req.params;
    
    await db.query('DELETE FROM usuario_turnos WHERE id = ?', [asignacionId]);
    
    console.log('✅ Asignación de turno eliminada:', asignacionId);
    
    res.status(200).json({
      success: true,
      message: 'Asignación de turno eliminada'
    });
  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar asignación' 
    });
  }
});

// ============================================
// Ruta legacy /upload (mantener por compatibilidad)
// ============================================
router.post('/upload', async (req, res) => {
  console.log('⚠️ Ruta /upload deprecated - usar /register o /verify');
  res.status(410).json({ 
    success: false,
    message: 'Esta ruta está deprecada. Usa /api/register para registrar o /api/verify para verificar acceso.' 
  });
});

module.exports = router;


