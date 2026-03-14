const db = require('../src/models/db');

async function testTurnos() {
  console.log('====================================');
  console.log('   TEST DE TURNOS                  ');
  console.log('====================================\n');

  try {
    // Test 1: Verificar conexión a BD
    console.log('1️⃣  Verificando conexión a base de datos...');
    const [test] = await db.query('SELECT 1 as test');
    console.log('   ✅ Conexión exitosa\n');

    // Test 2: Verificar tabla turnos existe
    console.log('2️⃣  Verificando tabla turnos...');
    try {
      const [turnos] = await db.query('SELECT * FROM turnos');
      console.log(`   ✅ Tabla existe - ${turnos.length} registro(s)\n`);
      
      if (turnos.length > 0) {
        console.log('   Turnos encontrados:');
        turnos.forEach(t => {
          console.log(`   - ${t.nombre} (${t.hora_inicio} - ${t.hora_fin})`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('   ❌ Tabla NO existe o error:', error.message);
      console.log('   Debes ejecutar: node scripts/instalar-turnos.js\n');
      process.exit(1);
    }

    // Test 3: Verificar tabla usuario_turnos
    console.log('3️⃣  Verificando tabla usuario_turnos...');
    try {
      const [userTurnos] = await db.query('SELECT * FROM usuario_turnos');
      console.log(`   ✅ Tabla existe - ${userTurnos.length} asignación(es)\n`);
    } catch (error) {
      console.log('   ❌ Tabla NO existe o error:', error.message);
      console.log('   Debes ejecutar: node scripts/instalar-turnos.js\n');
      process.exit(1);
    }

    // Test 4: Simular query de la API
    console.log('4️⃣  Simulando query de /api/turnos...');
    try {
      const [resultado] = await db.query(`
        SELECT 
          t.*,
          COUNT(DISTINCT ut.usuario_id) as usuarios_asignados
        FROM turnos t
        LEFT JOIN usuario_turnos ut ON t.id = ut.turno_id AND ut.activo = TRUE
        GROUP BY t.id
        ORDER BY t.hora_inicio
      `);
      
      console.log('   ✅ Query ejecutado exitosamente');
      console.log(`   📊 Resultado: ${resultado.length} turno(s)\n`);
      
      if (resultado.length > 0) {
        console.log('   Estructura de datos:');
        console.log('   ', JSON.stringify(resultado[0], null, 2));
      }
    } catch (error) {
      console.log('   ❌ Error en query:', error.message);
      console.log('   SQL Error:', error.sqlMessage);
      process.exit(1);
    }

    console.log('\n====================================');
    console.log('✅ TODOS LOS TESTS PASARON         ');
    console.log('====================================\n');
    console.log('La API debería funcionar correctamente.');
    console.log('Si aún tienes problemas:');
    console.log('  1. Reinicia el servidor (Ctrl+C y npm run dev)');
    console.log('  2. Refresca el navegador (F5)');
    console.log('  3. Abre la consola del navegador (F12)');
    console.log('  4. Ve al panel de admin → Turnos');
    console.log('  5. Revisa los mensajes de la consola\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR FATAL:');
    console.error(error);
    process.exit(1);
  }
}

testTurnos();

