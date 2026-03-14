#!/usr/bin/env node

/**
 * Script para Limpiar la Base de Datos
 * 
 * Uso:
 *   node scripts/limpiar-bd.js
 * 
 * ADVERTENCIA: Este script elimina TODOS los registros
 * de usuarios, descriptores, fotos y accesos.
 */

const readline = require('readline');
const db = require('../src/models/db');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para preguntar confirmación
function preguntarConfirmacion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(`\n${colors.red}⚠️  ADVERTENCIA ⚠️${colors.reset}`);
    console.log(`${colors.yellow}Este script eliminará TODOS los registros de:${colors.reset}`);
    console.log(`  • Usuarios`);
    console.log(`  • Descriptores faciales`);
    console.log(`  • Fotos`);
    console.log(`  • Accesos`);
    console.log(`\n${colors.red}Esta acción NO se puede deshacer.${colors.reset}\n`);

    rl.question(`${colors.cyan}¿Estás seguro de continuar? (escribe 'CONFIRMAR' para continuar): ${colors.reset}`, (respuesta) => {
      rl.close();
      resolve(respuesta === 'CONFIRMAR');
    });
  });
}

// Función principal
async function limpiarBaseDatos() {
  try {
    console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}  Script de Limpieza de Base de Datos${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

    // Verificar conexión
    console.log(`${colors.cyan}🔍 Verificando conexión a la base de datos...${colors.reset}`);
    await db.query('SELECT 1');
    console.log(`${colors.green}✅ Conexión exitosa${colors.reset}\n`);

    // Contar registros actuales
    console.log(`${colors.cyan}📊 Registros actuales:${colors.reset}`);
    const [countUsuarios] = await db.query('SELECT COUNT(*) as total FROM usuarios');
    const [countDescriptores] = await db.query('SELECT COUNT(*) as total FROM descriptores_faciales');
    const [countFotos] = await db.query('SELECT COUNT(*) as total FROM fotos');
    const [countAccesos] = await db.query('SELECT COUNT(*) as total FROM accesos');

    console.log(`   Usuarios: ${countUsuarios[0].total}`);
    console.log(`   Descriptores faciales: ${countDescriptores[0].total}`);
    console.log(`   Fotos: ${countFotos[0].total}`);
    console.log(`   Accesos: ${countAccesos[0].total}`);

    // Pedir confirmación
    const confirmado = await preguntarConfirmacion();

    if (!confirmado) {
      console.log(`\n${colors.yellow}❌ Operación cancelada por el usuario${colors.reset}`);
      process.exit(0);
    }

    console.log(`\n${colors.magenta}🗑️  Limpiando base de datos...${colors.reset}\n`);

    // Desactivar verificación de claves foráneas
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Limpiar tablas
    console.log(`${colors.cyan}  ↳ Limpiando tabla 'accesos'...${colors.reset}`);
    await db.query('TRUNCATE TABLE accesos');
    console.log(`${colors.green}    ✓ Completado${colors.reset}`);

    console.log(`${colors.cyan}  ↳ Limpiando tabla 'fotos'...${colors.reset}`);
    await db.query('TRUNCATE TABLE fotos');
    console.log(`${colors.green}    ✓ Completado${colors.reset}`);

    console.log(`${colors.cyan}  ↳ Limpiando tabla 'descriptores_faciales'...${colors.reset}`);
    await db.query('TRUNCATE TABLE descriptores_faciales');
    console.log(`${colors.green}    ✓ Completado${colors.reset}`);

    console.log(`${colors.cyan}  ↳ Limpiando tabla 'usuarios'...${colors.reset}`);
    await db.query('TRUNCATE TABLE usuarios');
    console.log(`${colors.green}    ✓ Completado${colors.reset}`);

    // Reactivar verificación de claves foráneas
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    // Resetear AUTO_INCREMENT
    console.log(`\n${colors.cyan}🔄 Reseteando contadores AUTO_INCREMENT...${colors.reset}`);
    await db.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE descriptores_faciales AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE fotos AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE accesos AUTO_INCREMENT = 1');
    console.log(`${colors.green}✓ Contadores reseteados${colors.reset}`);

    // Verificar que está vacío
    console.log(`\n${colors.cyan}✔️  Verificando limpieza...${colors.reset}`);
    const [verifyUsuarios] = await db.query('SELECT COUNT(*) as total FROM usuarios');
    const [verifyDescriptores] = await db.query('SELECT COUNT(*) as total FROM descriptores_faciales');
    const [verifyFotos] = await db.query('SELECT COUNT(*) as total FROM fotos');
    const [verifyAccesos] = await db.query('SELECT COUNT(*) as total FROM accesos');

    console.log(`   Usuarios: ${verifyUsuarios[0].total}`);
    console.log(`   Descriptores faciales: ${verifyDescriptores[0].total}`);
    console.log(`   Fotos: ${verifyFotos[0].total}`);
    console.log(`   Accesos: ${verifyAccesos[0].total}`);

    console.log(`\n${colors.green}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}  ✅ Base de datos limpiada exitosamente${colors.reset}`);
    console.log(`${colors.green}═══════════════════════════════════════${colors.reset}\n`);

    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error al limpiar la base de datos:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
limpiarBaseDatos();

