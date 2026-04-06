/**
 * Sistema de Autenticación y Control de Sesión Frontend
 * 
 * Maneja:
 * - Verificación de sesión al cargar la página
 * - Redirección a login si no hay token
 * - Almacenamiento de token en todas las peticiones
 * - Mostrar/ocultar funciones según rol
 * - Closure de sesión
 */

// ============================================
// VARIABLES GLOBALES
// ============================================
let usuarioActual = null;
let tokenActual = null;

// ============================================
// INICIALIZACIÓN DE SESIÓN
// ============================================

/**
 * Se ejecuta cuando carga el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    configurarControlAcceso();
});

/**
 * Verifica si hay una sesión activa
 */
function verificarSesion() {
    tokenActual = localStorage.getItem('token');
    const usuarioJSON = localStorage.getItem('usuario');

    if (!tokenActual || !usuarioJSON) {
        console.log('Sin sesión activa, redirigiendo a login...');
        window.location.href = '/login.html';
        return;
    }

    try {
        usuarioActual = JSON.parse(usuarioJSON);
        console.log(`✓ Sesión iniciada: ${usuarioActual.nombre} ${usuarioActual.apellido} (${usuarioActual.rol})`);
        
        // Mostrar información del usuario
        mostrarInfoUsuario();
    } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        localStorage.clear();
        window.location.href = '/login.html';
    }
}

/**
 * Muestra la información del usuario en el header
 */
function mostrarInfoUsuario() {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');

    if (userNameEl) {
        userNameEl.textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    }

    if (userRoleEl) {
        const roleLabel = obtenerLabelRol(usuarioActual.rol);
        userRoleEl.textContent = `(${roleLabel})`;
        userRoleEl.className = `user-role role-${usuarioActual.rol}`;
    }
}

/**
 * Obtiene la etiqueta amigable para un rol
 */
function obtenerLabelRol(rol) {
    const labels = {
        'administrador': '👤 Administrador',
        'cargador': '📤 Cargador',
        'consultor': '👁️ Consultor'
    };
    return labels[rol] || rol;
}

/**
 * Cierra la sesión del usuario
 */
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        console.log('Sesión cerrada');
        window.location.href = '/login.html';
    }
}

// ============================================
// CONTROL DE ACCESO POR ROL
// ============================================

/**
 * Configura el control de acceso basado en roles
 */
function configurarControlAcceso() {
    if (!usuarioActual) return;

    // Ocultar/mostrar elementos según el rol
    const rol = usuarioActual.rol;

    // ADMINISTRADOR: Acceso a todo
    if (rol === 'administrador') {
        mostrarElementos('[data-role="admin"]');
        mostrarElementos('[data-role="admin,cargador"]');
        mostrarElementos('[data-role="admin,cargador,consultor"]');
    }
    // CARGADOR: Puede modificar archivos pero no estructura
    else if (rol === 'cargador') {
        ocultarElementos('[data-role="admin"]');
        mostrarElementos('[data-role="admin,cargador"]');
        mostrarElementos('[data-role="admin,cargador,consultor"]');
        // Deshabilitar botones de crear serie, subserie, tipo
        deshabilitarBotones('[data-action="crear-serie"]');
        deshabilitarBotones('[data-action="crear-subserie"]');
        deshabilitarBotones('[data-action="crear-tipo"]');
        deshabilitarBotones('[data-action="editar-serie"]');
        deshabilitarBotones('[data-action="editar-subserie"]');
        deshabilitarBotones('[data-action="editar-tipo"]');
    }
    // CONSULTOR: Solo lectura
    else if (rol === 'consultor') {
        ocultarElementos('[data-role="admin"]');
        ocultarElementos('[data-role="admin,cargador"]');
        mostrarElementos('[data-role="admin,cargador,consultor"]');
        // Deshabilitar todos los botones de crear/editar/eliminar
        deshabilitarBotones('[data-action*="crear"]');
        deshabilitarBotones('[data-action*="editar"]');
        deshabilitarBotones('[data-action*="eliminar"]');
        deshabilitarBotones('[data-action*="cargar"]');
        // Ocultar botones peligrosos EXCEPTO el logout
        document.querySelectorAll('.btn-danger').forEach(btn => {
            if (btn.id !== 'btn-logout') {
                btn.style.display = 'none';
            }
        });
        ocultarElementos('.btn-warning');
    }

    console.log(`✓ Control de acceso configurado para: ${rol}`);
}

/**
 * Muestra elementos según el data-role
 */
function mostrarElementos(selector) {
    document.querySelectorAll(selector).forEach(el => {
        el.style.display = '';
        el.classList.remove('disabled');
    });
}

/**
 * Oculta elementos según el data-role
 */
function ocultarElementos(selector) {
    document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
        el.classList.add('disabled');
    });
}

/**
 * Deshabilita botones
 */
function deshabilitarBotones(selector) {
    document.querySelectorAll(selector).forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.title = 'Esta acción no está permitida para tu rol';
    });
}

// ============================================
// INTERCEPTOR DE PETICIONES
// ============================================

/**
 * Override del fetch para agregar token automáticamente
 */
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const [resource, config] = args;
    
    // Solo agregar token a peticiones a la API
    if (typeof resource === 'string' && resource.startsWith('/api')) {
        const newConfig = {
            ...config,
            headers: {
                ...config?.headers,
                'Authorization': `Bearer ${tokenActual}`
            }
        };

        return originalFetch(resource, newConfig);
    }

    return originalFetch(...args);
};

/**
 * Verifica si el usuario puede realizar una acción
 * @param {string} accion - Tipo de acción (crear, editar, eliminar, cargar)
 * @returns {boolean}
 */
function puedeEjecutarAccion(accion) {
    if (!usuarioActual) return false;

    const rol = usuarioActual.rol;
    const acciones = {
        'crear-serie': ['administrador'],
        'crear-subserie': ['administrador'],
        'crear-tipo': ['administrador'],
        'crear-ofic ina': ['administrador'],
        'editar-serie': ['administrador'],
        'editar-subserie': ['administrador'],
        'editar-tipo': ['administrador'],
        'editar-oficina': ['administrador'],
        'eliminar-serie': ['administrador'],
        'eliminar-subserie': ['administrador'],
        'eliminar-tipo': ['administrador'],
        'eliminar-oficina': ['administrador'],
        'cargar-archivo': ['administrador', 'cargador'],
        'descargar-archivo': ['administrador', 'cargador', 'consultor'],
        'buscar': ['administrador', 'cargador', 'consultor'],
        'consultar': ['administrador', 'cargador', 'consultor']
    };

    const rolesPermitidos = acciones[accion] || [];
    return rolesPermitidos.includes(rol);
}

/**
 * Valida que el usuario puede ejecutar una acción
 * Si no puede, muestra un error y retorna false
 */
function validarAcceso(accion) {
    if (!puedeEjecutarAccion(accion)) {
        const mensaje = `No tienes permisos para: ${accion}`;
        console.warn(`⚠ ${mensaje}`);
        mostrarNotificacion(`❌ ${mensaje}`, 'error');
        return false;
    }
    return true;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Verifica si el usuario es administrador
 */
function esAdmin() {
    return usuarioActual?.rol === 'administrador';
}

/**
 * Verifica si el usuario es cargador o superior
 */
function esCargador() {
    return ['administrador', 'cargador'].includes(usuarioActual?.rol);
}

/**
 * Verifica si el usuario es consultor o superior
 */
function esConsultor() {
    return ['administrador', 'cargador', 'consultor'].includes(usuarioActual?.rol);
}

/**
 * Muestra una notificación al usuario
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.className = `notificacion notificacion-${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'error' ? '#e74c3c' : tipo === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;

    document.body.appendChild(notif);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

console.log('✓ Sistema de autenticación y control de acceso cargado');
