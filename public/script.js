// ============================================
// Control de Acceso - Sistema de Reconocimiento Facial
// ============================================

// Referencias a elementos del DOM
const video = document.getElementById('video');
const startCameraButton = document.getElementById('start-camera');
const capturePhotoButton = document.getElementById('capture-photo');
const canvas = document.getElementById('canvas');

// Variables globales
let modelsLoaded = false;
let cameraStream = null;

// ============================================
// Cargar modelos de Face-API.js
// ============================================
const loadModels = async () => {
  try {
    console.log('Cargando modelos de Face-API...');
    
    // Cargar los modelos necesarios para reconocimiento facial
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    
    modelsLoaded = true;
    console.log('✓ Modelos cargados correctamente');
    return true;
  } catch (error) {
    console.error('Error cargando modelos:', error);
    alert('Error al cargar los modelos de reconocimiento facial. Verifica que los archivos de modelos estén en /public/models/');
    return false;
  }
};

// ============================================
// Iniciar la cámara
// ============================================
const startCamera = async () => {
  try {
    // Cargar modelos si no están cargados
    if (!modelsLoaded) {
      const loaded = await loadModels();
      if (!loaded) return;
    }

    // Solicitar acceso a la cámara
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false,
    });
    
    video.srcObject = cameraStream;
    await video.play();
    
    console.log('✓ Cámara activada correctamente');
    startCameraButton.disabled = true;
    capturePhotoButton.disabled = false;
    startCameraButton.textContent = 'Cámara Activa';
    
  } catch (error) {
    console.error('Error al acceder a la cámara:', error);
    alert('No se pudo acceder a la cámara. Asegúrate de:\n1. Otorgar permisos de cámara\n2. Usar HTTPS o localhost\n3. Tener una cámara conectada');
  }
};

// ============================================
// Detección de rostros
// ============================================
const detectFace = async () => {
  try {
    // Detectar rostro con landmarks y descriptor
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection;
  } catch (error) {
    console.error('Error en detección facial:', error);
    return null;
  }
};

// ============================================
// Capturar foto y procesar
// ============================================
const capturePhoto = async () => {
  try {
    // Deshabilitar botón temporalmente
    capturePhotoButton.disabled = true;
    capturePhotoButton.textContent = 'Procesando...';
    
    // Detectar rostro
    console.log('Detectando rostro...');
    const detection = await detectFace();
    
    if (!detection) {
      alert('No se detectó ningún rostro. Por favor:\n- Asegúrate de estar frente a la cámara\n- Mejora la iluminación\n- Intenta de nuevo');
      capturePhotoButton.disabled = false;
      capturePhotoButton.textContent = 'Capturar Foto';
      return;
    }
    
    console.log('✓ Rostro detectado');
    
    // Capturar imagen del video
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Enviar al servidor
    console.log('Enviando datos al servidor...');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image: imageData,
        descriptor: Array.from(detection.descriptor)
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Imagen procesada correctamente');
      alert(`✓ ${result.message}`);
    } else {
      console.error('Error del servidor:', result);
      alert(`Error: ${result.message || 'Error desconocido'}`);
    }
    
  } catch (error) {
    console.error('Error al procesar la foto:', error);
    alert('Error al procesar la foto. Revisa la consola para más detalles.');
  } finally {
    capturePhotoButton.disabled = false;
    capturePhotoButton.textContent = 'Capturar Foto';
  }
};

// ============================================
// Event Listeners
// ============================================
startCameraButton.addEventListener('click', startCamera);
capturePhotoButton.addEventListener('click', capturePhoto);

// ============================================
// Inicialización
// ============================================
console.log('Sistema de Control de Acceso iniciado');
console.log('Haz clic en "Iniciar Cámara" para comenzar');
