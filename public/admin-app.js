/**
 * Admin App - JavaScript para Panel Administrativo
 * 
 * Maneja la interfaz de gestión de usuarios y auditoría
 */

const API_BASE = 'http://localhost:3000/api';
let usuarioEdicion = null;
let tokenActual = localStorage.getItem('token');

/**
 * Inicializació al cargar la página
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!tokenActual) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar información del usuario
    cargarInfoUsuario();
    
    // Cargar usuarios por defecto
    cargarUsuarios();
    
    // Configurar formulario
    document.getElementById('usuarioForm').addEventListener('submit', guardarUsuario);
});

/**
 * Carga la información del usuario autenticado
 */
async function cargarInfoUsuario() {
    try {
        const response = await fetch(`${API_BASE}/usuarios/perfil`, {
            headers: {
                'Authorization': `Bearer ${tokenActual}`
            }
        });
        
        const data = await response.json();
        if (data.exito && data.usuario) {
            document.getElementById('usuarioNombre').textContent = data.usuario.nombre;
        }
    } catch (error) {
        console.error('Error al cargar info usuario:', error);
    }
}

/**
 * Cambia de tab
 */
function cambiarTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar el tab seleccionado
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Cargar datos si es necesario
    if (tabName === 'auditoria') {
        cargarAuditoria();
    }
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

/**
 * Carga la lista de usuarios
 */
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios`, {
            headers: {
                'Authorization': `Bearer ${tokenActual}`
            }
        });
        
        const data = await response.json();
        
        if (data.exito && data.datos) {
            mostrarUsuarios(data.datos);
        } else {
            mostrarError('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

/**
 * Muestra la tabla de usuarios
 */
function mostrarUsuarios(usuarios) {
    const tabla = document.getElementById('usuariosTable');
    
    if (usuarios.length === 0) {
        tabla.innerHTML = '<div class="no-data">No hay usuarios registrados</div>';
        return;
    }
    
    let html = '<table class="table"><thead><tr>';
    html += '<th>Nombre</th><th>Email</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    
    usuarios.forEach(usuario => {
        const badgeRol = getBadgeRol(usuario.rol);
        const badgeEstado = usuario.estado ? 
            '<span class="badge badge-activo">Activo</span>' :
            '<span class="badge badge-inactivo">Inactivo</span>';
        
        html += `<tr>
            <td>${usuario.nombre} ${usuario.apellido}</td>
            <td>${usuario.email}</td>
            <td>${usuario.username || '-'}</td>
            <td>${badgeRol}</td>
            <td>${badgeEstado}</td>
            <td>
                <div class="actions">
                    <button class="btn-edit" onclick="editarUsuario(${usuario.id})">Editar</button>
                    <button class="btn-delete" onclick="desactivarUsuario(${usuario.id})">Desactivar</button>
                </div>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    tabla.innerHTML = html;
}

/**
 * Obtiene el badge HTML para un rol
 */
function getBadgeRol(rol) {
    const badges = {
        'administrador': '<span class="badge badge-admin">👤 Administrador</span>',
        'cargador': '<span class="badge badge-cargador">📤 Cargador</span>',
        'consultor': '<span class="badge badge-consultor">👁️ Consultor</span>'
    };
    return badges[rol] || rol;
}

/**
 * Abre el modal para crear nuevo usuario
 */
function abrirCrearUsuario() {
    usuarioEdicion = null;
    document.getElementById('modalHeader').textContent = 'Crear nuevo usuario';
    document.getElementById('usuarioForm').reset();
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('usuarioModal').classList.add('active');
}

/**
 * Abre el modal para editar usuario
 */
async function editarUsuario(usuarioId) {
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios/${usuarioId}`, {
            headers: {
                'Authorization': `Bearer ${tokenActual}`
            }
        });
        
        const data = await response.json();
        
        if (data.exito && data.usuario) {
            usuarioEdicion = data.usuario;
            document.getElementById('modalHeader').textContent = 'Editar usuario: ' + data.usuario.nombre;
            document.getElementById('nombre').value = data.usuario.nombre;
            document.getElementById('apellido').value = data.usuario.apellido;
            document.getElementById('email').value = data.usuario.email;
            document.getElementById('username').value = data.usuario.username;
            document.getElementById('rol').value = data.usuario.rol;
            document.getElementById('passwordGroup').style.display = 'none'; // La contraseña no se edita desde aquí
            document.getElementById('usuarioModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar usuario');
    }
}

/**
 * Guarda un usuario (crear o editar)
 */
async function guardarUsuario(event) {
    event.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        rol: document.getElementById('rol').value
    };
    
    // Si es creación, añadir contraseña
    if (!usuarioEdicion) {
        datos.contraseña = document.getElementById('contraseña').value;
    }
    
    try {
        let url, metodo;
        
        if (usuarioEdicion) {
            url = `${API_BASE}/admin/usuarios/${usuarioEdicion.id}`;
            metodo = 'PUT';
        } else {
            url = `${API_BASE}/admin/usuarios`;
            metodo = 'POST';
        }
        
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenActual}`
            },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (data.exito) {
            mostrarExito(usuarioEdicion ? 'Usuario actualizado' : 'Usuario creado');
            cerrarModal();
            cargarUsuarios();
        } else {
            mostrarError(data.error || 'Error al guardar usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

/**
 * Desactiva un usuario
 */
async function desactivarUsuario(usuarioId) {
    if (!confirm('¿Seguro que deseas desactivar este usuario?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios/${usuarioId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenActual}`
            }
        });
        
        const data = await response.json();
        
        if (data.exito) {
            mostrarExito('Usuario desactivado');
            cargarUsuarios();
        } else {
            mostrarError(data.error || 'Error al desactivar usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

/**
 * Cierra el modal
 */
function cerrarModal() {
    document.getElementById('usuarioModal').classList.remove('active');
    usuarioEdicion = null;
}

// ============================================
// GESTIÓN DE AUDITORÍA
// ============================================

/**
 * Carga los registros de auditoría
 */
async function cargarAuditoria() {
    try {
        const usuario = document.getElementById('filtroUsuario').value;
        const accion = document.getElementById('filtroAccion').value;
        const fecha = document.getElementById('filtroFecha').value;
        
        let url = `${API_BASE}/admin/auditoria/registros?limit=50`;
        if (usuario) url += `&usuario_id=${usuario}`;
        if (accion) url += `&accion=${accion}`;
        if (fecha) url += `&fecha_desde=${fecha}T00:00:00&fecha_hasta=${fecha}T23:59:59`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${tokenActual}`
            }
        });
        
        const data = await response.json();
        
        if (data.exito) {
            mostrarAuditoria(data.datos.registros);
            mostrarEstadisticas();
        } else {
            mostrarError('Error al cargar auditoría');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

/**
 * Muestra la tabla de auditoría
 */
function mostrarAuditoria(registros) {
    const tabla = document.getElementById('auditTable');
    
    if (registros.length === 0) {
        tabla.innerHTML = '<div class="no-data">No hay registros de auditoría</div>';
        return;
    }
    
    let html = '<table class="table"><thead><tr>';
    html += '<th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Descripción</th></tr></thead><tbody>';
    
    registros.forEach(registro => {
        const fecha = new Date(registro.fecha_accion).toLocaleString('es-ES');
        
        html += `<tr>
            <td>${fecha}</td>
            <td>${registro.usuario_nombre}</td>
            <td><span class="badge">${registro.accion}</span></td>
            <td>${registro.modulo}</td>
            <td>${registro.descripcion || '-'}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    tabla.innerHTML = html;
}

/**
 * Carga y muestra estadísticas
 */
async function mostrarEstadisticas() {
    try {
        const response = await fetch(`${API_BASE}/admin/auditoria/estadisticas`, {
            headers: {
                'Authorization': `Bearer ${tokenActual}`
            }
        });
        
        const data = await response.json();
        
        if (data.exito && data.datos) {
            const stats = data.datos;
            let html = '';
            
            html += `<div class="stat-card">
                <h3>Total de acciones (30 días)</h3>
                <div class="value">${stats.total_acciones || 0}</div>
            </div>`;
            
            html += `<div class="stat-card">
                <h3>Usuarios activos (30 días)</h3>
                <div class="value">${stats.usuarios_activos || 0}</div>
            </div>`;
            
            html += `<div class="stat-card">
                <h3>Días con actividad</h3>
                <div class="value">${stats.dias_actividad || 0}</div>
            </div>`;
            
            document.getElementById('auditStats').innerHTML = html;
            document.getElementById('auditStats').style.display = 'grid';
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/**
 * Exporta auditoría a CSV
 */
async function exportarAuditoria() {
    try {
        const usuario = document.getElementById('filtroUsuario').value;
        const accion = document.getElementById('filtroAccion').value;
        const fecha = document.getElementById('filtroFecha').value;
        
        let url = `${API_BASE}/admin/auditoria/exportar`;
        if (usuario) url += `?usuario_id=${usuario}`;
        if (accion) url += (usuario ? '&' : '?') + `accion=${accion}`;
        if (fecha) url += (usuario || accion ? '&' : '?') + `fecha_desde=${fecha}T00:00:00&fecha_hasta=${fecha}T23:59:59`;
        
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al exportar');
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Muestra un mensaje de error
 */
function mostrarError(mensaje) {
    console.error(mensaje);
    alert('Error: ' + mensaje);
}

/**
 * Muestra un mensaje de éxito
 */
function mostrarExito(mensaje) {
    alert('✓ ' + mensaje);
}

/**
 * Cierra la sesión
 */
function cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login.html';
    }
}
