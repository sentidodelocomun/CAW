// ============================================
// Sistema de Control de Acceso - Frontend
// Reconocimiento Facial con Face-API.js
// ============================================

// ============================================
// Variables globales
// ============================================
let modelsLoaded = false;
let cameraStreamVerificacion = null;
let cameraStreamRegistro = null;

// Elementos del DOM
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const canvas = document.getElementById('canvas');

// Verificación
const videoVerificacion = document.getElementById('video-verificacion');
const startCameraVerificacion = document.getElementById('start-camera-verificacion');
const verifyEntradaButton = document.getElementById('verify-entrada');
const verifySalidaButton = document.getElementById('verify-salida');
const overlayVerificacion = document.getElementById('overlay-verificacion');
const statusVerificacion = document.getElementById('status-verificacion');

// Registro
const videoRegistro = document.getElementById('video-registro');
const startCameraRegistro = document.getElementById('start-camera-registro');
const registerUserButton = document.getElementById('register-user');
const overlayRegistro = document.getElementById('overlay-registro');
const statusRegistro = document.getElementById('status-registro');
const formRegistro = document.getElementById('form-registro');

// ============================================
// Manejo de pestañas
// ============================================
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    // Actualizar pestañas activas
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Mostrar contenido correspondiente
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Detener streams de cámara al cambiar de pestaña
    stopAllCameras();
  });
});

// ============================================
// Cargar modelos de Face-API.js
// ============================================
const loadModels = async () => {
  if (modelsLoaded) return true;
  
  try {
    console.log('🔄 Cargando modelos de Face-API.js...');
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    
    modelsLoaded = true;
    console.log('✅ Modelos cargados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error cargando modelos:', error);
    showStatus(
      'error',
      'Error al cargar los modelos de reconocimiento facial. Verifica la consola.',
      null
    );
    return false;
  }
};

// ============================================
// Funciones de cámara
// ============================================
const startCamera = async (videoElement, overlayElement, buttonElement, captureButtonElement, streamVariable) => {
  try {
    // Cargar modelos primero
    if (!modelsLoaded) {
      overlayElement.textContent = 'Cargando modelos de IA...';
      const loaded = await loadModels();
      if (!loaded) return null;
    }

    overlayElement.textContent = 'Solicitando acceso a la cámara...';

    // Solicitar acceso a la cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false,
    });
    
    videoElement.srcObject = stream;
    await videoElement.play();
    
    overlayElement.textContent = '✅ Cámara activa - Sistema listo';
    buttonElement.disabled = true;
    buttonElement.textContent = '✓ Cámara Activa';
    
    // Si captureButtonElement es un array, habilitar todos los botones
    if (Array.isArray(captureButtonElement)) {
      captureButtonElement.forEach(btn => btn.disabled = false);
    } else {
      captureButtonElement.disabled = false;
    }
    
    console.log('✅ Cámara iniciada correctamente');
    return stream;
    
  } catch (error) {
    console.error('❌ Error al acceder a la cámara:', error);
    overlayElement.textContent = '❌ Error al acceder a la cámara';
    alert('No se pudo acceder a la cámara. Verifica:\n• Permisos de cámara\n• Usar HTTPS o localhost\n• Tener una cámara conectada');
    return null;
  }
};

const stopAllCameras = () => {
  if (cameraStreamVerificacion) {
    cameraStreamVerificacion.getTracks().forEach(track => track.stop());
    cameraStreamVerificacion = null;
    videoVerificacion.srcObject = null;
    startCameraVerificacion.disabled = false;
    startCameraVerificacion.textContent = '📷 Iniciar Cámara';
    verifyAccessButton.disabled = true;
    overlayVerificacion.textContent = 'Sistema listo. Inicia la cámara para comenzar.';
  }
  
  if (cameraStreamRegistro) {
    cameraStreamRegistro.getTracks().forEach(track => track.stop());
    cameraStreamRegistro = null;
    videoRegistro.srcObject = null;
    startCameraRegistro.disabled = false;
    startCameraRegistro.textContent = '📷 Iniciar Cámara';
    registerUserButton.disabled = true;
    overlayRegistro.textContent = 'Sistema listo. Inicia la cámara para comenzar.';
  }
};

// ============================================
// Detección facial
// ============================================
const detectFace = async (videoElement) => {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection;
  } catch (error) {
    console.error('❌ Error en detección facial:', error);
    return null;
  }
};

// ============================================
// Capturar imagen
// ============================================
const captureImage = (videoElement) => {
  const context = canvas.getContext('2d');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
};

// ============================================
// Mostrar mensajes de estado
// ============================================
const showStatus = (type, message, statusElement) => {
  if (!statusElement) return;
  
  statusElement.className = 'status-message';
  statusElement.classList.add(type);
  statusElement.textContent = message;
  
  // Auto-ocultar después de 10 segundos
  setTimeout(() => {
    statusElement.className = 'status-message';
  }, 10000);
};

// ============================================
// VERIFICACIÓN DE ACCESO
// ============================================
startCameraVerificacion.addEventListener('click', async () => {
  cameraStreamVerificacion = await startCamera(
    videoVerificacion,
    overlayVerificacion,
    startCameraVerificacion,
    [verifyEntradaButton, verifySalidaButton],
    'verificacion'
  );
});

// Función genérica para verificar acceso (entrada o salida)
async function verificarAcceso(tipoAcceso) {
  const isEntrada = tipoAcceso === 'entrada';
  const button = isEntrada ? verifyEntradaButton : verifySalidaButton;
  const otherButton = isEntrada ? verifySalidaButton : verifyEntradaButton;
  const originalText = button.textContent;
  const emoji = isEntrada ? '📥' : '📤';
  const accion = isEntrada ? 'ENTRADA' : 'SALIDA';
  
  try {
    button.disabled = true;
    otherButton.disabled = true;
    button.textContent = '🔄 Procesando...';
    overlayVerificacion.textContent = '🔄 Detectando rostro...';
    
    // Detectar rostro
    const detection = await detectFace(videoVerificacion);
    
    if (!detection) {
      showStatus('error', '❌ No se detectó ningún rostro. Asegúrate de estar frente a la cámara con buena iluminación.', statusVerificacion);
      overlayVerificacion.textContent = '❌ No se detectó rostro';
      button.disabled = false;
      otherButton.disabled = false;
      button.textContent = originalText;
      return;
    }
    
    console.log('✅ Rostro detectado');
    overlayVerificacion.textContent = '✅ Rostro detectado - Verificando identidad...';
    
    // Capturar imagen
    const imageData = captureImage(videoVerificacion);
    
    // Enviar al servidor para verificación
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descriptor: Array.from(detection.descriptor),
        image: imageData,
        tipo_acceso: tipoAcceso
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      const user = result.usuario;
      const similarity = (result.similitud * 100).toFixed(1);
      
      overlayVerificacion.textContent = `✅ ${accion} registrada: ${user.nombre}`;
      showStatus(
        'success',
        `${emoji} ${accion} AUTORIZADA\n\n` +
        `👤 Usuario: ${user.nombre} ${user.apellidos}\n` +
        `🏢 Departamento: ${user.departamento || 'N/A'}\n` +
        `📊 Similitud: ${similarity}%\n` +
        `🕐 ${new Date().toLocaleString()}`,
        statusVerificacion
      );
      
      console.log(`✅ ${accion} autorizada:`, user);
    } else {
      overlayVerificacion.textContent = `❌ ${accion} denegada`;
      showStatus(
        'error',
        `❌ ${accion} DENEGADA\n\n${result.message || 'Usuario no reconocido'}`,
        statusVerificacion
      );
      
      console.log(`❌ ${accion} denegada:`, result.message);
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    overlayVerificacion.textContent = '❌ Error en verificación';
    showStatus('error', `❌ Error: ${error.message}`, statusVerificacion);
  } finally {
    button.disabled = false;
    otherButton.disabled = false;
    button.textContent = originalText;
  }
}

// Event listeners para los botones de entrada y salida
verifyEntradaButton.addEventListener('click', () => verificarAcceso('entrada'));
verifySalidaButton.addEventListener('click', () => verificarAcceso('salida'));

// ============================================
// REGISTRO DE USUARIO
// ============================================
startCameraRegistro.addEventListener('click', async () => {
  cameraStreamRegistro = await startCamera(
    videoRegistro,
    overlayRegistro,
    startCameraRegistro,
    registerUserButton,
    'registro'
  );
});

registerUserButton.addEventListener('click', async () => {
  try {
    // Validar formulario
    if (!formRegistro.checkValidity()) {
      formRegistro.reportValidity();
      showStatus('error', '❌ Por favor, completa todos los campos obligatorios.', statusRegistro);
      return;
    }
    
    registerUserButton.disabled = true;
    registerUserButton.textContent = '🔄 Procesando...';
    overlayRegistro.textContent = '🔄 Detectando rostro...';
    
    // Detectar rostro
    const detection = await detectFace(videoRegistro);
    
    if (!detection) {
      showStatus('error', '❌ No se detectó ningún rostro. Asegúrate de estar frente a la cámara con buena iluminación.', statusRegistro);
      overlayRegistro.textContent = '❌ No se detectó rostro';
      registerUserButton.disabled = false;
      registerUserButton.textContent = '✓ Registrar Usuario';
      return;
    }
    
    console.log('✅ Rostro detectado');
    overlayRegistro.textContent = '✅ Rostro detectado - Guardando usuario...';
    
    // Capturar imagen
    const imageData = captureImage(videoRegistro);
    
    // Recopilar datos del formulario
    const formData = new FormData(formRegistro);
    const userData = {
      nombre: formData.get('nombre'),
      apellidos: formData.get('apellidos'),
      email: formData.get('email'),
      identificacion: formData.get('identificacion'),
      departamento: formData.get('departamento') || null,
      cargo: formData.get('cargo') || null,
      descriptor: Array.from(detection.descriptor),
      image: imageData
    };
    
    // Enviar al servidor
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      overlayRegistro.textContent = '✅ Usuario registrado correctamente';
      showStatus(
        'success',
        `✅ REGISTRO EXITOSO\n\n` +
        `Usuario ${userData.nombre} ${userData.apellidos} registrado correctamente.\n` +
        `Ya puedes usar el sistema de verificación de acceso.`,
        statusRegistro
      );
      
      // Limpiar formulario
      formRegistro.reset();
      
      console.log('✅ Usuario registrado:', result);
    } else {
      overlayRegistro.textContent = '❌ Error en registro';
      showStatus('error', `❌ ERROR: ${result.message || 'Error desconocido'}`, statusRegistro);
      console.error('❌ Error en registro:', result);
    }
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    overlayRegistro.textContent = '❌ Error en registro';
    showStatus('error', `❌ Error: ${error.message}`, statusRegistro);
  } finally {
    registerUserButton.disabled = false;
    registerUserButton.textContent = '✓ Registrar Usuario';
  }
});

// ============================================
// Inicialización
// ============================================
console.log('🚀 Sistema de Control de Acceso iniciado');
console.log('📷 Listo para usar');

