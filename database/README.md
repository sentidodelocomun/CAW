# Base de Datos - Control de Acceso

## 📦 Instalación

### Opción 1: Desde MySQL CLI

```bash
mysql -u root -p < database/schema.sql
```

### Opción 2: Desde MySQL Workbench

1. Abre MySQL Workbench
2. Conecta a tu servidor MySQL
3. Abre el archivo `schema.sql`
4. Ejecuta el script completo

### Opción 3: Desde la línea de comandos con un solo paso

```bash
mysql -u root -p -e "source $(pwd)/database/schema.sql"
```

## 📊 Estructura de la Base de Datos

### Tablas Principales

#### `usuarios`
Almacena la información básica de las personas registradas en el sistema.

**Campos principales:**
- `id`: Identificador único
- `nombre`, `apellidos`: Datos personales
- `email`: Correo electrónico (único)
- `identificacion`: DNI/NIE/Pasaporte (único)
- `departamento`, `cargo`: Información laboral
- `activo`: Estado del usuario

#### `descriptores_faciales`
Guarda los descriptores faciales (embeddings de 128 dimensiones) generados por face-api.js.

**Campos principales:**
- `id`: Identificador único
- `usuario_id`: Referencia al usuario
- `descriptor`: JSON con el array de 128 valores
- `activo`: Si el descriptor está activo

**Nota:** Un usuario puede tener múltiples descriptores para mejorar la precisión del reconocimiento.

#### `fotos`
Almacena las imágenes capturadas (opcional para histórico).

**Campos principales:**
- `id`: Identificador único
- `usuario_id`: Usuario asociado (puede ser NULL)
- `imagen`: Blob con la imagen
- `tipo_captura`: 'registro', 'verificacion', 'desconocido'

#### `accesos`
Registra todos los intentos de acceso al sistema.

**Campos principales:**
- `id`: Identificador único
- `usuario_id`: Usuario que intentó acceder
- `tipo_acceso`: 'entrada' o 'salida'
- `estado`: 'autorizado', 'denegado', 'error'
- `similitud_facial`: Puntuación de similitud (0.0 - 1.0)
- `motivo_denegacion`: Razón si fue denegado
- `fecha_acceso`: Timestamp del intento

#### `configuracion`
Parámetros configurables del sistema.

**Configuraciones por defecto:**
- `umbral_similitud`: 0.6 (umbral para autorizar acceso)
- `max_descriptores_por_usuario`: 3
- `dias_retencion_fotos`: 30
- `dias_retencion_logs`: 90

### Vistas

#### `ultimos_accesos`
Muestra los últimos 100 accesos con información del usuario.

#### `estadisticas_usuarios`
Resumen de accesos y descriptores por usuario.

### Procedimientos Almacenados

#### `limpiar_datos_antiguos()`
Limpia automáticamente fotos y logs antiguos según la configuración.

```sql
CALL limpiar_datos_antiguos();
```

## 🔧 Mantenimiento

### Ver últimos accesos
```sql
SELECT * FROM ultimos_accesos LIMIT 20;
```

### Ver estadísticas de un usuario
```sql
SELECT * FROM estadisticas_usuarios WHERE email = 'usuario@empresa.com';
```

### Actualizar umbral de similitud
```sql
UPDATE configuracion SET valor = '0.65' WHERE clave = 'umbral_similitud';
```

### Desactivar un usuario
```sql
UPDATE usuarios SET activo = FALSE WHERE email = 'usuario@empresa.com';
```

## ⚠️ Importante

- **Respaldo regular**: Haz backups periódicos de la base de datos
- **Privacidad**: Las imágenes y descriptores faciales son datos biométricos sensibles
- **RGPD/GDPR**: Asegúrate de cumplir con las normativas de protección de datos
- **Limpieza**: Ejecuta `limpiar_datos_antiguos()` periódicamente o automatízalo con un cron job

