// ============================================
// Panel de Administración
// Sistema de Control de Acceso
// ============================================

// Contraseña de administrador (en producción debe estar en el backend)
const ADMIN_PASSWORD = 'admin123'; // CAMBIAR EN PRODUCCIÓN

// ============================================
// Sistema de Login
// ============================================
function login() {
  const password = document.getElementById('admin-password').value;
  const errorMsg = document.getElementById('error-message');
  
  if (password === ADMIN_PASSWORD) {
    // Guardar sesión
    sessionStorage.setItem('adminAuth', 'true');
    
    // Ocultar login y mostrar panel
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Cargar datos
    cargarDashboard();
    cargarUsuarios();
    cargarAccesos();
    cargarConfiguracion();
  } else {
    errorMsg.style.display = 'block';
    document.getElementById('admin-password').value = '';
  }
}

function logout() {
  sessionStorage.removeItem('adminAuth');
  location.reload();
}

// Enter para login
document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('admin-password');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') login();
    });
  }
  
  // Verificar si ya está autenticado
  if (sessionStorage.getItem('adminAuth') === 'true') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    cargarDashboard();
    cargarUsuarios();
    cargarAccesos();
    cargarConfiguracion();
  }
});

// ============================================
// Navegación entre tabs
// ============================================
function showTab(tabName) {
  // Actualizar botones
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Actualizar contenido
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${tabName}-section`).classList.add('active');
  
  // Cargar datos según la pestaña
  switch(tabName) {
    case 'usuarios':
      cargarUsuarios();
      break;
    case 'turnos':
      cargarTurnos();
      break;
    case 'accesos':
      cargarAccesos();
      break;
    case 'config':
      cargarConfiguracion();
      break;
  }
}

// ============================================
// Variables globales para gestión de turnos
// ============================================
let usuarioSeleccionadoId = null;
let usuarioSeleccionadoNombre = '';

// Cargar Dashboard (Estadísticas)
// ============================================
async function cargarDashboard() {
  try {
    // Obtener usuarios
    const resUsuarios = await fetch('/api/usuarios');
    const dataUsuarios = await resUsuarios.json();
    const totalUsuarios = dataUsuarios.usuarios ? dataUsuarios.usuarios.length : 0;
    document.getElementById('stat-usuarios').textContent = totalUsuarios;
    
    // Obtener accesos
    const resAccesos = await fetch('/api/accesos?limit=1000');
    const dataAccesos = await resAccesos.json();
    const accesos = dataAccesos.accesos || [];
    
    // Calcular accesos de hoy
    const hoy = new Date().toDateString();
    const accesosHoy = accesos.filter(a => {
      return new Date(a.fecha_acceso).toDateString() === hoy;
    }).length;
    
    // Calcular autorizados y denegados
    const autorizados = accesos.filter(a => a.estado === 'autorizado').length;
    const denegados = accesos.filter(a => a.estado === 'denegado').length;
    
    document.getElementById('stat-accesos-hoy').textContent = accesosHoy;
    document.getElementById('stat-autorizados').textContent = autorizados;
    document.getElementById('stat-denegados').textContent = denegados;
    
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

// ============================================
// Cargar Lista de Usuarios
// ============================================
async function cargarUsuarios() {
  const container = document.getElementById('usuarios-content');
  container.innerHTML = '<div class="loading">Cargando usuarios...</div>';
  
  try {
    const response = await fetch('/api/usuarios');
    const data = await response.json();
    
    if (!data.success || !data.usuarios || data.usuarios.length === 0) {
      container.innerHTML = '<div class="no-data">No hay usuarios registrados</div>';
      return;
    }
    
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Identificación</th>
              <th>Departamento</th>
              <th>Turnos</th>
              <th>Accesos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Obtener turnos para mostrar info
    const resTurnos = await fetch('/api/turnos');
    const dataTurnos = await resTurnos.json();
    const turnosMap = {};
    if (dataTurnos.success && dataTurnos.turnos) {
      dataTurnos.turnos.forEach(t => turnosMap[t.id] = t);
    }
    
    for (const u of data.usuarios) {
      const ultimoAcceso = u.ultimo_acceso 
        ? new Date(u.ultimo_acceso).toLocaleString('es-ES')
        : 'Nunca';
      
      const estadoBadge = u.activo 
        ? '<span class="badge success">Activo</span>'
        : '<span class="badge danger">Inactivo</span>';
      
      // Obtener turnos del usuario
      let turnosInfo = '-';
      try {
        const resTurnosUsuario = await fetch(`/api/usuarios/${u.id}/turnos`);
        const dataTurnosUsuario = await resTurnosUsuario.json();
        if (dataTurnosUsuario.success && dataTurnosUsuario.turnos.length > 0) {
          const turnosActivos = dataTurnosUsuario.turnos.filter(t => t.asignacion_activa);
          if (turnosActivos.length > 0) {
            turnosInfo = turnosActivos.map(t => {
              const turno = turnosMap[t.turno_id];
              return turno ? `<span style="display: inline-block; padding: 3px 8px; background: ${turno.color}; color: white; border-radius: 5px; font-size: 0.85em; margin: 2px;">${turno.nombre}</span>` : '';
            }).join(' ');
          }
        }
      } catch (e) {
        console.error('Error obteniendo turnos del usuario:', e);
      }
      
      html += `
        <tr>
          <td>${u.id}</td>
          <td><strong>${u.nombre} ${u.apellidos}</strong><br><small>${ultimoAcceso}</small></td>
          <td>${u.email}</td>
          <td>${u.identificacion}</td>
          <td>${u.departamento || '-'}</td>
          <td>${turnosInfo}</td>
          <td>${u.total_accesos}</td>
          <td>${estadoBadge}</td>
          <td>
            <button class="action-btn btn-edit" onclick="gestionarTurnosUsuario(${u.id}, '${u.nombre} ${u.apellidos}')">🕒 Turnos</button>
            ${u.activo 
              ? `<button class="action-btn btn-delete" onclick="desactivarUsuario(${u.id})">Desactivar</button>`
              : `<button class="action-btn btn-activate" onclick="activarUsuario(${u.id})">Activar</button>`
            }
          </td>
        </tr>
      `;
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    container.innerHTML = '<div class="no-data">Error al cargar usuarios</div>';
  }
}

// ============================================
// Cargar Historial de Accesos
// ============================================
async function cargarAccesos() {
  const container = document.getElementById('accesos-content');
  container.innerHTML = '<div class="loading">Cargando historial...</div>';
  
  try {
    const response = await fetch('/api/accesos?limit=100');
    const data = await response.json();
    
    if (!data.success || !data.accesos || data.accesos.length === 0) {
      container.innerHTML = '<div class="no-data">No hay accesos registrados</div>';
      return;
    }
    
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Identificación</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Similitud</th>
              <th>Motivo</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.accesos.forEach(a => {
      const fecha = new Date(a.fecha_acceso).toLocaleString('es-ES');
      const nombre = a.nombre_completo || 'Desconocido';
      
      let estadoBadge;
      if (a.estado === 'autorizado') {
        estadoBadge = '<span class="badge success">Autorizado</span>';
      } else if (a.estado === 'denegado') {
        estadoBadge = '<span class="badge danger">Denegado</span>';
      } else {
        estadoBadge = '<span class="badge warning">Error</span>';
      }
      
      const similitud = a.similitud_facial 
        ? (a.similitud_facial * 100).toFixed(1) + '%'
        : '-';
      
      html += `
        <tr>
          <td>${a.id}</td>
          <td>${fecha}</td>
          <td><strong>${nombre}</strong></td>
          <td>${a.identificacion || '-'}</td>
          <td>${a.tipo_acceso}</td>
          <td>${estadoBadge}</td>
          <td>${similitud}</td>
          <td>${a.motivo_denegacion || '-'}</td>
          <td>${a.ubicacion || '-'}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando accesos:', error);
    container.innerHTML = '<div class="no-data">Error al cargar historial</div>';
  }
}

// ============================================
// Cargar Configuración
// ============================================
async function cargarConfiguracion() {
  try {
    const response = await fetch('/api/configuracion');
    const data = await response.json();
    
    if (data.success && data.configuracion) {
      const config = data.configuracion;
      
      // Llenar formulario
      config.forEach(item => {
        switch(item.clave) {
          case 'umbral_similitud':
            // Convertir a formato local (con coma si es necesario)
            const umbralValue = parseFloat(item.valor).toFixed(2);
            document.getElementById('umbral').value = umbralValue;
            break;
          case 'dias_retencion_fotos':
            document.getElementById('dias-fotos').value = parseInt(item.valor);
            break;
          case 'dias_retencion_logs':
            document.getElementById('dias-logs').value = parseInt(item.valor);
            break;
          case 'max_descriptores_por_usuario':
            document.getElementById('max-descriptores').value = parseInt(item.valor);
            break;
          case 'validar_turnos':
            document.getElementById('validar-turnos').checked = item.valor === 'true';
            break;
          case 'permitir_acceso_fuera_turno':
            document.getElementById('permitir-fuera-turno').checked = item.valor === 'true';
            break;
        }
      });
    }
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }
}

// ============================================
// Guardar Configuración
// ============================================
async function guardarConfiguracion() {
  // Reemplazar coma por punto para el umbral
  const umbralRaw = document.getElementById('umbral').value;
  const umbral = parseFloat(umbralRaw.replace(',', '.'));
  
  const diasFotos = document.getElementById('dias-fotos').value;
  const diasLogs = document.getElementById('dias-logs').value;
  const maxDescriptores = document.getElementById('max-descriptores').value;
  const validarTurnos = document.getElementById('validar-turnos').checked;
  const permitirFueraTurno = document.getElementById('permitir-fuera-turno').checked;
  
  const alert = document.getElementById('config-alert');
  
  // Validar umbral
  if (isNaN(umbral) || umbral < 0 || umbral > 1) {
    alert.textContent = '❌ El umbral debe ser un número entre 0.0 y 1.0';
    alert.className = 'alert error';
    alert.style.display = 'block';
    return;
  }
  
  try {
    const response = await fetch('/api/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        umbral_similitud: parseFloat(umbral),
        dias_retencion_fotos: parseInt(diasFotos),
        dias_retencion_logs: parseInt(diasLogs),
        max_descriptores_por_usuario: parseInt(maxDescriptores),
        validar_turnos: validarTurnos ? 'true' : 'false',
        permitir_acceso_fuera_turno: permitirFueraTurno ? 'true' : 'false'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert.textContent = '✅ Configuración guardada correctamente';
      alert.className = 'alert success';
      alert.style.display = 'block';
      
      setTimeout(() => {
        alert.style.display = 'none';
      }, 3000);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    alert.textContent = '❌ Error al guardar: ' + error.message;
    alert.className = 'alert error';
    alert.style.display = 'block';
  }
}

// ============================================
// Activar/Desactivar Usuario
// ============================================
async function desactivarUsuario(userId) {
  if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
  
  try {
    const response = await fetch(`/api/usuarios/${userId}/desactivar`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const alert = document.getElementById('usuarios-alert');
      alert.textContent = '✅ Usuario desactivado correctamente';
      alert.style.display = 'block';
      
      setTimeout(() => alert.style.display = 'none', 3000);
      
      cargarUsuarios();
      cargarDashboard();
    }
  } catch (error) {
    alert('Error al desactivar usuario: ' + error.message);
  }
}

async function activarUsuario(userId) {
  try {
    const response = await fetch(`/api/usuarios/${userId}/activar`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const alert = document.getElementById('usuarios-alert');
      alert.textContent = '✅ Usuario activado correctamente';
      alert.style.display = 'block';
      
      setTimeout(() => alert.style.display = 'none', 3000);
      
      cargarUsuarios();
      cargarDashboard();
    }
  } catch (error) {
    alert('Error al activar usuario: ' + error.message);
  }
}

// ============================================
// Limpiar Base de Datos
// ============================================
async function limpiarBaseDatos() {
  const confirmacion = prompt(
    '⚠️ ADVERTENCIA: Esto eliminará TODOS los datos.\n\n' +
    'Usuarios, descriptores, fotos y accesos serán ELIMINADOS PERMANENTEMENTE.\n\n' +
    'Escribe "CONFIRMAR" para continuar:'
  );
  
  if (confirmacion !== 'CONFIRMAR') {
    alert('Operación cancelada');
    return;
  }
  
  try {
    const response = await fetch('/api/limpiar-bd', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Base de datos limpiada correctamente');
      location.reload();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    alert('❌ Error al limpiar base de datos: ' + error.message);
  }
}

// ============================================
// GESTIÓN DE TURNOS
// ============================================

let turnoEditandoId = null;

// Cargar lista de turnos
async function cargarTurnos() {
  const container = document.getElementById('turnos-content');
  container.innerHTML = '<div class="loading">Cargando turnos...</div>';
  
  try {
    console.log('🔄 Cargando turnos desde /api/turnos...');
    const response = await fetch('/api/turnos');
    console.log('📡 Respuesta recibida:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos:', data);
    
    if (!data.success) {
      container.innerHTML = `<div class="no-data">Error: ${data.message || 'Error desconocido'}</div>`;
      return;
    }
    
    if (!data.turnos || data.turnos.length === 0) {
      container.innerHTML = '<div class="no-data">No hay turnos configurados. Haz clic en "Crear Nuevo Turno" para empezar.</div>';
      return;
    }
    
    const dias = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Horario</th>
              <th>Días</th>
              <th>Usuarios</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.turnos.forEach(t => {
      const diasArray = typeof t.dias_semana === 'string' ? JSON.parse(t.dias_semana) : t.dias_semana;
      const diasTexto = diasArray.map(d => dias[d]).join(', ');
      
      const estadoBadge = t.activo 
        ? '<span class="badge success">Activo</span>'
        : '<span class="badge danger">Inactivo</span>';
      
      html += `
        <tr>
          <td>
            <span style="display: inline-block; width: 15px; height: 15px; background: ${t.color}; border-radius: 3px; margin-right: 8px;"></span>
            <strong>${t.nombre}</strong>
            ${t.descripcion ? `<br><small>${t.descripcion}</small>` : ''}
          </td>
          <td>${t.hora_inicio.substring(0,5)} - ${t.hora_fin.substring(0,5)}</td>
          <td>${diasTexto}</td>
          <td>${t.usuarios_asignados} usuario(s)</td>
          <td>${estadoBadge}</td>
          <td>
            <button class="action-btn btn-edit" onclick="editarTurno(${t.id})">Editar</button>
            <button class="action-btn btn-delete" onclick="eliminarTurno(${t.id})">Eliminar</button>
            <button class="action-btn btn-activate" onclick="verUsuariosTurno(${t.id})">Ver Usuarios</button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    console.log('✅ Turnos cargados correctamente');
    
  } catch (error) {
    console.error('❌ Error cargando turnos:', error);
    container.innerHTML = `
      <div class="no-data">
        <strong>Error al cargar turnos</strong><br>
        ${error.message}<br><br>
        <small>Revisa la consola del navegador (F12) para más detalles</small>
      </div>
    `;
  }
}

// Mostrar formulario de turno
function mostrarFormularioTurno() {
  turnoEditandoId = null;
  document.getElementById('form-turno-titulo').textContent = 'Nuevo Turno';
  document.getElementById('form-turno').style.display = 'block';
  
  // Limpiar formulario
  document.getElementById('turno-nombre').value = '';
  document.getElementById('turno-descripcion').value = '';
  document.getElementById('turno-inicio').value = '';
  document.getElementById('turno-fin').value = '';
  document.getElementById('turno-color').value = '#667eea';
  document.querySelectorAll('input[name="dia"]').forEach(cb => cb.checked = false);
}

// Cancelar formulario
function cancelarFormularioTurno() {
  document.getElementById('form-turno').style.display = 'none';
  turnoEditandoId = null;
}

// Guardar turno (crear o actualizar)
async function guardarTurno() {
  const nombre = document.getElementById('turno-nombre').value;
  const descripcion = document.getElementById('turno-descripcion').value;
  const inicio = document.getElementById('turno-inicio').value;
  const fin = document.getElementById('turno-fin').value;
  const color = document.getElementById('turno-color').value;
  
  // Obtener días seleccionados
  const diasSeleccionados = [];
  document.querySelectorAll('input[name="dia"]:checked').forEach(cb => {
    diasSeleccionados.push(parseInt(cb.value));
  });
  
  // Validar
  if (!nombre || !inicio || !fin || diasSeleccionados.length === 0) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }
  
  const alert = document.getElementById('turnos-alert');
  
  try {
    const url = turnoEditandoId ? `/api/turnos/${turnoEditandoId}` : '/api/turnos';
    const method = turnoEditandoId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        descripcion,
        hora_inicio: inicio,
        hora_fin: fin,
        dias_semana: diasSeleccionados,
        color,
        activo: true
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert.textContent = `✅ Turno ${turnoEditandoId ? 'actualizado' : 'creado'} correctamente`;
      alert.className = 'alert success';
      alert.style.display = 'block';
      
      setTimeout(() => alert.style.display = 'none', 3000);
      
      cancelarFormularioTurno();
      cargarTurnos();
    }
  } catch (error) {
    alert.textContent = '❌ Error al guardar turno: ' + error.message;
    alert.className = 'alert error';
    alert.style.display = 'block';
  }
}

// Editar turno
async function editarTurno(id) {
  try {
    const response = await fetch('/api/turnos');
    const data = await response.json();
    
    const turno = data.turnos.find(t => t.id === id);
    if (!turno) return;
    
    turnoEditandoId = id;
    document.getElementById('form-turno-titulo').textContent = 'Editar Turno';
    document.getElementById('form-turno').style.display = 'block';
    
    // Llenar formulario
    document.getElementById('turno-nombre').value = turno.nombre;
    document.getElementById('turno-descripcion').value = turno.descripcion || '';
    document.getElementById('turno-inicio').value = turno.hora_inicio.substring(0,5);
    document.getElementById('turno-fin').value = turno.hora_fin.substring(0,5);
    document.getElementById('turno-color').value = turno.color;
    
    // Manejar dias_semana que puede venir como string JSON o como array ya parseado
    const diasArray = typeof turno.dias_semana === 'string' 
      ? JSON.parse(turno.dias_semana) 
      : turno.dias_semana;
    
    document.querySelectorAll('input[name="dia"]').forEach(cb => {
      cb.checked = diasArray.includes(parseInt(cb.value));
    });
  } catch (error) {
    alert('Error al cargar turno: ' + error.message);
  }
}

// Eliminar turno
async function eliminarTurno(id) {
  if (!confirm('¿Estás seguro de eliminar este turno? Se eliminarán también todas las asignaciones.')) return;
  
  try {
    const response = await fetch(`/api/turnos/${id}`, { method: 'DELETE' });
    const data = await response.json();
    
    if (data.success) {
      const alert = document.getElementById('turnos-alert');
      alert.textContent = '✅ Turno eliminado correctamente';
      alert.className = 'alert success';
      alert.style.display = 'block';
      
      setTimeout(() => alert.style.display = 'none', 3000);
      
      cargarTurnos();
    }
  } catch (error) {
    alert('Error al eliminar turno: ' + error.message);
  }
}

// Ver usuarios asignados a un turno
async function verUsuariosTurno(turnoId) {
  try {
    const resTurno = await fetch('/api/turnos');
    const dataTurno = await resTurno.json();
    const turno = dataTurno.turnos.find(t => t.id === turnoId);
    
    if (!turno) {
      alert('Turno no encontrado');
      return;
    }
    
    const resUsuarios = await fetch('/api/usuarios');
    const dataUsuarios = await resUsuarios.json();
    
    const usuariosAsignados = [];
    
    console.log(`🔍 Buscando usuarios para turno ID: ${turnoId}`);
    
    for (const usuario of dataUsuarios.usuarios) {
      const resTurnosUsuario = await fetch(`/api/usuarios/${usuario.id}/turnos`);
      const dataTurnosUsuario = await resTurnosUsuario.json();
      
      console.log(`  Usuario ${usuario.nombre}: `, dataTurnosUsuario.turnos);
      
      // Buscar si tiene este turno asignado y activo
      // Convertir a número para comparación segura
      const turnoAsignado = dataTurnosUsuario.turnos.find(t => parseInt(t.turno_id) === parseInt(turnoId));
      
      if (turnoAsignado) {
        console.log(`    ✓ Turno encontrado:`, turnoAsignado);
        // Verificar si está activo (puede ser booleano o número 1/0)
        const estaActivo = turnoAsignado.asignacion_activa === true || 
                           turnoAsignado.asignacion_activa === 1 || 
                           turnoAsignado.asignacion_activa === '1';
        
        if (estaActivo) {
          console.log(`    ✓ Asignación activa`);
          usuariosAsignados.push(`${usuario.nombre} ${usuario.apellidos}`);
        } else {
          console.log(`    ✗ Asignación inactiva (valor: ${turnoAsignado.asignacion_activa})`);
        }
      }
    }
    
    console.log(`📊 Total usuarios asignados: ${usuariosAsignados.length}`);
    
    let mensaje = `Turno: ${turno.nombre}\n\nUsuarios asignados:\n\n`;
    
    if (usuariosAsignados.length > 0) {
      mensaje += usuariosAsignados.map(nombre => `- ${nombre}`).join('\n');
    } else {
      mensaje += 'No hay usuarios asignados a este turno';
    }
    
    alert(mensaje);
  } catch (error) {
    console.error('Error al cargar usuarios del turno:', error);
    alert('Error al cargar usuarios del turno: ' + error.message);
  }
}

// ============================================
// GESTIÓN DE TURNOS POR USUARIO
// ============================================

// Abrir modal de gestión de turnos para un usuario
async function gestionarTurnosUsuario(usuarioId, nombreCompleto) {
  usuarioSeleccionadoId = usuarioId;
  usuarioSeleccionadoNombre = nombreCompleto;
  
  // Mostrar modal
  document.getElementById('modal-turnos-usuario').style.display = 'block';
  document.getElementById('modal-usuario-info').textContent = `Usuario: ${nombreCompleto}`;
  
  // Cargar turnos disponibles en el select
  await cargarTurnosEnSelect();
  
  // Establecer fecha de inicio por defecto a hoy
  document.getElementById('fecha-inicio-turno').valueAsDate = new Date();
  document.getElementById('fecha-fin-turno').value = '';
  
  // Cargar turnos asignados
  await cargarTurnosAsignados();
}

// Cerrar modal de turnos
function cerrarModalTurnos() {
  document.getElementById('modal-turnos-usuario').style.display = 'none';
  usuarioSeleccionadoId = null;
  usuarioSeleccionadoNombre = '';
}

// Cargar turnos en el select
async function cargarTurnosEnSelect() {
  try {
    const response = await fetch('/api/turnos');
    const data = await response.json();
    
    const select = document.getElementById('select-turno');
    select.innerHTML = '<option value="">-- Selecciona un turno --</option>';
    
    if (data.success && data.turnos) {
      data.turnos.forEach(turno => {
        if (turno.activo) {
          const option = document.createElement('option');
          option.value = turno.id;
          option.textContent = `${turno.nombre} (${turno.hora_inicio.substring(0,5)} - ${turno.hora_fin.substring(0,5)})`;
          select.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error('Error cargando turnos:', error);
  }
}

// Cargar turnos asignados al usuario
async function cargarTurnosAsignados() {
  const container = document.getElementById('turnos-asignados-content');
  container.innerHTML = '<div class="loading">Cargando...</div>';
  
  try {
    const response = await fetch(`/api/usuarios/${usuarioSeleccionadoId}/turnos`);
    const data = await response.json();
    
    if (!data.success || !data.turnos || data.turnos.length === 0) {
      container.innerHTML = '<div class="no-data">No tiene turnos asignados</div>';
      return;
    }
    
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Turno</th>
              <th>Horario</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.turnos.forEach(t => {
      const fechaFin = t.fecha_fin ? new Date(t.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido';
      const estadoBadge = t.asignacion_activa 
        ? '<span class="badge success">Activo</span>'
        : '<span class="badge danger">Inactivo</span>';
      
      html += `
        <tr>
          <td>
            <span style="display: inline-block; width: 12px; height: 12px; background: ${t.color}; border-radius: 3px; margin-right: 5px;"></span>
            <strong>${t.nombre}</strong>
          </td>
          <td>${t.hora_inicio.substring(0,5)} - ${t.hora_fin.substring(0,5)}</td>
          <td>${new Date(t.fecha_inicio).toLocaleDateString('es-ES')}</td>
          <td>${fechaFin}</td>
          <td>${estadoBadge}</td>
          <td>
            <button class="action-btn btn-delete" onclick="eliminarAsignacionTurno(${t.asignacion_id})">Eliminar</button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando turnos asignados:', error);
    container.innerHTML = '<div class="no-data">Error al cargar turnos</div>';
  }
}

// Asignar turno a usuario
async function asignarTurnoAUsuario() {
  const turnoId = document.getElementById('select-turno').value;
  const fechaInicio = document.getElementById('fecha-inicio-turno').value;
  const fechaFin = document.getElementById('fecha-fin-turno').value;
  
  if (!turnoId || !fechaInicio) {
    alert('Por favor selecciona un turno y una fecha de inicio');
    return;
  }
  
  try {
    const response = await fetch(`/api/usuarios/${usuarioSeleccionadoId}/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turno_id: parseInt(turnoId),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Limpiar formulario
      document.getElementById('select-turno').value = '';
      document.getElementById('fecha-inicio-turno').valueAsDate = new Date();
      document.getElementById('fecha-fin-turno').value = '';
      
      // Recargar turnos asignados
      await cargarTurnosAsignados();
      
      // Mostrar mensaje
      alert('✅ Turno asignado correctamente');
      
      // Recargar tabla de usuarios
      cargarUsuarios();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    alert('❌ Error al asignar turno: ' + error.message);
  }
}

// Eliminar asignación de turno
async function eliminarAsignacionTurno(asignacionId) {
  if (!confirm('¿Estás seguro de eliminar esta asignación de turno?')) return;
  
  try {
    const response = await fetch(`/api/usuarios/${usuarioSeleccionadoId}/turnos/${asignacionId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Asignación eliminada correctamente');
      await cargarTurnosAsignados();
      cargarUsuarios();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    alert('❌ Error al eliminar asignación: ' + error.message);
  }
}


