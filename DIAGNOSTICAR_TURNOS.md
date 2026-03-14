# 🔍 Diagnóstico de Problema con Turnos

## 📋 Pasos para Diagnosticar

### **1. Abrir Consola del Navegador**

1. Presiona **F12** (o clic derecho → "Inspeccionar")
2. Ve a la pestaña **"Console"** o **"Consola"**
3. Refresca la página (F5)
4. Ve al Panel de Admin → Pestaña "Turnos"
5. Busca mensajes que empiecen con:
   - 🔄 Cargando turnos desde /api/turnos...
   - 📡 Respuesta recibida: ...
   - 📦 Datos recibidos: ...
   - ❌ Error...

**COPIA TODOS LOS MENSAJES DE ERROR QUE VEAS**

---

### **2. Ver Logs del Servidor**

En la terminal donde corre el servidor, busca:
- Mensajes de error al cargar `/api/turnos`
- Errores de SQL
- Errores de conexión a la base de datos

**COPIA LOS ERRORES**

---

### **3. Verificar Ruta en el Navegador**

1. En la consola del navegador, ve a la pestaña **"Network"** o **"Red"**
2. Refresca la página
3. Ve a Turnos
4. Busca la petición `turnos`
5. Haz clic en ella
6. Ve a la pestaña "Response" o "Respuesta"

**¿Qué ves?**
- ¿Un JSON con `{success: false, message: "..."}`?
- ¿Un error 404?
- ¿Un error 500?
- ¿Nada?

---

### **4. Probar Ruta Manualmente**

Abre una nueva pestaña y ve a:
```
http://localhost:3000/api/turnos
```

**¿Qué aparece?**
- ✅ Un JSON con datos: `{"success":true,"turnos":[]}`
- ❌ Cannot GET /api/turnos
- ❌ Error 500
- ❌ Otro mensaje

---

### **5. Verificar Base de Datos**

Ejecuta en la terminal:

```bash
node -e "const db = require('./src/models/db'); db.query('SELECT * FROM turnos').then(r => console.log(r)).catch(e => console.error(e)); setTimeout(() => process.exit(), 2000);"
```

**¿Qué pasa?**
- ✅ Muestra `[[],[]]` o datos
- ❌ Error de tabla no existe
- ❌ Error de conexión

---

### **6. Verificar Servidor Reiniciado**

En la terminal del servidor, deberías ver:
```
Servidor corriendo en http://localhost:3000
Conexión a la base de datos exitosa: ...
```

Si NO ves esos mensajes:
1. Detén el servidor (Ctrl+C)
2. Ejecuta: `npm run dev`
3. Espera a que aparezcan los mensajes

---

## 📝 Checklist de Verificación

- [ ] Servidor reiniciado después de instalar turnos
- [ ] Navegador refrescado (F5)
- [ ] Consola del navegador abierta (F12)
- [ ] Logs del servidor visibles
- [ ] Base de datos tiene tabla `turnos`
- [ ] Ruta `/api/turnos` responde

---

## 🆘 Envía Esta Información

Después de hacer las comprobaciones, comparte:

1. **Error de la consola del navegador** (F12 → Console)
2. **Error del servidor** (terminal donde corre)
3. **Respuesta de** `http://localhost:3000/api/turnos`
4. **Resultado del comando de verificación de BD**

Con esa información podré identificar exactamente el problema.

