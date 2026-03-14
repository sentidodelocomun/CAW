# 🔐 Panel de Administración

## 📋 Acceso al Panel

El panel de administración está disponible en:

**URL:** `http://localhost:3000/admin.html`

**Contraseña por defecto:** `admin123`

⚠️ **IMPORTANTE:** Cambia la contraseña en producción editando el archivo `public/admin.js`

---

## ✨ Funcionalidades del Panel

### 1. 📊 Dashboard (Estadísticas)

Muestra en tiempo real:
- ✅ Total de usuarios registrados
- ✅ Accesos del día actual
- ✅ Total de accesos autorizados
- ✅ Total de accesos denegados

### 2. 👥 Gestión de Usuarios

**Visualización:**
- Lista completa de usuarios con toda su información
- Número de descriptores faciales por usuario
- Total de accesos realizados
- Fecha del último acceso
- Estado (activo/inactivo)

**Acciones disponibles:**
- ✅ **Desactivar usuario** - Impide que el usuario acceda al sistema sin eliminar sus datos
- ✅ **Activar usuario** - Reactiva un usuario previamente desactivado

### 3. 📈 Historial de Accesos

**Información mostrada:**
- Fecha y hora exacta del intento
- Usuario identificado
- Tipo de acceso (entrada/salida)
- Estado (autorizado/denegado/error)
- Porcentaje de similitud facial
- Motivo de denegación (si aplica)
- Ubicación del punto de acceso

**Filtros:** Últimos 100 registros (configurable)

### 4. ⚙️ Configuración del Sistema

**Parámetros configurables:**

#### Umbral de Similitud Facial
- **Rango:** 0.0 - 1.0
- **Por defecto:** 0.6 (60%)
- **Descripción:** Nivel mínimo de similitud requerido para autorizar acceso

| Valor | Comportamiento |
|-------|----------------|
| 0.4 | Muy permisivo |
| 0.5 | Permisivo |
| 0.6 | Balanceado (recomendado) ⭐ |
| 0.7 | Estricto |
| 0.8 | Muy estricto |

#### Días de Retención de Fotos
- **Rango:** 1 - 365 días
- **Por defecto:** 30 días
- **Descripción:** Tiempo que se conservan las fotos de verificación

#### Días de Retención de Logs
- **Rango:** 1 - 730 días
- **Por defecto:** 90 días
- **Descripción:** Tiempo que se conservan los registros de acceso

#### Descriptores Máximos por Usuario
- **Rango:** 1 - 10
- **Por defecto:** 3
- **Descripción:** Número máximo de descriptores faciales que puede tener un usuario

**Acciones:**
- ✅ **Guardar Configuración** - Aplica los cambios inmediatamente
- ⚠️ **Limpiar Base de Datos** - Elimina TODOS los datos (usuarios, accesos, fotos)

---

## 🔒 Seguridad

### Cambiar la Contraseña de Administrador

**Método 1: Editar el archivo JavaScript (Temporal)**

1. Abre `public/admin.js`
2. Busca la línea:
   ```javascript
   const ADMIN_PASSWORD = 'admin123';
   ```
3. Cambia `'admin123'` por tu contraseña
4. Guarda el archivo

**Método 2: Implementar autenticación en el backend (Recomendado para producción)**

Para producción, deberías:
1. Crear una tabla `administradores` en la base de datos
2. Hashear las contraseñas con bcrypt
3. Implementar JWT para sesiones
4. Mover la validación al backend

### Proteger el Acceso

**Opción 1: Restricción por IP (nginx/Apache)**
```nginx
location /admin.html {
    allow 192.168.1.100;  # IP permitida
    deny all;
}
```

**Opción 2: Autenticación HTTP Basic**
```nginx
location /admin.html {
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

---

## 📡 API Endpoints del Panel

El panel usa estos endpoints del backend:

### `GET /api/usuarios`
Obtiene lista de todos los usuarios con estadísticas

### `GET /api/accesos?limit=100`
Obtiene historial de accesos (últimos 100)

### `GET /api/configuracion`
Obtiene todos los parámetros de configuración

### `POST /api/configuracion`
Actualiza la configuración del sistema

**Body:**
```json
{
  "umbral_similitud": 0.6,
  "dias_retencion_fotos": 30,
  "dias_retencion_logs": 90,
  "max_descriptores_por_usuario": 3
}
```

### `POST /api/usuarios/:id/desactivar`
Desactiva un usuario específico

### `POST /api/usuarios/:id/activar`
Activa un usuario previamente desactivado

### `POST /api/limpiar-bd`
Limpia toda la base de datos (usuarios, descriptores, fotos, accesos)

⚠️ **Requiere confirmación**: Debes escribir "CONFIRMAR"

---

## 🎨 Características de la Interfaz

### Diseño Responsive
- ✅ Funciona en desktop, tablet y móvil
- ✅ Tablas scrollables en pantallas pequeñas

### Badges de Estado
- 🟢 **Verde (Success)**: Autorizado / Activo
- 🔴 **Rojo (Danger)**: Denegado / Inactivo
- 🟡 **Amarillo (Warning)**: Error

### Feedback Visual
- ✅ Alertas de éxito (verde)
- ❌ Alertas de error (rojo)
- ⏳ Indicadores de carga
- 📊 Tablas con hover effects

---

## 💡 Casos de Uso

### Caso 1: Consultar Accesos de Hoy
1. Accede al panel de administración
2. Ve al tab "Historial de Accesos"
3. Los registros están ordenados por fecha descendente
4. Busca visualmente los de hoy

### Caso 2: Desactivar un Usuario Temporalmente
1. Ve al tab "Usuarios"
2. Busca el usuario en la tabla
3. Haz clic en "Desactivar"
4. Confirma la acción
5. El usuario ya no podrá acceder al sistema

### Caso 3: Ajustar el Umbral de Reconocimiento
1. Ve al tab "Configuración"
2. Modifica el valor de "Umbral de Similitud Facial"
3. Haz clic en "Guardar Configuración"
4. El nuevo umbral se aplica inmediatamente

### Caso 4: Limpiar Datos de Prueba
1. Ve al tab "Configuración"
2. Scroll hasta el final
3. Haz clic en "Limpiar Base de Datos"
4. Escribe "CONFIRMAR"
5. Todos los datos se eliminarán

---

## ⚠️ Advertencias Importantes

### 🚨 Limpiar Base de Datos
- Esta acción **NO se puede deshacer**
- Elimina **PERMANENTEMENTE** todos los datos
- Haz un **backup** antes de ejecutarla
- Solo usar en desarrollo/pruebas

### 🔐 Seguridad en Producción
- **Cambia la contraseña** por defecto
- **Usa HTTPS** obligatoriamente
- **Restringe acceso** por IP o autenticación adicional
- **Implementa JWT** para sesiones
- **Hashea contraseñas** en el backend
- **Habilita logs** de acciones administrativas

---

## 🐛 Resolución de Problemas

### "No se cargan los datos"
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador (F12)
- Comprueba que la base de datos tenga datos

### "Contraseña incorrecta" (aunque es correcta)
- Limpia la caché del navegador
- Verifica que `admin.js` tenga la contraseña correcta
- Recarga la página (Ctrl+F5)

### "Error al guardar configuración"
- Verifica que los valores estén en los rangos permitidos
- Comprueba la conexión a la base de datos
- Revisa logs del servidor

---

## 📚 Próximas Mejoras

En futuras versiones se planea agregar:
- [ ] Sistema de roles (admin, supervisor, operador)
- [ ] Autenticación JWT
- [ ] Logs de acciones administrativas
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Gráficas de estadísticas
- [ ] Filtros avanzados en tablas
- [ ] Búsqueda en tiempo real
- [ ] Notificaciones push
- [ ] API para integración con otros sistemas

---

## 📞 Soporte

Si tienes problemas con el panel de administración:
1. Revisa esta documentación
2. Consulta los logs del servidor
3. Verifica la consola del navegador (F12)
4. Revisa el `README.md` principal

---

_Panel de Administración - Control de Acceso v1.0_

