/**
 * Script de Migración: Roles y Autenticación
 * 
 * Actualiza la tabla de usuarios para:
 * 1. Cambiar roles a: administrador, cargador, consultor
 * 2. Agregar campo username para login alternativo
 * 3. Insertar usuarios de prueba
 * 
 * NOTA: Usa PostgreSQL (no MySQL)
 */

const { pool } = require('./config/postgresqlTRD');
const bcrypt = require('bcryptjs');
const logger = require('./config/logger');

async function ejecutarMigracion() {
  try {
    logger.info('===== INICIANDO MIGRACIÓN DE ROLES Y AUTENTICACIÓN (PostgreSQL) =====');

    // 1. Verificar y actualizar tabla usuarios si existe
    logger.info('1. Verificando estructura de tabla usuarios...');
    
    // Obtener información de la tabla
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      logger.info('⚠ La tabla usuarios no existe. Asegúrate de ejecutar el script de initialización primero.');
      logger.info('Ejecuta: node base_datos/inicializar.js');
      process.exit(1);
    }

    logger.info('✓ Tabla usuarios encontrada');

    // 2. Verificar si columna username existe
    logger.info('2. Verificando campo username...');
    
    const usernameCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'username'
      )
    `);

    if (!usernameCheck.rows[0].exists) {
      logger.info('   - Agregando columna username...');
      try {
        await pool.query(`
          ALTER TABLE usuarios
          ADD COLUMN username VARCHAR(50) UNIQUE
        `);
        logger.info('✓ Columna username agregada');
      } catch (error) {
        if (error.message.includes('already exists')) {
          logger.info('✓ Columna username ya existe');
        } else {
          throw error;
        }
      }
    } else {
      logger.info('✓ Columna username ya existe');
    }

    // 3. Limpiar usuarios de prueba antiguos
    logger.info('3. Limpiando datos de prueba antiguos...');
    
    const usuariosPrueba = ['admin@sgdea.local', 'carga@sgdea.local', 'consu@sgdea.local'];
    
    for (const email of usuariosPrueba) {
      await pool.query('DELETE FROM usuarios WHERE email = $1', [email]);
    }
    logger.info('✓ Datos antiguos eliminados');

    // 4. Insertar usuarios de prueba con los nuevos roles
    logger.info('4. Creando usuarios de prueba...');

    const usuariosParaInsertar = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@sgdea.local',
        username: 'admin',
        contraseña: 'admin123',
        rol: 'administrador'
      },
      {
        nombre: 'Gestor',
        apellido: 'Carga',
        email: 'carga@sgdea.local',
        username: 'carga',
        contraseña: 'carga123',
        rol: 'cargador'
      },
      {
        nombre: 'Consultor',
        apellido: 'Lectura',
        email: 'consu@sgdea.local',
        username: 'consu',
        contraseña: 'consu123',
        rol: 'consultor'
      }
    ];

    for (const usuario of usuariosParaInsertar) {
      try {
        const salt = await bcrypt.genSalt(10);
        const contraseñaEncriptada = await bcrypt.hash(usuario.contraseña, salt);

        const query = `
          INSERT INTO usuarios (nombre, apellido, email, username, contraseña, rol, estado, fecha_creacion)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;

        await pool.query(query, [
          usuario.nombre,
          usuario.apellido,
          usuario.email,
          usuario.username,
          contraseñaEncriptada,
          usuario.rol,
          true
        ]);

        logger.info(`✓ Usuario ${usuario.username} (${usuario.rol}) creado`);
      } catch (error) {
        logger.error(`Error al crear usuario ${usuario.username}: ${error.message}`);
      }
    }

    logger.info('===== MIGRACIÓN COMPLETADA EXITOSAMENTE =====');
    logger.info('Usuarios de prueba disponibles:');
    logger.info('  • Admin:     admin / admin123');
    logger.info('  • Cargador:  carga / carga123');
    logger.info('  • Consultor: consu / consu123');

  } catch (error) {
    logger.error(`Error en migración: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar migración
ejecutarMigracion().then(() => {
  console.log('Migración completada');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
