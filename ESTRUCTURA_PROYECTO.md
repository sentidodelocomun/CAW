# 📁 Estructura del Proyecto

```
control-acceso-web/
│
├── 📄 package.json              # Dependencias y scripts del proyecto
├── 📄 package-lock.json         # Lock file de dependencias
├── 📄 .gitignore                # Archivos ignorados por Git
├── 📄 .env.example              # Plantilla de variables de entorno
├── 📄 .env                      # ⚠️ Variables de entorno (NO SUBIR A GIT)
│
├── 📄 README.md                 # ✨ Documentación completa del proyecto
├── 📄 INICIO_RAPIDO.md          # 🚀 Guía de inicio rápido
├── 📄 ESTRUCTURA_PROYECTO.md    # 📁 Este archivo
│
├── 📂 database/                 # Scripts de base de datos
│   ├── schema.sql               # Esquema completo de la BD
│   └── README.md                # Documentación de la BD
│
├── 📂 src/                      # Código fuente del backend
│   ├── app.js                   # Servidor Express principal
│   │
│   ├── 📂 models/               # Modelos y configuración de BD
│   │   └── db.js                # Conexión a MySQL con pool
│   │
│   └── 📂 routes/               # Rutas de la API REST
│       └── index.js             # Endpoints: /register, /verify, /usuarios, /accesos
│
├── 📂 public/                   # Archivos públicos (frontend)
│   ├── index.html               # ✨ Interfaz principal (mejorada con tabs)
│   ├── app.js                   # ✨ Lógica del frontend (registro + verificación)
│   ├── script.js                # ⚠️ DEPRECADO - Usar app.js
│   │
│   ├── 📂 models/               # Modelos pre-entrenados de Face-API.js
│   │   ├── ssd_mobilenetv1_model-*            # Detección de rostros
│   │   ├── face_landmark_68_model-*           # Landmarks faciales
│   │   ├── face_recognition_model-*           # Descriptores faciales
│   │   ├── tiny_face_detector_model-*         # Detector ligero
│   │   ├── face_expression_model-*            # Expresiones faciales
│   │   ├── age_gender_model-*                 # Edad y género
│   │   └── mtcnn_model-*                      # Modelo MTCNN
│   │
│   └── 📂 face-api/             # Librería Face-API.js (local)
│       ├── face-api.js
│       ├── face-api.min.js
│       └── face-api.js.map
│
└── 📂 node_modules/             # Dependencias instaladas (NO SUBIR A GIT)
```

---

## 📋 Descripción de Archivos Clave

### Backend (Node.js/Express)

| Archivo | Descripción |
|---------|-------------|
| `src/app.js` | Servidor Express, configuración de middlewares, inicialización |
| `src/models/db.js` | Conexión a MySQL con mysql2/promise, pool de conexiones |
| `src/routes/index.js` | **API REST completa**: registro, verificación, consultas |

### Frontend (HTML/CSS/JS)

| Archivo | Descripción |
|---------|-------------|
| `public/index.html` | Interfaz con tabs (Registro/Verificación), CSS integrado, diseño moderno |
| `public/app.js` | **Lógica principal**: manejo de cámara, Face-API, comunicación con backend |
| `public/script.js` | ⚠️ Archivo antiguo, mantener por compatibilidad pero usar app.js |

### Base de Datos

| Archivo | Descripción |
|---------|-------------|
| `database/schema.sql` | Script SQL completo: 5 tablas, 2 vistas, 1 procedimiento, configuración |
| `database/README.md` | Documentación del esquema, consultas útiles, mantenimiento |

### Configuración

| Archivo | Descripción |
|---------|-------------|
| `.env` | Variables de entorno (credenciales DB, configuración) |
| `.env.example` | Plantilla de .env con valores de ejemplo |
| `.gitignore` | Archivos excluidos de Git (node_modules, .env, logs, etc.) |
| `package.json` | Dependencias, scripts npm, metadata del proyecto |

### Documentación

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Documentación completa: instalación, uso, API, troubleshooting |
| `INICIO_RAPIDO.md` | Guía express para poner el sistema en marcha en 5 minutos |
| `ESTRUCTURA_PROYECTO.md` | Este archivo: estructura y organización del proyecto |

---

## 🔄 Flujo de Ejecución

### 1. Inicio del Servidor

```
npm start
    ↓
src/app.js
    ↓
- Carga variables de entorno (.env)
- Configura middlewares (CORS, body-parser, archivos estáticos)
- Monta rutas /api/* → src/routes/index.js
- Conecta a MySQL (src/models/db.js)
- Inicia servidor en puerto 3000
```

### 2. Carga del Frontend

```
http://localhost:3000
    ↓
public/index.html
    ↓
- Carga estilos CSS (inline)
- Carga Face-API.js (CDN)
- Carga app.js
    ↓
public/app.js
    ↓
- Inicializa event listeners
- Espera interacción del usuario
```

### 3. Registro de Usuario

```
Usuario completa formulario
    ↓
Inicia cámara (getUserMedia)
    ↓
Face-API.js carga modelos desde /models
    ↓
Usuario captura foto
    ↓
Face-API detecta rostro y genera descriptor
    ↓
POST /api/register (app.js → backend)
    ↓
src/routes/index.js valida y guarda en MySQL
    ↓
Respuesta al frontend (success/error)
```

### 4. Verificación de Acceso

```
Usuario inicia cámara
    ↓
Usuario captura foto
    ↓
Face-API detecta rostro y genera descriptor
    ↓
POST /api/verify (app.js → backend)
    ↓
src/routes/index.js compara con BD
    ↓
Calcula distancia euclidiana
    ↓
Compara con umbral
    ↓
Registra acceso (autorizado/denegado)
    ↓
Respuesta al frontend con resultado
```

---

## 📦 Dependencias Principales

### Backend (package.json)

```json
{
  "express": "^4.21.1",        // Framework web
  "mysql2": "^3.11.4",         // Driver MySQL con promesas
  "dotenv": "^16.4.5",         // Variables de entorno
  "cors": "^2.8.5",            // Cross-Origin Resource Sharing
  "body-parser": "^1.20.3"     // Parser de JSON
}
```

### Frontend (CDN)

- **Face-API.js** v0.22.2 - Detección y reconocimiento facial
- TensorFlow.js (incluido en Face-API.js)

---

## 🎯 Archivos a Configurar

Antes de ejecutar el proyecto, configura estos archivos:

1. ✅ **Copiar `.env.example` a `.env`**
   ```bash
   cp .env.example .env
   ```

2. ✅ **Editar `.env` con tus credenciales**
   - Cambiar `DB_PASSWORD`
   - Ajustar otros parámetros si es necesario

3. ✅ **Ejecutar script SQL**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. ✅ **Instalar dependencias**
   ```bash
   npm install
   ```

5. ✅ **Iniciar el servidor**
   ```bash
   npm start
   ```

---

## 🗑️ Archivos Deprecados

- `public/script.js` - Reemplazado por `public/app.js` (conservar por compatibilidad)

---

## 📝 Notas Importantes

- **No subir a Git**: `.env`, `node_modules/`, archivos de backup SQL
- **Modelos ML**: Están incluidos en `public/models/` (100MB+)
- **Puerto predeterminado**: 3000 (configurable en `.env`)
- **Base de datos**: `control_acceso` (se crea automáticamente con schema.sql)

---

_Generado automáticamente - Noviembre 2024_

