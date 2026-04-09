/**
 * Controlador de Usuarios
 * 
 * Maneja las operaciones CRUD de usuarios
 * Acceso admin requiere validación adicional
 */

const logger = require('../../config/logger');
const ModeloUsuario = require('../modelos/ModeloUsuario');
const registrarAuditoria = require('../utilidades/auditoria');
const bcrypt = require('bcryptjs');

const ROLES_PERMITIDOS = ['administrador', 'cargador', 'consultor'];

class ControladorUsuarios {
  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @async
   */
  static async obtenerTodos(req, res) {
    try {
      const { rol, estado, buscar } = req.query;
      const usuarios = await ModeloUsuario.obtenerTodos();
      
      let usuariosFiltrados = usuarios;
      
      if (rol) {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.rol === rol);
      }
      
      if (estado) {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.estado.toString() === estado);
      }
      
      if (buscar) {
        usuariosFiltrados = usuariosFiltrados.filter(u =>
          u.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
          u.email.toLowerCase().includes(buscar.toLowerCase()) ||
          u.username?.toLowerCase().includes(buscar.toLowerCase())
        );
      }

      res.json({
        exito: true,
        mensaje: 'Usuarios obtenidos correctamente',
        total: usuariosFiltrados.length,
        datos: usuariosFiltrados
      });
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener usuarios'
      });
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * @async
   */
  static async obtenerPerfil(req, res) {
    try {
      const usuario = await ModeloUsuario.obtenerPorId(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({
          exito: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        exito: true,
        mensaje: 'Perfil obtenido correctamente',
        usuario
      });
    } catch (error) {
      logger.error(`Error al obtener perfil: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener perfil'
      });
    }
  }

  /**
   * Obtiene un usuario específico por ID (Solo Admin)
   * @async
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await ModeloUsuario.obtenerPorId(id);

      if (!usuario) {
        return res.status(404).json({
          exito: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        exito: true,
        mensaje: 'Usuario obtenido correctamente',
        usuario
      });
    } catch (error) {
      logger.error(`Error al obtener usuario: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al obtener usuario'
      });
    }
  }

  /**
   * Crea un nuevo usuario (Solo Admin)
   * @async
   */
  static async crear(req, res) {
    try {
      const { nombre, apellido, email, username, contraseña, rol } = req.body;

      // Validaciones
      if (!nombre || !apellido || !email || !username || !contraseña) {
        return res.status(400).json({
          exito: false,
          error: 'Faltan campos requeridos'
        });
      }

      if (!ROLES_PERMITIDOS.includes(rol)) {
        return res.status(400).json({
          exito: false,
          error: `Rol inválido. Roles permitidos: ${ROLES_PERMITIDOS.join(', ')}`
        });
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await ModeloUsuario.obtenerPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({
          exito: false,
          error: 'El email ya está registrado'
        });
      }

      const usuarioExistenteUsername = await ModeloUsuario.obtenerPorUsername(username);
      if (usuarioExistenteUsername) {
        return res.status(400).json({
          exito: false,
          error: 'El username ya está registrado'
        });
      }

      // Hashear contraseña
      const contraseñaHash = await bcrypt.hash(contraseña, 10);

      // Crear usuario
      const usuarioId = await ModeloUsuario.crear({
        nombre,
        apellido,
        email,
        username,
        contraseña: contraseñaHash,
        rol
      });

      // Registrar en auditoría
      await registrarAuditoria(req, {
        accion: 'CREAR',
        modulo: 'USUARIOS',
        tabla_afectada: 'usuarios',
        registro_id: usuarioId,
        descripcion: `Usuario creado: ${username} con rol ${rol}`,
        detalles_nuevos: { nombre, apellido, email, username, rol }
      });

      const usuarioCreado = await ModeloUsuario.obtenerPorId(usuarioId);

      logger.info(`Usuario creado por ${req.usuario.nombre}: ${username}`);

      res.status(201).json({
        exito: true,
        mensaje: 'Usuario creado correctamente',
        usuario: usuarioCreado
      });
    } catch (error) {
      logger.error(`Error al crear usuario: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al crear usuario'
      });
    }
  }

  /**
   * Actualiza un usuario (Solo Admin)
   * @async
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, apellido, email, rol } = req.body;

      // Verificar que el usuario existe
      const usuarioExistente = await ModeloUsuario.obtenerPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          exito: false,
          error: 'Usuario no encontrado'
        });
      }

      // Validar rol
      if (rol && !ROLES_PERMITIDOS.includes(rol)) {
        return res.status(400).json({
          exito: false,
          error: `Rol inválido. Roles permitidos: ${ROLES_PERMITIDOS.join(', ')}`
        });
      }

      // Validar email no duplicado
      if (email && email !== usuarioExistente.email) {
        const emailExistente = await ModeloUsuario.obtenerPorEmail(email);
        if (emailExistente) {
          return res.status(400).json({
            exito: false,
            error: 'El email ya está registrado'
          });
        }
      }

      // Preparar datos a actualizar
      const datosActualizacion = {
        nombre: nombre || usuarioExistente.nombre,
        apellido: apellido || usuarioExistente.apellido,
        email: email || usuarioExistente.email,
        rol: rol || usuarioExistente.rol
      };

      // Actualizar usuario
      await ModeloUsuario.actualizar(id, datosActualizacion);

      // Registrar en auditoría
      await registrarAuditoria(req, {
        accion: 'ACTUALIZAR',
        modulo: 'USUARIOS',
        tabla_afectada: 'usuarios',
        registro_id: id,
        descripcion: `Usuario actualizado: ${usuarioExistente.username}`,
        detalles_anteriores: usuarioExistente,
        detalles_nuevos: datosActualizacion
      });

      const usuarioActualizado = await ModeloUsuario.obtenerPorId(id);

      logger.info(`Usuario actualizado por ${req.usuario.nombre}: ID ${id}`);

      res.json({
        exito: true,
        mensaje: 'Usuario actualizado correctamente',
        usuario: usuarioActualizado
      });
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al actualizar usuario'
      });
    }
  }

  /**
   * Desactiva un usuario (Solo Admin)
   * @async
   */
  static async desactivar(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el usuario existe
      const usuarioExistente = await ModeloUsuario.obtenerPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          exito: false,
          error: 'Usuario no encontrado'
        });
      }

      // No permitir desactivar el último admin
      if (usuarioExistente.rol === 'administrador') {
        const admins = await ModeloUsuario.obtenerTodos();
        const adminsActivos = admins.filter(u => u.rol === 'administrador' && u.estado === true);
        if (adminsActivos.length <= 1) {
          return res.status(400).json({
            exito: false,
            error: 'No se puede desactivar el último administrador del sistema'
          });
        }
      }

      // Desactivar usuario
      await ModeloUsuario.desactivar(id);

      // Registrar en auditoría
      await registrarAuditoria(req, {
        accion: 'DESACTIVAR',
        modulo: 'USUARIOS',
        tabla_afectada: 'usuarios',
        registro_id: id,
        descripcion: `Usuario desactivado: ${usuarioExistente.username}`,
        detalles_anteriores: usuarioExistente
      });

      logger.advertencia(`Usuario desactivado por ${req.usuario.nombre}: ${usuarioExistente.username}`);

      res.json({
        exito: true,
        mensaje: 'Usuario desactivado correctamente'
      });
    } catch (error) {
      logger.error(`Error al desactivar usuario: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al desactivar usuario'
      });
    }
  }

  /**
   * Resetea la contraseña de un usuario (Solo Admin)
   * @async
   */
  static async resetearContraseña(req, res) {
    try {
      const { id } = req.params;
      const { nueva_contraseña } = req.body;

      if (!nueva_contraseña || nueva_contraseña.length < 8) {
        return res.status(400).json({
          exito: false,
          error: 'La contraseña debe tener al menos 8 caracteres'
        });
      }

      const usuarioExistente = await ModeloUsuario.obtenerPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          exito: false,
          error: 'Usuario no encontrado'
        });
      }

      const contraseñaHash = await bcrypt.hash(nueva_contraseña, 10);
      await ModeloUsuario.actualizar(id, { contraseña: contraseñaHash });

      // Registrar en auditoría
      await registrarAuditoria(req, {
        accion: 'RESETEAR_CONTRASEÑA',
        modulo: 'USUARIOS',
        tabla_afectada: 'usuarios',
        registro_id: id,
        descripcion: `Contraseña reseteada para: ${usuarioExistente.username}`
      });

      logger.info(`Contraseña reseteada por ${req.usuario.nombre} para usuario ID ${id}`);

      res.json({
        exito: true,
        mensaje: 'Contraseña reseteada correctamente'
      });
    } catch (error) {
      logger.error(`Error al resetear contraseña: ${error.message}`);
      res.status(500).json({
        exito: false,
        error: 'Error al resetear contraseña'
      });
    }
  }
}

module.exports = ControladorUsuarios;
