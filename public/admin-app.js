/**
 * Admin App - JavaScript para Panel Administrativo
 * 
 * Maneja la interfaz de gestión de usuarios y auditoría
 */

const API_BASE = 'http://localhost:3000/api';
let usuarioEdicion = null;
let tokenActual = localStorage.getItem('token');

/**
 * Inicialización al cargar la página
 */
document.addEventListener('DOMContentLoaded', function() {
    if (!tokenActual) {
        window.location.href = '/login.html';
        return;
    }

    cargarInfoUsuario();
    cargarUsuarios();
    document.getElementById('usuarioForm').addEventListener('submit', guardarUsuario);
});

/**
 * Carga la información del usuario autenticado
 */
async function cargarInfoUsuario() {
    try {
        const response = await fetch(`${API_BASE}/usuarios/perfil`, {
            headers: { 'Authorization': `Bearer ${tokenActual}` }
        });
        
        const data = await response.json();
        if (data.exito && data.usuario) {
            document.getElementById('usuarioNombre').textContent = data.usuario.nombre;
            document.getElementById('userAvatar').textContent = data.usuario.nombre.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('Error al cargar info usuario:', error);
    }
}

/**
 * Cambia entre tabs
 */
function cambiarTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    if (btn) btn.classList.add('active');
    
    if (tabName === 'auditoria') {
        cargarAuditoria();
    }
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${tokenActual}` }
        });
        
        const data = await response.json();
        
        if (data.exito && data.datos) {
            mostrarUserStats(data.datos);
            mostrarUsuarios(data.datos);
        } else {
            mostrarError('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

function mostrarUserStats(usuarios) {
    const total = usuarios.length;
    const admins = usuarios.filter(u => u.rol === 'administrador').length;
    const cargadores = usuarios.filter(u => u.rol === 'cargador').length;
    const consultores = usuarios.filter(u => u.rol === 'consultor').length;

    document.getElementById('userStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue">👥</div>
            <div class="stat-info">
                <h3>Total usuarios</h3>
                <div class="value">${total}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple">🔑</div>
            <div class="stat-info">
                <h3>Administradores</h3>
                <div class="value">${admins}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">📤</div>
            <div class="stat-info">
                <h3>Cargadores</h3>
                <div class="value">${cargadores}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange">👁️</div>
            <div class="stat-info">
                <h3>Consultores</h3>
                <div class="value">${consultores}</div>
            </div>
        </div>
    `;
}

function mostrarUsuarios(usuarios) {
    const tabla = document.getElementById('usuariosTable');
    
    if (usuarios.length === 0) {
        tabla.innerHTML = '<div class="empty-state"><div class="icon">👥</div><p>No hay usuarios registrados</p></div>';
        return;
    }
    
    let html = '<table class="table"><thead><tr>';
    html += '<th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Registrado</th><th style="text-align:right">Acciones</th></tr></thead><tbody>';
    
    usuarios.forEach(usuario => {
        const badgeRol = getBadgeRol(usuario.rol);
        const badgeEstado = usuario.estado ? 
            '<span class="badge badge-activo">● Activo</span>' :
            '<span class="badge badge-inactivo">● Inactivo</span>';
        const fecha = usuario.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleDateString('es-ES') : '-';
        const inicial = (usuario.nombre || '?').charAt(0).toUpperCase();
        
        html += `<tr>
            <td>
                <div style="display:flex;align-items:center;gap:0.65rem">
                    <div style="width:34px;height:34px;border-radius:50%;background:#e8f0fe;color:#0f3460;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0">${inicial}</div>
                    <div>
                        <div style="font-weight:600">${usuario.nombre} ${usuario.apellido}</div>
                        <div style="font-size:0.78rem;color:#999">@${usuario.username || '-'}</div>
                    </div>
                </div>
            </td>
            <td style="color:#666">${usuario.email}</td>
            <td>${badgeRol}</td>
            <td>${badgeEstado}</td>
            <td style="color:#999;font-size:0.85rem">${fecha}</td>
            <td>
                <div class="actions" style="justify-content:flex-end">
                    <button class="btn-icon edit" onclick="editarUsuario(${usuario.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="desactivarUsuario(${usuario.id})" title="Desactivar">🗑️</button>
                </div>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    tabla.innerHTML = html;
}

function getBadgeRol(rol) {
    const badges = {
        'administrador': '<span class="badge badge-admin">🔑 Administrador</span>',
        'cargador': '<span class="badge badge-cargador">📤 Cargador</span>',
        'consultor': '<span class="badge badge-consultor">👁️ Consultor</span>'
    };
    return badges[rol] || `<span class="badge">${rol}</span>`;
}

function abrirCrearUsuario() {
    usuarioEdicion = null;
    document.getElementById('modalHeader').textContent = 'Crear nuevo usuario';
    document.getElementById('btnGuardar').textContent = 'Crear usuario';
    document.getElementById('usuarioForm').reset();
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('usuarioModal').classList.add('active');
}

async function editarUsuario(usuarioId) {
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios/${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${tokenActual}` }
        });
        
        const data = await response.json();
        
        if (data.exito && data.usuario) {
            usuarioEdicion = data.usuario;
            document.getElementById('modalHeader').textContent = 'Editar usuario';
            document.getElementById('btnGuardar').textContent = 'Guardar cambios';
            document.getElementById('nombre').value = data.usuario.nombre;
            document.getElementById('apellido').value = data.usuario.apellido;
            document.getElementById('email').value = data.usuario.email;
            document.getElementById('username').value = data.usuario.username;
            document.getElementById('rol').value = data.usuario.rol;
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('usuarioModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar usuario');
    }
}

async function guardarUsuario(event) {
    event.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        rol: document.getElementById('rol').value
    };
    
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
            mostrarExito(usuarioEdicion ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
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

async function desactivarUsuario(usuarioId) {
    if (!confirm('¿Seguro que deseas desactivar este usuario?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios/${usuarioId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenActual}` }
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

function cerrarModal() {
    document.getElementById('usuarioModal').classList.remove('active');
    usuarioEdicion = null;
}

// ============================================
// GESTIÓN DE AUDITORÍA
// ============================================

async function cargarAuditoria() {
    const tabla = document.getElementById('auditTable');
    tabla.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando registros...</div>';

    try {
        const usuario = document.getElementById('filtroUsuario').value;
        const accion = document.getElementById('filtroAccion').value;
        const modulo = document.getElementById('filtroModulo').value;
        const fecha = document.getElementById('filtroFecha').value;
        
        let url = `${API_BASE}/admin/auditoria/registros?limit=50`;
        if (usuario) url += `&usuario_id=${usuario}`;
        if (accion) url += `&accion=${accion}`;
        if (modulo) url += `&modulo=${modulo}`;
        if (fecha) url += `&fecha_desde=${fecha}T00:00:00&fecha_hasta=${fecha}T23:59:59`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${tokenActual}` }
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

function mostrarAuditoria(registros) {
    const tabla = document.getElementById('auditTable');
    
    if (!registros || registros.length === 0) {
        tabla.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No se encontraron registros de auditoría</p></div>';
        return;
    }
    
    let html = '<table class="table"><thead><tr>';
    html += '<th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Descripción</th></tr></thead><tbody>';
    
    registros.forEach(registro => {
        const fechaObj = new Date(registro.fecha_accion);
        const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const horaStr = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        const accionLower = (registro.accion || '').toLowerCase();
        const moduloBadge = getModuloBadge(registro.modulo);
        const inicial = (registro.usuario_nombre || '?').charAt(0).toUpperCase();
        
        html += `<tr>
            <td>
                <div class="audit-date">
                    ${fechaStr}<br><span class="time">${horaStr}</span>
                </div>
            </td>
            <td>
                <div class="audit-user">
                    <div class="audit-user-avatar">${inicial}</div>
                    <span style="font-weight:500">${registro.usuario_nombre || 'Sistema'}</span>
                </div>
            </td>
            <td><span class="badge badge-${accionLower}">${getAccionLabel(registro.accion)}</span></td>
            <td>${moduloBadge}</td>
            <td><div class="audit-desc" title="${registro.descripcion || ''}">${registro.descripcion || '-'}</div></td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    tabla.innerHTML = html;
}

function getAccionLabel(accion) {
    const labels = {
        'CREAR': '+ Crear',
        'ACTUALIZAR': '✎ Actualizar',
        'ELIMINAR': '✕ Eliminar',
        'DESCARGAR': '↓ Descargar',
        'DESACTIVAR': '⊘ Desactivar',
        'INICIAR_SESION': '→ Inicio sesión',
        'RESETEAR_CONTRASEÑA': '🔑 Reset contraseña'
    };
    return labels[accion] || accion;
}

function getModuloBadge(modulo) {
    if (!modulo) return '-';
    const m = modulo.toLowerCase();
    if (m === 'trd') return '<span class="badge badge-mod-trd">📁 TRD</span>';
    if (m === 'usuarios') return '<span class="badge badge-mod-usuarios">👤 Usuarios</span>';
    if (m === 'autenticacion') return '<span class="badge badge-mod-autenticacion">🔐 Auth</span>';
    return `<span class="badge">${modulo}</span>`;
}

async function mostrarEstadisticas() {
    try {
        const response = await fetch(`${API_BASE}/admin/auditoria/estadisticas`, {
            headers: { 'Authorization': `Bearer ${tokenActual}` }
        });
        
        const data = await response.json();
        
        if (data.exito && data.datos) {
            const stats = data.datos;
            document.getElementById('auditStats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon blue">📊</div>
                    <div class="stat-info">
                        <h3>Acciones (30 días)</h3>
                        <div class="value">${stats.total_acciones || 0}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">👥</div>
                    <div class="stat-info">
                        <h3>Usuarios activos</h3>
                        <div class="value">${stats.usuarios_activos || 0}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📅</div>
                    <div class="stat-info">
                        <h3>Días con actividad</h3>
                        <div class="value">${stats.dias_actividad || 0}</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

function limpiarFiltros() {
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroAccion').value = '';
    document.getElementById('filtroModulo').value = '';
    document.getElementById('filtroFecha').value = '';
    cargarAuditoria();
}

async function exportarAuditoria() {
    try {
        const usuario = document.getElementById('filtroUsuario').value;
        const accion = document.getElementById('filtroAccion').value;
        const fecha = document.getElementById('filtroFecha').value;
        
        let url = `${API_BASE}/admin/auditoria/exportar`;
        const params = [];
        if (usuario) params.push(`usuario_id=${usuario}`);
        if (accion) params.push(`accion=${accion}`);
        if (fecha) params.push(`fecha_desde=${fecha}T00:00:00`, `fecha_hasta=${fecha}T23:59:59`);
        if (params.length) url += '?' + params.join('&');
        
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al exportar');
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `${tipo === 'success' ? '✓' : '✕'} ${mensaje}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fadeOut');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function mostrarError(mensaje) {
    mostrarToast(mensaje, 'error');
}

function mostrarExito(mensaje) {
    mostrarToast(mensaje, 'success');
}

function cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login.html';
    }
}
