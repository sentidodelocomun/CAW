# 🚀 Inicio Rápido - Control de Acceso

Guía rápida para poner en marcha el sistema en 5 minutos.

## ⚡ Pasos Rápidos

### 1️⃣ Instalar Dependencias (30 segundos)

```bash
npm install
```

### 2️⃣ Configurar Base de Datos (1 minuto)

```bash
# Crear la base de datos
mysql -u root -p < database/schema.sql
```

Cuando te pida la contraseña, introduce tu contraseña de MySQL.

### 3️⃣ Crear Archivo .env (30 segundos)

Crea un archivo `.env` en la raíz del proyecto con este contenido:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=control_acceso
DB_PORT=3306
FACE_MATCH_THRESHOLD=0.6
```

**⚠️ IMPORTANTE**: Cambia `tu_password_mysql` por tu contraseña real de MySQL.

### 4️⃣ Iniciar el Servidor (10 segundos)

```bash
npm start
```

Verás este mensaje:
```
Servidor corriendo en http://localhost:3000
Conexión a la base de datos exitosa
```

### 5️⃣ Abrir el Navegador

Abre: **http://localhost:3000**

---

## 📝 Primer Uso

### Registrar tu Primer Usuario

1. Ve a la pestaña **"Registrar Usuario"**
2. Completa el formulario:
   - Nombre: Tu nombre
   - Apellidos: Tus apellidos
   - Email: tu@email.com
   - DNI/NIE: Tu identificación
3. Haz clic en **"Iniciar Cámara"**
4. Otorga permisos de cámara si te lo pide
5. Mira a la cámara
6. Haz clic en **"Registrar Usuario"**
7. Espera el mensaje de confirmación ✅

### Verificar tu Acceso

1. Ve a la pestaña **"Verificar Acceso"**
2. Haz clic en **"Iniciar Cámara"**
3. Mira a la cámara
4. Haz clic en **"Verificar Acceso"**
5. El sistema te identificará automáticamente ✅

---

## ❓ Problemas Comunes

### "Error conectando a la base de datos"

**Solución**: Verifica que MySQL esté corriendo:

```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL
```

### "No se puede acceder a la cámara"

**Solución**:
- Usa `http://localhost:3000` (no una IP)
- Otorga permisos de cámara al navegador
- Prueba en Chrome o Firefox

### "No se detecta rostro"

**Solución**:
- Asegúrate de tener buena iluminación
- Mira directamente a la cámara
- Acércate o aléjate de la cámara

---

## 📖 Más Información

Para documentación completa, consulta el [README.md](README.md)

---

¡Listo! Ya tienes un sistema de control de acceso con reconocimiento facial funcionando 🎉

