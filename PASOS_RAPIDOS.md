# 🚀 SOLUCIÓN RÁPIDA - 3 Pasos

## 📦 **Paso 1: Instalar Esquema de Turnos**

El error "Cargando turnos..." ocurre porque las tablas no existen.

### Ejecutar desde la terminal:

```bash
# Opción 1: MySQL estándar
mysql -u root -p control_acceso < database/turnos_schema.sql

# Opción 2: MAMP
/Applications/MAMP/Library/bin/mysql -u root -p control_acceso < database/turnos_schema.sql

# Opción 3: XAMPP
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p control_acceso < database/turnos_schema.sql
```

### O desde phpMyAdmin:
1. Abre phpMyAdmin
2. Selecciona base de datos `control_acceso`
3. Pestaña "Importar"
4. Selecciona `database/turnos_schema.sql`
5. Click "Continuar"

---

## 🔄 **Paso 2: Reiniciar Servidor**

```bash
# Detener servidor (Ctrl+C)

# Iniciar de nuevo
npm run dev
```

---

## 🌐 **Paso 3: Limpiar Caché del Navegador**

### Chrome/Edge/Firefox:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### Safari:
- `Cmd + Option + E` (limpiar caché)
- `Cmd + R` (recargar)

---

## ✅ **Verificar que Funciona**

### **1. Turnos:**
- Panel Admin → Turnos
- **Debe mostrar:** Una tabla vacía o con turnos
- **NO debe mostrar:** "Cargando turnos..."

### **2. Entrada/Salida:**
- Página principal → Verificar Acceso
- Click en "📤 Registrar Salida"
- Panel Admin → Historial
- **Debe mostrar:** Tipo = "salida"

---

## 🔍 **Verificación Técnica (Opcional)**

```bash
# Verificar que las tablas se crearon
mysql -u root -p control_acceso < database/verificar_instalacion.sql
```

---

## 📞 **¿Problemas?**

Lee el archivo completo: **SOLUCIONAR_PROBLEMAS.md**

