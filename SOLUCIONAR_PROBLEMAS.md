# 🔧 Solución a los Problemas Detectados

## ❌ Problema 1: "Cargando turnos..." indefinidamente

### **Causa:**
Las tablas de turnos (`turnos`, `usuario_turnos`) no están creadas en la base de datos.

### **Solución:**

#### Opción A: Script automatizado
```bash
./INSTALAR_TURNOS.sh
```

#### Opción B: Instalación manual

**1. Si tienes MySQL en el PATH:**
```bash
mysql -u root -p control_acceso < database/turnos_schema.sql
```

**2. Si usas MAMP:**
```bash
/Applications/MAMP/Library/bin/mysql -u root -p control_acceso < database/turnos_schema.sql
```

**3. Si usas XAMPP:**
```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p control_acceso < database/turnos_schema.sql
```

**4. O desde phpMyAdmin:**
- Accede a phpMyAdmin
- Selecciona la base de datos `control_acceso`
- Ve a la pestaña "Importar"
- Selecciona el archivo `database/turnos_schema.sql`
- Haz clic en "Continuar"

### **Verificar que se instaló correctamente:**
```bash
mysql -u root -p control_acceso -e "SHOW TABLES LIKE '%turno%';"
```

Deberías ver:
```
+--------------------------------+
| Tables_in_control_acceso       |
+--------------------------------+
| turnos                         |
| usuario_turnos                 |
+--------------------------------+
```

---

## ❌ Problema 2: Tipo de acceso siempre muestra "entrada"

### **Causa:**
Posible caché del navegador o el servidor no se reinició después de los cambios.

### **Solución:**

#### **1. Reinicia el servidor:**
```bash
# Detener el servidor actual (Ctrl+C)

# Iniciar nuevamente
npm run dev
```

#### **2. Limpia la caché del navegador:**

**Chrome/Edge:**
- Ctrl + Shift + R (Windows/Linux)
- Cmd + Shift + R (Mac)

**Firefox:**
- Ctrl + F5 (Windows/Linux)
- Cmd + Shift + R (Mac)

**Safari:**
- Cmd + Option + E (limpiar caché)
- Cmd + R (recargar)

#### **3. Prueba el registro:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Red" o "Network"
3. Haz clic en "📤 Registrar Salida"
4. Busca la petición a `/api/verify`
5. En "Carga útil" o "Payload" deberías ver:
   ```json
   {
     "descriptor": [...],
     "image": "data:image/...",
     "tipo_acceso": "salida"
   }
   ```

#### **4. Verifica los logs del servidor:**
En la consola donde corre el servidor, deberías ver:
```
🔍 Solicitud de verificación recibida
📋 Tipo de acceso recibido: salida
✅ Rostro detectado
...
📝 Registrando tipo de acceso: salida
✅ ACCESO AUTORIZADO
```

Si ves `tipo_acceso: entrada` cuando pulsaste "Salida", entonces hay un problema con el código del frontend.

---

## 🧪 Prueba Completa

### **Paso 1: Instalar esquema de turnos**
```bash
mysql -u root -p control_acceso < database/turnos_schema.sql
```

### **Paso 2: Reiniciar el servidor**
```bash
# Ctrl+C para detener
npm run dev
```

### **Paso 3: Refrescar navegador**
- F5 o Ctrl+Shift+R

### **Paso 4: Probar turnos**
1. Ve al panel de administración
2. Pestaña "Turnos"
3. Haz clic en "Crear Nuevo Turno"
4. Completa el formulario:
   - Nombre: "Mañana"
   - Descripción: "Turno de mañana"
   - Hora inicio: 07:00
   - Hora fin: 15:00
   - Días: Lunes a Viernes
   - Color: #4CAF50
5. Guardar
6. **Resultado esperado:** Se muestra el turno en la tabla

### **Paso 5: Probar Entrada/Salida**
1. Ve a la página principal
2. Pestaña "Verificar Acceso"
3. Inicia la cámara
4. Haz clic en "📥 Registrar Entrada"
5. Ve al panel de admin → Historial de Accesos
6. **Resultado esperado:** Última línea muestra tipo "entrada"
7. Regresa a verificar acceso
8. Haz clic en "📤 Registrar Salida"
9. Refresca el historial
10. **Resultado esperado:** Última línea muestra tipo "salida"

---

## 📊 Verificación en Base de Datos

```sql
-- Ver últimos 5 accesos con su tipo
SELECT 
    a.id,
    CONCAT(u.nombre, ' ', u.apellidos) as usuario,
    a.tipo_acceso,
    a.estado,
    a.fecha_acceso
FROM accesos a
LEFT JOIN usuarios u ON a.usuario_id = u.id
ORDER BY a.fecha_acceso DESC
LIMIT 5;
```

---

## ❓ Si los problemas persisten

### **Para problema de turnos:**
1. Verifica que el archivo `database/turnos_schema.sql` existe
2. Verifica los permisos del usuario MySQL
3. Revisa la consola del navegador (F12) en busca de errores
4. Revisa la terminal del servidor en busca de errores SQL

### **Para problema de tipo de acceso:**
1. Abre las herramientas de desarrollador (F12)
2. Pestaña "Console"
3. Busca errores en rojo
4. Toma captura y compártela

### **Logs útiles:**
```bash
# Ver logs del servidor
npm run dev

# Deberías ver al hacer clic en "Salida":
📋 Tipo de acceso recibido: salida
📝 Registrando tipo de acceso: salida
```

---

## ✅ Confirmación de Éxito

### **Turnos funcionando:**
- ✅ La página de turnos muestra una tabla (no "Cargando turnos...")
- ✅ Puedes crear nuevos turnos
- ✅ Los turnos aparecen en la lista

### **Entrada/Salida funcionando:**
- ✅ Al hacer clic en "📥 Registrar Entrada", el historial muestra "entrada"
- ✅ Al hacer clic en "📤 Registrar Salida", el historial muestra "salida"
- ✅ Los logs del servidor muestran el tipo correcto

---

**Fecha:** 05/11/2025
**Archivo generado automáticamente por el asistente**

