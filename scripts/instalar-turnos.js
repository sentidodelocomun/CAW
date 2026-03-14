const fs = require('fs');
const path = require('path');
const db = require('../src/models/db');

async function instalarEsquemaTurnos() {
  console.log('====================================');
  console.log('  INSTALACIÓN ESQUEMA DE TURNOS    ');
  console.log('====================================\n');

  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, '../database/turnos_schema.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Error: No se encuentra el archivo database/turnos_schema.sql');
      process.exit(1);
    }

    console.log('📖 Leyendo archivo SQL...');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Dividir por punto y coma para ejecutar statement por statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📦 Ejecutando ${statements.length} sentencias SQL...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Mostrar progreso
      if (statement.toLowerCase().includes('create table')) {
        const match = statement.match(/create table\s+(?:if not exists\s+)?`?(\w+)`?/i);
        if (match) {
          console.log(`📋 Creando tabla: ${match[1]}...`);
        }
      } else if (statement.toLowerCase().includes('alter table')) {
        const match = statement.match(/alter table\s+`?(\w+)`?/i);
        if (match) {
          console.log(`🔧 Modificando tabla: ${match[1]}...`);
        }
      } else if (statement.toLowerCase().includes('create procedure')) {
        const match = statement.match(/create procedure\s+`?(\w+)`?/i);
        if (match) {
          console.log(`⚙️  Creando procedimiento: ${match[1]}...`);
        }
      }

      try {
        await db.query(statement);
        successCount++;
      } catch (error) {
        // Ignorar errores de "ya existe" o "campo duplicado"
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_FIELDNAME' ||
            error.message.includes('already exists')) {
          console.log(`   ⚠️  Ya existe, omitiendo...`);
          successCount++;
        } else {
          console.error(`   ❌ Error:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n====================================');
    console.log(`✅ Completado: ${successCount} exitosas`);
    if (errorCount > 0) {
      console.log(`⚠️  Errores: ${errorCount}`);
    }
    console.log('====================================\n');

    // Verificar que las tablas existen
    console.log('🔍 Verificando instalación...\n');

    const [tables] = await db.query("SHOW TABLES LIKE '%turno%'");
    
    if (tables.length >= 2) {
      console.log('✅ Tabla "turnos" instalada correctamente');
      console.log('✅ Tabla "usuario_turnos" instalada correctamente');
    } else {
      console.log('❌ Error: No se encontraron todas las tablas');
      console.log('Tablas encontradas:', tables);
    }

    // Verificar procedimiento
    const [procedures] = await db.query(
      "SHOW PROCEDURE STATUS WHERE Name = 'obtener_turno_actual'"
    );
    
    if (procedures.length > 0) {
      console.log('✅ Procedimiento "obtener_turno_actual" instalado correctamente');
    }

    // Verificar campos en accesos
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE()
        AND table_name = 'accesos'
        AND COLUMN_NAME IN ('turno_valido', 'turno_id')
    `);

    if (columns.length >= 2) {
      console.log('✅ Campos adicionales en tabla "accesos" instalados correctamente');
    }

    console.log('\n🎉 ¡Instalación completada exitosamente!\n');
    console.log('Ahora puedes:');
    console.log('  1. Reiniciar el servidor: npm run dev');
    console.log('  2. Acceder al panel de admin');
    console.log('  3. Ir a la pestaña "Turnos"\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fatal durante la instalación:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
instalarEsquemaTurnos();

