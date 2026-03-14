# 🛠️ Scripts de Utilidad

Scripts para gestión y mantenimiento de la base de datos.

---

## 🗑️ Limpiar Base de Datos

Elimina todos los registros de las tablas (usuarios, descriptores, fotos, accesos).

### Método 1: Script Node.js (Recomendado)

```bash
node scripts/limpiar-bd.js
```

**Características:**
- ✅ Confirmación interactiva (debes escribir "CONFIRMAR")
- ✅ Muestra contadores antes y después
- ✅ Colores para mejor visualización
- ✅ Manejo de errores
- ✅ Verifica conexión antes de limpiar

**Salida esperada:**
```
═══════════════════════════════════════
  Script de Limpieza de Base de Datos
═══════════════════════════════════════

🔍 Verificando conexión a la base de datos...
✅ Conexión exitosa

📊 Registros actuales:
   Usuarios: 5
   Descriptores faciales: 5
   Fotos: 10
   Accesos: 25

⚠️  ADVERTENCIA ⚠️
Este script eliminará TODOS los registros de:
  • Usuarios
  • Descriptores faciales
  • Fotos
  • Accesos

Esta acción NO se puede deshacer.

¿Estás seguro de continuar? (escribe 'CONFIRMAR' para continuar):
```

### Método 2: Script SQL Directo

```bash
mysql -u root -p < database/limpiar_datos.sql
```

**O desde MySQL CLI:**
```bash
mysql -u root -p
```

```sql
source database/limpiar_datos.sql;
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### ❌ Lo que hace el script:
- Elimina **TODOS** los usuarios registrados
- Elimina **TODOS** los descriptores faciales
- Elimina **TODAS** las fotos capturadas
- Elimina **TODO** el historial de accesos
- Resetea los contadores AUTO_INCREMENT a 1

### ✅ Lo que NO hace el script:
- **NO elimina** la tabla `configuracion` (mantiene umbral, etc.)
- **NO elimina** las tablas (solo el contenido)
- **NO modifica** la estructura de la base de datos

### 🚨 Esta acción NO se puede deshacer

Una vez ejecutado, **no hay forma de recuperar los datos** a menos que tengas un backup.

---

## 📋 Casos de Uso

### Cuándo usar este script:

✅ **Desarrollo y Pruebas**
- Limpiar datos de prueba
- Resetear el sistema para nuevas pruebas
- Empezar desde cero después de experimentar

✅ **Antes de Producción**
- Eliminar datos de desarrollo antes del lanzamiento

✅ **Mantenimiento**
- Resetear un sistema de demo
- Limpiar después de una capacitación

### Cuándo NO usar este script:

❌ **Nunca en producción** con datos reales
❌ **Sin backup** si tienes datos importantes
❌ **Sin confirmación** del responsable del sistema

---

## 💾 Hacer Backup Antes de Limpiar

**Siempre haz un backup antes de eliminar datos:**

```bash
# Backup completo de la base de datos
mysqldump -u root -p control_acceso > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo de datos (sin estructura)
mysqldump -u root -p --no-create-info control_acceso > backup_datos_$(date +%Y%m%d_%H%M%S).sql
```

**Para restaurar un backup:**

```bash
mysql -u root -p control_acceso < backup_20241104_153000.sql
```

---

## 🔄 Alternativa: Limpiar Solo Algunas Tablas

Si solo quieres limpiar tablas específicas:

### Solo Accesos y Fotos (mantener usuarios):
```sql
USE control_acceso;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE accesos;
TRUNCATE TABLE fotos;
SET FOREIGN_KEY_CHECKS = 1;
```

### Solo Accesos (mantener todo lo demás):
```sql
USE control_acceso;
TRUNCATE TABLE accesos;
```

### Solo Fotos de Verificación (mantener fotos de registro):
```sql
USE control_acceso;
DELETE FROM fotos WHERE tipo_captura = 'verificacion';
```

---

## 🧪 Probar el Script

Puedes probar el script de forma segura:

1. **Haz un backup** primero
2. **Ejecuta el script** de limpieza
3. **Verifica** que funcionó correctamente
4. **Registra nuevos usuarios** de prueba

---

## 📞 Soporte

Si tienes problemas con el script:

1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `.env`
3. Comprueba permisos de usuario MySQL
4. Revisa logs de errores

---

## ⚡ Comandos Rápidos

```bash
# Limpiar BD con confirmación interactiva
node scripts/limpiar-bd.js

# Limpiar BD sin confirmación (uso avanzado - cuidado)
mysql -u root -p < database/limpiar_datos.sql

# Ver conteo de registros
mysql -u root -p -e "USE control_acceso; \
  SELECT 'usuarios' as tabla, COUNT(*) as total FROM usuarios \
  UNION ALL SELECT 'descriptores_faciales', COUNT(*) FROM descriptores_faciales \
  UNION ALL SELECT 'fotos', COUNT(*) FROM fotos \
  UNION ALL SELECT 'accesos', COUNT(*) FROM accesos;"

# Hacer backup rápido
mysqldump -u root -p control_acceso > backup_$(date +%Y%m%d).sql
```

---

_Scripts creados para facilitar el desarrollo y mantenimiento del sistema._

