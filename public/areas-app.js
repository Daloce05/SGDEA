/**
 * Dashboard por Áreas - Frontend
 * 
 * Módulo complementario que permite visualizar la información
 * organizada por áreas. No modifica la vista general existente.
 * 
 * Permisos:
 * - Administrador: crear/eliminar áreas, asociar/desasociar series
 * - Cargador/Consultor: solo visualizar y navegar
 */

console.log('✓ areas-app.js cargado correctamente');

// ============================================
// VARIABLES DE ESTADO
// ============================================

let areaActual = null;       // Área seleccionada actualmente
let areaActualData = null;   // Datos completos del área seleccionada
let areaSerieActual = null;  // Serie seleccionada dentro del área
let areaSubserieActual = null;

// ============================================
// CARGA DE ÁREAS
// ============================================

/**
 * Carga todas las áreas y las muestra como tarjetas
 */
async function cargarAreas() {
    try {
        const response = await fetch(`${API_BASE}/areas`);
        const data = await response.json();

        if (data.exito) {
            mostrarAreasGrid(data.datos);
        } else {
            document.getElementById('areas-grid').innerHTML = 
                '<p class="loading">Error al cargar áreas</p>';
        }
    } catch (error) {
        console.error('Error cargando áreas:', error);
        document.getElementById('areas-grid').innerHTML = 
            '<p class="loading">Error de conexión</p>';
    }
}

/**
 * Muestra las áreas como tarjetas en un grid
 */
function mostrarAreasGrid(areas) {
    const grid = document.getElementById('areas-grid');
    const esAdmin = usuarioActual && usuarioActual.rol === 'administrador';

    if (areas.length === 0) {
        grid.innerHTML = `
            <div class="area-vacia">
                <p>🗂️ No hay áreas registradas</p>
                ${esAdmin ? '<p>Crea la primera área usando el botón "+ Nueva Área"</p>' : '<p>No hay áreas disponibles por el momento.</p>'}
            </div>`;
        return;
    }

    grid.innerHTML = areas.map(area => `
        <div class="area-card" onclick="seleccionarArea(${area.id_area}, '${escapeHtml(area.nombre_area)}')">
            <div class="area-card-header">
                <span class="area-card-codigo">${escapeHtml(area.codigo_area)}</span>
                ${esAdmin ? `<button class="btn btn-small btn-danger area-card-delete" onclick="event.stopPropagation(); eliminarArea(${area.id_area}, '${escapeHtml(area.nombre_area)}')" title="Eliminar área">✕</button>` : ''}
            </div>
            <h3 class="area-card-nombre">${escapeHtml(area.nombre_area)}</h3>
            <div class="area-card-meta">
                <p class="area-card-meta-item">🏛️ <strong>Dependencia:</strong> ${area.dependencia_productora ? escapeHtml(area.dependencia_productora) : '-'}</p>
                <p class="area-card-meta-item">🏢 <strong>Oficina:</strong> ${area.oficina_productora ? escapeHtml(area.oficina_productora) : '-'}</p>
                <p class="area-card-meta-item">🔢 <strong>Cód. Oficina:</strong> ${area.codigo_oficina ? escapeHtml(area.codigo_oficina) : '-'}</p>
            </div>
            <p class="area-card-desc">${area.descripcion ? escapeHtml(area.descripcion) : 'Sin descripción'}</p>
            <div class="area-card-stats">
                <span class="area-card-stat">📑 ${area.total_series || 0} series</span>
            </div>
        </div>
    `).join('');
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Filtra áreas por texto de búsqueda
 */
function filtrarAreas(texto) {
    const cards = document.querySelectorAll('.area-card');
    const textoLower = texto.toLowerCase();
    cards.forEach(card => {
        const contenido = card.textContent.toLowerCase();
        card.style.display = contenido.includes(textoLower) ? '' : 'none';
    });
}

// ============================================
// NAVEGACIÓN DENTRO DE ÁREAS
// ============================================

/**
 * Selecciona un área y muestra su vista dedicada
 */
async function seleccionarArea(idArea, nombreArea) {
    areaActual = idArea;
    areaSerieActual = null;
    areaSubserieActual = null;

    // Cambiar de vista grid → vista detalle
    document.getElementById('areas-vista-grid').style.display = 'none';
    document.getElementById('areas-vista-detalle').style.display = 'block';
    document.getElementById('area-breadcrumb').style.display = 'none';

    const contenido = document.getElementById('area-contenido-principal');
    contenido.innerHTML = '<p class="loading">Cargando información del área...</p>';

    try {
        const response = await fetch(`${API_BASE}/areas/${idArea}`);
        const data = await response.json();

        if (data.exito) {
            areaActualData = data.datos;
            renderizarInfoArea(data.datos);
            mostrarSeriesDelArea(data.datos);
        } else {
            contenido.innerHTML = '<p class="loading">Error al cargar el área</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        contenido.innerHTML = '<p class="loading">Error de conexión</p>';
    }
}

/**
 * Renderiza la tarjeta de información del área
 */
function renderizarInfoArea(area) {
    const card = document.getElementById('area-info-card');
    card.innerHTML = `
        <div class="area-info-grid">
            <div class="area-info-main">
                <span class="area-info-codigo">${escapeHtml(area.codigo_area)}</span>
                <h2 class="area-info-nombre">${escapeHtml(area.nombre_area)}</h2>
                ${area.descripcion ? `<p class="area-info-desc">${escapeHtml(area.descripcion)}</p>` : ''}
            </div>
            <div class="area-info-meta">
                <div class="area-info-meta-item">
                    <span class="area-info-label">🏛️ Dependencia Productora</span>
                    <span class="area-info-value">${area.dependencia_productora ? escapeHtml(area.dependencia_productora) : '-'}</span>
                </div>
                <div class="area-info-meta-item">
                    <span class="area-info-label">🏢 Oficina Productora</span>
                    <span class="area-info-value">${area.oficina_productora ? escapeHtml(area.oficina_productora) : '-'}</span>
                </div>
                <div class="area-info-meta-item">
                    <span class="area-info-label">🔢 Código Oficina</span>
                    <span class="area-info-value">${area.codigo_oficina ? escapeHtml(area.codigo_oficina) : '-'}</span>
                </div>
                <div class="area-info-meta-item">
                    <span class="area-info-label">📑 Series asociadas</span>
                    <span class="area-info-value">${area.estadisticas?.total_series || 0}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Muestra las series de un área
 */
function mostrarSeriesDelArea(areaData) {
    const container = document.getElementById('area-contenido-principal');
    const esAdmin = usuarioActual && usuarioActual.rol === 'administrador';
    const series = areaData.series || [];

    if (series.length === 0) {
        container.innerHTML = `
            <div class="area-vacia">
                <p>📑 No hay series asociadas a esta área</p>
                ${esAdmin ? '<p>Asocia series existentes usando el botón "+ Asociar Serie"</p>' : ''}
            </div>`;
        return;
    }

    container.innerHTML = `
        <h3 class="area-seccion-titulo">Series documentales (${series.length})</h3>
        <div class="area-series-grid">
            ${series.map(serie => `
                <div class="area-serie-card" onclick="expandirSerieEnArea(${serie.id_serie}, '${escapeHtml(serie.nombre)}')">
                    <div class="area-serie-card-header">
                        <strong>${escapeHtml(serie.codigo)}</strong>
                        ${esAdmin ? `<button class="btn btn-small btn-danger" onclick="event.stopPropagation(); desasociarSerieDelArea(${areaActual}, ${serie.id_serie}, '${escapeHtml(serie.nombre)}')" title="Desasociar del área">✕</button>` : ''}
                    </div>
                    <h4>${escapeHtml(serie.nombre)}</h4>
                    <p class="area-serie-oficina">🏢 ${escapeHtml(serie.nombre_oficina || 'Sin oficina')}</p>
                    <span class="area-serie-stat">📄 ${serie.total_subseries || 0} subseries</span>
                </div>
            `).join('')}
        </div>`;
}

/**
 * Expande una serie dentro del área para mostrar subseries
 */
async function expandirSerieEnArea(idSerie, nombreSerie) {
    areaSerieActual = idSerie;
    areaSubserieActual = null;

    // Mostrar breadcrumb
    const breadcrumb = document.getElementById('area-breadcrumb');
    breadcrumb.style.display = 'flex';
    breadcrumb.innerHTML = `
        <span class="breadcrumb-item" onclick="volverASeriesDeArea()">📑 Series</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item active">${escapeHtml(nombreSerie)}</span>`;

    const contenido = document.getElementById('area-contenido-principal');
    contenido.innerHTML = '<p class="loading">Cargando subseries...</p>';

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries`);
        const data = await response.json();

        if (data.exito) {
            mostrarSubseriesEnArea(data.datos, idSerie, nombreSerie);
        } else {
            contenido.innerHTML = '<p class="loading">Error al cargar subseries</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        contenido.innerHTML = '<p class="loading">Error de conexión</p>';
    }
}

/**
 * Muestra subseries dentro de la vista de área
 */
function mostrarSubseriesEnArea(subseries, idSerie, nombreSerie) {
    const contenido = document.getElementById('area-contenido-principal');

    if (subseries.length === 0) {
        contenido.innerHTML = '<div class="area-vacia"><p>No hay subseries en esta serie</p></div>';
        return;
    }

    contenido.innerHTML = `
        <h4 style="margin-bottom: 16px;">Subseries de "${escapeHtml(nombreSerie)}"</h4>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Tipos</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${subseries.map(sub => `
                        <tr>
                            <td><strong>${escapeHtml(sub.codigo)}</strong></td>
                            <td>${escapeHtml(sub.nombre)}</td>
                            <td>${sub.descripcion ? escapeHtml(sub.descripcion) : '-'}</td>
                            <td><span class="badge badge-active">${sub.total_tipos || 0}</span></td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="expandirSubserieEnArea(${idSerie}, ${sub.id_subserie}, '${escapeHtml(sub.nombre)}', '${escapeHtml(nombreSerie)}')">
                                    Ver ▶
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

/**
 * Expande una subserie para mostrar tipos documentales
 */
async function expandirSubserieEnArea(idSerie, idSubserie, nombreSubserie, nombreSerie) {
    areaSubserieActual = idSubserie;

    const breadcrumb = document.getElementById('area-breadcrumb');
    breadcrumb.style.display = 'flex';
    breadcrumb.innerHTML = `
        <span class="breadcrumb-item" onclick="volverASeriesDeArea()">📑 Series</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item" onclick="expandirSerieEnArea(${idSerie}, '${escapeHtml(nombreSerie)}')">${escapeHtml(nombreSerie)}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item active">${escapeHtml(nombreSubserie)}</span>`;

    const contenido = document.getElementById('area-contenido-principal');
    contenido.innerHTML = '<p class="loading">Cargando tipos documentales...</p>';

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos`);
        const data = await response.json();

        if (data.exito) {
            mostrarTiposEnArea(data.datos, idSerie, idSubserie, nombreSubserie, nombreSerie);
        } else {
            contenido.innerHTML = '<p class="loading">Error al cargar tipos</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        contenido.innerHTML = '<p class="loading">Error de conexión</p>';
    }
}

/**
 * Muestra tipos documentales dentro de la vista de área
 */
function mostrarTiposEnArea(tipos, idSerie, idSubserie, nombreSubserie, nombreSerie) {
    const contenido = document.getElementById('area-contenido-principal');

    if (tipos.length === 0) {
        contenido.innerHTML = '<div class="area-vacia"><p>No hay tipos documentales en esta subserie</p></div>';
        return;
    }

    contenido.innerHTML = `
        <h4 style="margin-bottom: 16px;">Tipos documentales de "${escapeHtml(nombreSubserie)}"</h4>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${tipos.map(tipo => `
                        <tr>
                            <td><strong>${tipo.codigo ? escapeHtml(tipo.codigo) : 'SIN CÓDIGO'}</strong></td>
                            <td>${escapeHtml(tipo.nombre)}</td>
                            <td>${tipo.descripcion ? escapeHtml(tipo.descripcion) : '-'}</td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="expandirTipoEnArea(${idSerie}, ${idSubserie}, ${tipo.id_tipo}, '${escapeHtml(tipo.nombre)}', '${escapeHtml(nombreSubserie)}', '${escapeHtml(nombreSerie)}')">
                                    📦 Ver Archivos
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

/**
 * Expande un tipo documental para mostrar archivos
 */
async function expandirTipoEnArea(idSerie, idSubserie, idTipo, nombreTipo, nombreSubserie, nombreSerie) {
    const breadcrumb = document.getElementById('area-breadcrumb');
    breadcrumb.style.display = 'flex';
    breadcrumb.innerHTML = `
        <span class="breadcrumb-item" onclick="volverASeriesDeArea()">📑 Series</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item" onclick="expandirSerieEnArea(${idSerie}, '${escapeHtml(nombreSerie)}')">${escapeHtml(nombreSerie)}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item" onclick="expandirSubserieEnArea(${idSerie}, ${idSubserie}, '${escapeHtml(nombreSubserie)}', '${escapeHtml(nombreSerie)}')">${escapeHtml(nombreSubserie)}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item active">${escapeHtml(nombreTipo)}</span>`;

    const contenido = document.getElementById('area-contenido-principal');
    contenido.innerHTML = '<p class="loading">Cargando archivos...</p>';

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos/${idTipo}/archivos`);
        const data = await response.json();

        if (data.exito) {
            mostrarArchivosEnArea(data.datos, idSerie, idSubserie, idTipo, nombreTipo);
        } else {
            contenido.innerHTML = '<p class="loading">Error al cargar archivos</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        contenido.innerHTML = '<p class="loading">Error de conexión</p>';
    }
}

/**
 * Muestra archivos dentro de la vista de área
 */
function mostrarArchivosEnArea(archivos, idSerie, idSubserie, idTipo, nombreTipo) {
    const contenido = document.getElementById('area-contenido-principal');

    if (archivos.length === 0) {
        contenido.innerHTML = '<div class="area-vacia"><p>📦 No hay archivos en este tipo documental</p></div>';
        return;
    }

    contenido.innerHTML = `
        <h4 style="margin-bottom: 16px;">Archivos de "${escapeHtml(nombreTipo)}" (${archivos.length})</h4>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Tamaño</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${archivos.map(archivo => `
                        <tr>
                            <td><strong>${escapeHtml(archivo.nombre_original)}</strong></td>
                            <td>${formatearTamano(archivo.tamano_bytes)}</td>
                            <td><span class="badge badge-${archivo.estado}">${archivo.estado}</span></td>
                            <td>${formatearFecha(archivo.creado_en)}</td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="descargarArchivoDesdeArea(${idSerie}, ${idSubserie}, ${idTipo}, ${archivo.id_archivo})">
                                    ⬇️ Descargar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

/**
 * Descarga un archivo desde el contexto de áreas
 */
function descargarArchivoDesdeArea(idSerie, idSubserie, idTipo, idArchivo) {
    // Usa las variables temporales para la descarga
    const prevSerie = currentSerie;
    const prevSubserie = currentSubserie;
    const prevTipo = currentTipo;

    currentSerie = idSerie;
    currentSubserie = idSubserie;
    currentTipo = idTipo;

    descargarArchivo(idArchivo);

    // Restaurar
    currentSerie = prevSerie;
    currentSubserie = prevSubserie;
    currentTipo = prevTipo;
}

/**
 * Vuelve a la vista de grid de áreas
 */
function volverAreas() {
    areaActual = null;
    areaActualData = null;
    areaSerieActual = null;
    areaSubserieActual = null;

    document.getElementById('areas-vista-grid').style.display = '';
    document.getElementById('areas-vista-detalle').style.display = 'none';
    
    cargarAreas();
}

/**
 * Vuelve a la vista de series dentro del área actual
 */
function volverASeriesDeArea() {
    if (areaActualData) {
        document.getElementById('area-breadcrumb').style.display = 'none';
        mostrarSeriesDelArea(areaActualData);
    }
}

// ============================================
// CRUD DE ÁREAS (Solo administrador - validado en backend)
// ============================================

function abrirModalArea() {
    document.getElementById('modal-area').classList.add('active');
}

async function guardarArea() {
    const dependencia = document.getElementById('area-dependencia').value.trim();
    const oficinaProd = document.getElementById('area-oficina-productora').value.trim();
    const codigoOficina = document.getElementById('area-codigo-oficina').value.trim();
    const codigo = document.getElementById('area-codigo').value.trim();
    const nombre = document.getElementById('area-nombre').value.trim();
    const descripcion = document.getElementById('area-descripcion').value.trim();

    if (!codigo || !nombre || !dependencia || !oficinaProd || !codigoOficina) {
        mostrarError('Completa todos los campos requeridos (*)');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo_area: codigo,
                nombre_area: nombre,
                dependencia_productora: dependencia,
                oficina_productora: oficinaProd,
                codigo_oficina: codigoOficina,
                descripcion: descripcion || null
            })
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Área creada exitosamente');
            cerrarModal('modal-area');
            limpiarFormulario('modal-area');
            cargarAreas();
        } else {
            mostrarError(data.error || 'Error creando área');
        }
    } catch (error) {
        mostrarError('Error de conexión: ' + error.message);
    }
}

async function eliminarArea(idArea, nombreArea) {
    if (!confirm(`¿Desactivar el área "${nombreArea}"?\n\nLas series asociadas serán desvinculadas pero seguirán en la vista general.`)) return;

    try {
        const response = await fetch(`${API_BASE}/areas/${idArea}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Área desactivada correctamente');
            cargarAreas();
        } else {
            mostrarError(data.error || 'Error desactivando área');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

// ============================================
// ASOCIAR/DESASOCIAR SERIES
// ============================================

let seriesDisponiblesParaAsociar = [];

async function abrirModalAsociarSerie() {
    const select = document.getElementById('asociar-serie-select');
    const buscar = document.getElementById('asociar-serie-buscar');
    select.innerHTML = '<option value="">Cargando...</option>';
    if (buscar) buscar.value = '';
    document.getElementById('modal-asociar-serie').classList.add('active');

    try {
        const response = await fetch(`${API_BASE}/series`);
        const data = await response.json();

        if (data.exito) {
            seriesDisponiblesParaAsociar = data.datos.filter(s => !s.id_area);
            renderizarSeriesAsociar(seriesDisponiblesParaAsociar);
        } else {
            select.innerHTML = '<option value="">Error al cargar series</option>';
        }
    } catch (error) {
        select.innerHTML = '<option value="">Error de conexión</option>';
    }
}

function renderizarSeriesAsociar(series) {
    const select = document.getElementById('asociar-serie-select');
    const countEl = document.getElementById('asociar-serie-count');

    if (series.length === 0) {
        select.innerHTML = '<option value="">No hay series disponibles</option>';
        if (countEl) countEl.textContent = 'No se encontraron series sin área asignada.';
    } else {
        select.innerHTML = series.map(s =>
            `<option value="${s.id_serie}">${s.codigo} - ${s.nombre}</option>`
        ).join('');
        if (countEl) countEl.textContent = `${series.length} serie(s) disponible(s) sin área asignada.`;
    }
}

function filtrarSeriesAsociar(texto) {
    const textoLower = texto.toLowerCase().trim();
    if (!textoLower) {
        renderizarSeriesAsociar(seriesDisponiblesParaAsociar);
        return;
    }
    const filtradas = seriesDisponiblesParaAsociar.filter(s =>
        (s.codigo && s.codigo.toLowerCase().includes(textoLower)) ||
        (s.nombre && s.nombre.toLowerCase().includes(textoLower))
    );
    renderizarSeriesAsociar(filtradas);
}

async function asociarSerieAlArea() {
    const idSerie = document.getElementById('asociar-serie-select').value;

    if (!idSerie) {
        mostrarError('Selecciona una serie');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/areas/${areaActual}/series/${idSerie}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Serie asociada al área');
            cerrarModal('modal-asociar-serie');
            // Recargar el detalle del área
            seleccionarArea(areaActual, '');
        } else {
            mostrarError(data.error || 'Error asociando serie');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

async function desasociarSerieDelArea(idArea, idSerie, nombreSerie) {
    if (!confirm(`¿Desasociar la serie "${nombreSerie}" de esta área?\n\nLa serie seguirá existiendo en la vista general.`)) return;

    try {
        const response = await fetch(`${API_BASE}/areas/${idArea}/series/${idSerie}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Serie desasociada del área');
            seleccionarArea(idArea, '');
        } else {
            mostrarError(data.error || 'Error desasociando serie');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

// ============================================
// INTEGRACIÓN CON NAVEGACIÓN EXISTENTE
// ============================================

/**
 * Extiende la función cambiarSeccion para soportar la sección de áreas.
 * Se inyecta al cargar la sección de áreas.
 */
(function() {
    const cambiarSeccionOriginal = window.cambiarSeccion;

    window.cambiarSeccion = function(section) {
        // Si se navega a áreas, cargar datos
        if (section === 'areas') {
            cargarAreas();
            configurarPermisosAreas();
        }

        // Llamar a la función original
        if (typeof cambiarSeccionOriginal === 'function') {
            cambiarSeccionOriginal(section);
        }
    };
})();

/**
 * Configura la visibilidad de botones según permisos
 */
function configurarPermisosAreas() {
    const esAdmin = usuarioActual && usuarioActual.rol === 'administrador';

    // Botón crear área
    const btnCrearArea = document.getElementById('btn-crear-area');
    if (btnCrearArea) {
        btnCrearArea.style.display = esAdmin ? '' : 'none';
    }

    // Botón asociar serie
    const btnAsociarSerie = document.getElementById('btn-asociar-serie');
    if (btnAsociarSerie) {
        btnAsociarSerie.style.display = esAdmin ? '' : 'none';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Búsqueda de áreas
    const buscarAreas = document.getElementById('buscar-areas');
    if (buscarAreas) {
        buscarAreas.addEventListener('input', (e) => {
            filtrarAreas(e.target.value);
        });
    }

    // Configurar permisos al cargar
    setTimeout(() => {
        configurarPermisosAreas();
    }, 300);
});
