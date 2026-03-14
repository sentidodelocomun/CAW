# 🕒 Instalación del Sistema de Turnos

## 📋 ¿Qué incluye?

El sistema de turnos añade las siguientes funcionalidades al sistema de control de acceso:

✅ **Gestión de turnos** - Crear, editar y eliminar turnos de trabajo  
✅ **Asignación a usuarios** - Asignar uno o varios turnos a cada usuario  
✅ **Validación automática** - El sistema verifica si el usuario está en su turno al intentar acceder  
✅ **Configuración flexible** - Activar/desactivar validación de turnos  
✅ **Horarios complejos** - Soporta turnos nocturnos (ej: 23:00 - 07:00)  
✅ **Días personalizables** - Configurar qué días de la semana aplica cada turno  

---

## 🚀 Instalación (2 minutos)

### **Paso 1: Ejecutar el script SQL**

```bash
mysql -u root -p control_acceso < database/turnos_schema.sql
```

O desde MySQL CLI:
```bash
mysql -u root -p
```
```sql
USE control_acceso;
source database/turnos_schema.sql;
```

Esto creará:
- ✅ Tabla `turnos`
- ✅ Tabla `usuario_turnos`
- ✅ Actualización de tabla `accesos` (añade columnas de turno)
- ✅ Función `verificar_turno_usuario()`
- ✅ Procedimiento `obtener_turno_actual()`
- ✅ Vistas `turnos_activos` y `usuarios_con_turnos`
- ✅ Configuraciones del sistema

### **Paso 2: Reiniciar el servidor**

```bash
# Detén el servidor (Ctrl+C)
npm start
```

### **Paso 3: Acceder al panel de administración**

1. Abre: `http://localhost:3000/admin.html`
2. Ingresa contraseña: `admin123`
3. Ve a la pestaña **"🕒 Turnos"**

---

## 📖 Cómo Usar

### 1. Crear un Turno

1. En el panel de administración, ve a **"🕒 Turnos"**
2. Haz clic en **"➕ Crear Nuevo Turno"**
3. Completa:
   - **Nombre**: Ej: "Turno Mañana"
   - **Descripción**: (opcional)
   - **Hora Inicio**: Ej: 07:00
   - **Hora Fin**: Ej: 15:00
   - **Días de la Semana**: Marca los días que aplica
   - **Color**: Elige un color para visualización
4. **Guardar**

### 2. Asignar Turno a un Usuario

**Opción A: Desde la API**
```javascript
POST /api/usuarios/1/turnos
{
  "turno_id": 1,
  "fecha_inicio": "2024-01-01",
  "fecha_fin": null  // null = indefinido
}
```

**Opción B: Desde SQL**
```sql
INSERT INTO usuario_turnos (usuario_id, turno_id, fecha_inicio)
VALUES (1, 1, CURDATE());
```

### 3. Activar Validación de Turnos

1. Ve a **"⚙️ Configuración"**
2. Marca **"Activar Validación de Turnos"**
3. (Opcional) Marca **"Permitir Acceso Fuera de Turno"** si quieres registrar pero no denegar
4. **Guardar Configuración**

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Turno Mañana (Lunes a Viernes)

```sql
INSERT INTO turnos (nombre, descripcion, hora_inicio, hora_fin, dias_semana, color)
VALUES ('Turno Mañana', 'Horario de 7:00 a 15:00', '07:00:00', '15:00:00', '[1,2,3,4,5]', '#4CAF50');
```

### Ejemplo 2: Turno Noche (incluye cruce de día)

```sql
INSERT INTO turnos (nombre, descripcion, hora_inicio, hora_fin, dias_semana, color)
VALUES ('Turno Noche', 'Horario de 23:00 a 7:00', '23:00:00', '07:00:00', '[1,2,3,4,5]', '#9C27B0');
```

### Ejemplo 3: Fin de Semana Completo

```sql
INSERT INTO turnos (nombre, descripcion, hora_inicio, hora_fin, dias_semana, color)
VALUES ('Fin de Semana', 'Sábados y Domingos', '00:00:00', '23:59:59', '[6,7]', '#2196F3');
```

### Asignar Turno a Usuario

```sql
-- Asignar turno indefinido
INSERT INTO usuario_turnos (usuario_id, turno_id, fecha_inicio)
VALUES (1, 1, '2024-01-01');

-- Asignar turno temporal
INSERT INTO usuario_turnos (usuario_id, turno_id, fecha_inicio, fecha_fin)
VALUES (2, 2, '2024-01-01', '2024-03-31');
```

---

## ⚙️ Configuración

### Parámetros del Sistema

| Parámetro | Descripción | Valor por Defecto |
|-----------|-------------|-------------------|
| `validar_turnos` | Activar validación de turnos | `true` |
| `permitir_acceso_fuera_turno` | Permitir aunque esté fuera de turno | `false` |

### Comportamiento según Configuración

| validar_turnos | permitir_acceso_fuera_turno | Comportamiento |
|---------------|----------------------------|----------------|
| `false` | - | No valida turnos (sistema clásico) |
| `true` | `false` | **DENIEGA** si está fuera de turno ⛔ |
| `true` | `true` | **PERMITE** pero registra como fuera de turno ⚠️ |

---

## 📊 Consultas Útiles

### Ver Turnos con Usuarios Asignados

```sql
SELECT * FROM turnos_activos;
```

### Ver Usuarios con Sus Turnos

```sql
SELECT * FROM usuarios_con_turnos;
```

### Verificar si Usuario Tiene Turno Ahora

```sql
SELECT verificar_turno_usuario(1, NOW()) AS tiene_turno;
```

### Obtener Turno Actual de un Usuario

```sql
CALL obtener_turno_actual(1, NOW());
```

### Ver Accesos con Información de Turno

```sql
SELECT 
  a.*,
  t.nombre AS turno_nombre,
  CASE 
    WHEN a.turno_valido IS NULL THEN 'No validado'
    WHEN a.turno_valido = TRUE THEN 'En turno'
    ELSE 'Fuera de turno'
  END AS estado_turno
FROM accesos a
LEFT JOIN turnos t ON a.turno_id = t.id
ORDER BY a.fecha_acceso DESC
LIMIT 20;
```

---

## 🔍 Verificar Instalación

Ejecuta estos comandos para verificar que todo se instaló correctamente:

```sql
-- Verificar tablas
SHOW TABLES LIKE '%turno%';
-- Debe mostrar: turnos, usuario_turnos

-- Verificar columnas nuevas en accesos
DESCRIBE accesos;
-- Debe incluir: turno_valido, turno_id

-- Verificar configuración
SELECT * FROM configuracion WHERE clave LIKE '%turno%';
-- Debe mostrar: validar_turnos, permitir_acceso_fuera_turno

-- Verificar función
SELECT verificar_turno_usuario(1, NOW());
-- Debe devolver 0 o 1

-- Verificar vistas
SELECT * FROM turnos_activos LIMIT 1;
```

---

## 🐛 Resolución de Problemas

### "Table 'turnos' already exists"

Ya instalaste el sistema de turnos. Puedes omitir este paso.

### "Unknown column 'turno_valido' in 'field list'"

La tabla `accesos` no se actualizó correctamente. Ejecuta manualmente:

```sql
ALTER TABLE accesos 
ADD COLUMN turno_valido BOOLEAN DEFAULT NULL,
ADD COLUMN turno_id INT DEFAULT NULL,
ADD FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL;
```

### "PROCEDURE obtener_turno_actual does not exist"

Vuelve a ejecutar el script `turnos_schema.sql`

---

## 🎨 Interfaz del Panel

El panel de administración incluye una nueva pestaña **"🕒 Turnos"** con:

- ✅ Listado de turnos con colores
- ✅ Botón para crear nuevo turno
- ✅ Editar/Eliminar turnos existentes
- ✅ Ver usuarios asignados a cada turno
- ✅ Configuración visual de horarios y días

---

## 📡 API REST de Turnos

### Listar Turnos
```
GET /api/turnos
```

### Crear Turno
```
POST /api/turnos
Body: { nombre, descripcion, hora_inicio, hora_fin, dias_semana, color }
```

### Actualizar Turno
```
PUT /api/turnos/:id
Body: { nombre, descripcion, hora_inicio, hora_fin, dias_semana, color, activo }
```

### Eliminar Turno
```
DELETE /api/turnos/:id
```

### Obtener Turnos de un Usuario
```
GET /api/usuarios/:id/turnos
```

### Asignar Turno a Usuario
```
POST /api/usuarios/:id/turnos
Body: { turno_id, fecha_inicio, fecha_fin }
```

### Eliminar Asignación
```
DELETE /api/usuarios/:userId/turnos/:asignacionId
```

---

## 💡 Casos de Uso

### Caso 1: Empresa con 3 Turnos Rotativos

1. Crear 3 turnos (Mañana, Tarde, Noche)
2. Asignar a cada empleado según su horario
3. Activar validación de turnos
4. Los empleados solo podrán acceder en su turno

### Caso 2: Horario Flexible con Registro

1. Crear turnos amplios
2. Activar validación de turnos
3. Activar "Permitir acceso fuera de turno"
4. Se registra si llegan temprano/tarde pero no se deniega

### Caso 3: Turnos Temporales (Proyecto)

1. Crear turno específico del proyecto
2. Asignar con fecha_inicio y fecha_fin
3. Al finalizar, el turno expira automáticamente

---

## 🔄 Migración de Sistema Existente

Si ya tienes usuarios y accesos registrados:

1. ✅ **Ejecuta el script** - No afecta datos existentes
2. ✅ **Configura turnos** - Define los horarios de tu empresa
3. ✅ **Asigna usuarios** - Asigna turnos a usuarios existentes
4. ✅ **Activa validación** - Solo cuando todo esté configurado

Los accesos anteriores quedarán con `turno_valido = NULL` (no validado).

---

## 📞 Soporte

Si tienes problemas con la instalación:

1. Verifica que MySQL esté actualizado (>= 5.7)
2. Revisa los logs del servidor
3. Comprueba la consola del navegador (F12)
4. Consulta `README.md` principal

---

¡El sistema de turnos está listo para usar! 🎉

