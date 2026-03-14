# ⚙️ Configuración Manual Requerida

Este archivo lista los pasos que **DEBES hacer manualmente** antes de ejecutar el proyecto por primera vez.

---

## 📝 PASO 1: Crear archivo .env

El archivo `.env` contiene información sensible y **NO** está incluido en el repositorio por seguridad.

### Cómo crear el archivo .env:

1. **En la raíz del proyecto**, crea un archivo llamado `.env`

2. **Copia este contenido** y pégalo en el archivo:

```env
# Configuración del servidor
PORT=3000

# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql_aqui
DB_NAME=control_acceso
DB_PORT=3306

# Configuración de seguridad
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion

# Configuración de reconocimiento facial
FACE_MATCH_THRESHOLD=0.6
```

3. **⚠️ IMPORTANTE**: Reemplaza estos valores:

   - `DB_PASSWORD=tu_password_mysql_aqui`  
     → Pon tu contraseña real de MySQL

   - `JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion`  
     → Genera una clave secreta (puedes usar: `openssl rand -hex 32`)

### Verificación:

```bash
# Verifica que el archivo .env existe
ls -la .env

# Debería mostrar algo como:
# -rw-r--r--  1 usuario  staff  XXX bytes  .env
```

---

## 🗄️ PASO 2: Configurar Base de Datos MySQL

### 2.1 Asegúrate de que MySQL está corriendo

```bash
# macOS (con Homebrew)
brew services start mysql

# Linux
sudo systemctl start mysql
sudo systemctl status mysql

# Windows
net start MySQL
```

### 2.2 Verifica que puedes conectarte

```bash
mysql -u root -p
# Ingresa tu contraseña cuando te la pida
# Si conecta correctamente, sal con: exit
```

### 2.3 Ejecutar el script de base de datos

```bash
# Desde la raíz del proyecto
mysql -u root -p < database/schema.sql
```

Esto creará:
- ✅ Base de datos `control_acceso`
- ✅ 5 tablas (usuarios, descriptores_faciales, fotos, accesos, configuracion)
- ✅ 2 vistas (ultimos_accesos, estadisticas_usuarios)
- ✅ 1 procedimiento almacenado (limpiar_datos_antiguos)
- ✅ Configuraciones por defecto

### 2.4 Verificar que se creó correctamente

```bash
mysql -u root -p -e "USE control_acceso; SHOW TABLES;"
```

Deberías ver:
```
+---------------------------+
| Tables_in_control_acceso  |
+---------------------------+
| accesos                   |
| configuracion             |
| descriptores_faciales     |
| fotos                     |
| usuarios                  |
+---------------------------+
```

---

## 📦 PASO 3: Instalar Dependencias Node.js

```bash
npm install
```

Esto instalará:
- express
- mysql2
- dotenv
- cors
- body-parser
- nodemon (dev)

---

## ✅ PASO 4: Verificar que Todo Está Listo

### Checklist:

- [ ] ✅ Archivo `.env` creado con tus credenciales
- [ ] ✅ MySQL corriendo
- [ ] ✅ Base de datos `control_acceso` creada
- [ ] ✅ Dependencias npm instaladas
- [ ] ✅ Los modelos de Face-API están en `public/models/`

### Prueba rápida:

```bash
# Iniciar el servidor
npm start
```

Deberías ver:
```
Servidor corriendo en http://localhost:3000
Conexión a la base de datos exitosa: [ ... ]
```

Si ves esos mensajes, **¡todo está listo!** 🎉

---

## 🚀 PASO 5: Primera Ejecución

1. **Abre tu navegador**: http://localhost:3000

2. **Otorga permisos de cámara** cuando te lo pida el navegador

3. **Registra tu primer usuario**:
   - Ve a la pestaña "Registrar Usuario"
   - Completa el formulario
   - Inicia la cámara
   - Captura tu foto
   - Haz clic en "Registrar Usuario"

4. **Verifica que funciona**:
   - Ve a la pestaña "Verificar Acceso"
   - Inicia la cámara
   - Haz clic en "Verificar Acceso"
   - Deberías ser reconocido automáticamente ✅

---

## ❗ Problemas Comunes

### "Error: Cannot find module 'dotenv'"

**Solución**: No instalaste las dependencias
```bash
npm install
```

### "Error conectando a la base de datos"

**Solución 1**: MySQL no está corriendo
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

**Solución 2**: Credenciales incorrectas en `.env`
- Verifica `DB_USER` y `DB_PASSWORD`

**Solución 3**: Base de datos no existe
```bash
mysql -u root -p < database/schema.sql
```

### "No se puede acceder a la cámara"

**Solución**:
- Usa `http://localhost:3000` (NO uses la IP 127.0.0.1)
- Otorga permisos de cámara en el navegador
- Prueba en Chrome o Firefox (mejor compatibilidad)

### "Error al cargar modelos"

**Solución**: Los modelos de Face-API ya están incluidos en `public/models/`
- Verifica que existen: `ls -la public/models/`
- Si faltan, descárgalos de: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

---

## 🔐 Seguridad - IMPORTANTE

### ⚠️ NUNCA subas estos archivos a Git:

- ❌ `.env` - Contiene contraseñas
- ❌ `node_modules/` - Pesado e innecesario
- ❌ Backups SQL con datos reales

### ✅ El `.gitignore` ya está configurado

El archivo `.gitignore` ya excluye automáticamente:
- `.env`
- `node_modules/`
- Archivos de sistema (`.DS_Store`, etc.)
- Logs
- Backups SQL

---

## 📞 Soporte

Si después de seguir estos pasos tienes problemas:

1. Revisa los logs del servidor (en la consola donde ejecutaste `npm start`)
2. Revisa la consola del navegador (F12 → Console)
3. Consulta `README.md` para documentación completa
4. Consulta `INICIO_RAPIDO.md` para guía paso a paso

---

**¡Una vez completados estos pasos, tu sistema estará 100% operativo!** 🚀

