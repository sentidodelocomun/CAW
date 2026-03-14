#!/bin/bash
# Script para instalar el esquema de turnos

echo "======================================"
echo "   INSTALACIÓN ESQUEMA DE TURNOS     "
echo "======================================"
echo ""

# Verificar que existe el archivo
if [ ! -f "database/turnos_schema.sql" ]; then
    echo "❌ ERROR: No se encuentra el archivo database/turnos_schema.sql"
    exit 1
fi

echo "📦 Preparando instalación..."
echo ""
echo "Este script instalará las siguientes tablas:"
echo "  - turnos"
echo "  - usuario_turnos"
echo "  - Modificaciones en tabla accesos"
echo "  - Procedimiento almacenado obtener_turno_actual"
echo ""
echo "Base de datos: control_acceso"
echo ""

# Solicitar contraseña
read -sp "Ingresa la contraseña de MySQL root: " MYSQL_PASSWORD
echo ""
echo ""

# Ejecutar el script
echo "🔄 Ejecutando script SQL..."

# Intentar ejecutar con mysql
if command -v mysql &> /dev/null; then
    mysql -u root -p"$MYSQL_PASSWORD" control_acceso < database/turnos_schema.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ ¡Instalación completada exitosamente!"
        echo ""
        echo "Puedes verificar con:"
        echo "  mysql -u root -p control_acceso -e 'SHOW TABLES;'"
        echo ""
    else
        echo ""
        echo "❌ Error durante la instalación"
        echo ""
        echo "Intenta manualmente:"
        echo "  mysql -u root -p control_acceso < database/turnos_schema.sql"
        exit 1
    fi
else
    echo ""
    echo "❌ No se encuentra el comando 'mysql' en el PATH"
    echo ""
    echo "Ejecuta manualmente:"
    echo "  mysql -u root -p control_acceso < database/turnos_schema.sql"
    echo ""
    echo "O si tienes MAMP/XAMPP, usa la ruta completa:"
    echo "  /Applications/MAMP/Library/bin/mysql -u root -p control_acceso < database/turnos_schema.sql"
    exit 1
fi

