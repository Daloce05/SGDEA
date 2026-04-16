/**
 * Frontend TRD SGDEA
 * Sistema de Gestión Documental - Interfaz de Usuario
 * 
 * API BASE: /api/trd (RUTA RELATIVA - Backend sirve desde mismo servidor)
 */

console.log('✓ app.js cargado correctamente');

// ============================================
// CONFIGURACIÓN
// ============================================

const API_BASE = '/api/trd';
let currentSerie = null;
let currentSubserie = null;
let currentTipo = null;
let todosLosTiposGlobal = []; // Para almacenar todos los tipos y poder filtrar

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkConnection();
});

function initializeApp() {
    cargarOficinas();
    cargarSeries();
    cargarTodosLosTipos(); // Cargar tabla de tipos documentales
    actualizarEstadisticas();
    
    // FORZAR llenado de dropdowns después de cargar series
    setTimeout(() => {
        cargarSeriesParaDropdowns();
    }, 500);
}

// Función para asegurar que los dropdowns se llenen
async function cargarSeriesParaDropdowns() {
    try {
        const response = await fetch(`${API_BASE}/series`);
        const data = await response.json();

        if (data.exito && data.datos.length > 0) {
            // Llenar dropdown de series en sección de Subseries
            const selectSerie = document.getElementById('filter-serie');
            if (selectSerie && selectSerie.children.length <= 1) {
                selectSerie.innerHTML = '<option value="">Selecciona una serie...</option>' +
                    data.datos.map(s => `<option value="${s.id_serie}">${s.codigo} - ${s.nombre}</option>`).join('');
            }

            // Llenar dropdown de series en sección de Archivos
            const selectArchivoSerie = document.getElementById('filter-archivo-serie');
            if (selectArchivoSerie && selectArchivoSerie.children.length <= 1) {
                selectArchivoSerie.innerHTML = '<option value="">Selecciona una serie...</option>' +
                    data.datos.map(s => `<option value="${s.id_serie}">${s.codigo} - ${s.nombre}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando series para dropdowns:', error);
    }
}
    
function setupEventListeners() {
    console.log('✓ setupEventListeners ejecutada');
    // Navegación sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            console.log('✓ Navegando a sección:', section);
            cambiarSeccion(section);
        });
    });

    // Filtros
    const filterSerie = document.getElementById('filter-serie');
    if (filterSerie) {
        filterSerie.addEventListener('change', (e) => {
            currentSerie = e.target.value;
            if (currentSerie) cargarSubseries(currentSerie);
        });
    }

    const filterSubserie = document.getElementById('filter-subserie');
    if (filterSubserie) {
        filterSubserie.addEventListener('change', (e) => {
            currentSubserie = e.target.value;
            if (currentSubserie) cargarTipos(currentSubserie);
        });
    }

    const filterTipo = document.getElementById('filter-tipo');
    if (filterTipo) {
        filterTipo.addEventListener('change', (e) => {
            currentTipo = e.target.value;
            if (currentTipo) cargarArchivos(currentTipo);
        });
    }
    const filterArchivoSerie = document.getElementById('filter-archivo-serie');
    if (filterArchivoSerie) {
        filterArchivoSerie.addEventListener('change', (e) => {
            const idSerie = e.target.value;
            currentSerie = idSerie;
            if (idSerie) {
                cargarSubseriesArchivos(idSerie);
            } else {
                document.getElementById('filter-archivo-subserie').innerHTML = '<option value="">Selecciona una subserie...</option>';
                document.getElementById('filter-tipo').innerHTML = '<option value="">Selecciona un tipo...</option>';
            }
        });
    }

    const filterArchivoSubserie = document.getElementById('filter-archivo-subserie');
    if (filterArchivoSubserie) {
        filterArchivoSubserie.addEventListener('change', (e) => {
            const idSubserie = e.target.value;
            currentSubserie = idSubserie;
            if (idSubserie) {
                const idSerie = document.getElementById('filter-archivo-serie').value;
                cargarTiposArchivos(idSerie, idSubserie);
            } else {
                document.getElementById('filter-tipo').innerHTML = '<option value="">Selecciona un tipo...</option>';
            }
        });
    }

    // Búsqueda quick
    document.getElementById('buscar-series').addEventListener('input', (e) => {
        filtrarSeries(e.target.value);
    });

    document.getElementById('buscar-oficinas').addEventListener('input', (e) => {
        filtrarOficinas(e.target.value);
    });

    // Búsqueda de tipos documentales
    const buscarTipos = document.getElementById('buscar-tipos');
    if (buscarTipos) {
        buscarTipos.addEventListener('input', (e) => {
            filtrarTipos(e.target.value);
        });
    }

    // Carga de archivos
    const fileInput = document.getElementById('archivo-file');
    const uploadLabel = document.querySelector('.upload-label');

    uploadLabel.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => mostrarNombreArchivo(e.target.files[0]));

    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.style.backgroundColor = '#2596be';
        uploadLabel.style.color = 'white';
    });

    uploadLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadLabel.style.backgroundColor = '';
        uploadLabel.style.color = '';
    });

    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.style.backgroundColor = '';
        uploadLabel.style.color = '';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            mostrarNombreArchivo(e.dataTransfer.files[0]);
        }
    });
}

// ============================================
// NAVEGACIÓN
// ============================================

function cambiarSeccion(section) {
    console.log(`🔄 Cambiando a sección: ${section}`);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Mostrar sección activa
    document.getElementById(`${section}-section`).classList.add('active');
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Cargar datos específicos según la sección
    if (section === 'tipos') {
        console.log('📋 Cargando subseries para sección de tipos...');
        cargarTodasLasSubseriesParaTipos();
    }
}

// ============================================
// OFICINAS
// ============================================

async function cargarOficinas() {
    try {
        const response = await fetch(`${API_BASE}/oficinas`);
        const data = await response.json();

        if (data.exito && data.datos) {
            const tbody = document.getElementById('oficinas-table');
            tbody.innerHTML = '';

            data.datos.forEach(oficina => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td><strong>${oficina.codigo_oficina}</strong></td>
                    <td>${oficina.nombre_oficina}</td>
                    <td>${oficina.total_series || 0}</td>
                    <td>
                        <button class="btn btn-small" onclick="editarOficina(${oficina.id_oficina})">Editar</button>
                        <button class="btn btn-small btn-danger" onclick="eliminarOficina(${oficina.id_oficina})">Desactivar</button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error cargando oficinas:', error);
        mostrarError('Error al cargar oficinas');
    }
}

function abrirModalOficina() {
    document.getElementById('modal-oficina').classList.add('active');
}

async function guardarOficina() {
    const codigo = document.getElementById('oficina-codigo').value;
    const nombre = document.getElementById('oficina-nombre').value;

    if (!codigo || !nombre) {
        mostrarError('Completa todos los campos requeridos (*)');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/oficinas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo_oficina: codigo,
                nombre_oficina: nombre
            })
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Oficina creada exitosamente');
            cerrarModal('modal-oficina');
            limpiarFormulario('modal-oficina');
            cargarOficinas();
            // Recargar dropdown en modal de serie
            cargarOficinasDropdown();
        } else {
            mostrarError(data.error || 'Error creando oficina');
        }
    } catch (error) {
        mostrarError('Error de conexión: ' + error.message);
    }
}

function editarOficina(id) {
    // Por ahora, solo mostrar alerta
    mostrarError('Edición en desarrollo');
}

async function eliminarOficina(id) {
    if (!confirm('¿Desactivar esta oficina?')) return;

    try {
        const response = await fetch(`${API_BASE}/oficinas/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Oficina desactivada');
            cargarOficinas();
        } else {
            mostrarError(data.error || 'Error desactivando oficina');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function filtrarOficinas(texto) {
    const filas = document.querySelectorAll('#oficinas-table tr');
    filas.forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(texto.toLowerCase()) ? '' : 'none';
    });
}

// ============================================
// SERIES
// ============================================

async function cargarSeries() {
    try {
        const response = await fetch(`${API_BASE}/series`);
        const data = await response.json();

        if (data.exito) {
            mostrarSeries(data.datos);
            actualizarSelectSeries(data.datos);
        } else {
            mostrarError(data.error || 'Error cargando series');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
        mostrarEstadoOffline();
    }
}

// Cargar TODOS los tipos documentales de TODAS las subseries
async function cargarTodosLosTipos() {
    try {
        const response = await fetch(`${API_BASE}/series`);
        const seriesData = await response.json();

        if (!seriesData.exito || !seriesData.datos.length) {
            console.warn('⚠️ No hay series disponibles');
            return;
        }

        let todosTipos = [];
        console.log(`📑 Iniciando carga de tipos desde ${seriesData.datos.length} serie(s)...`);
        
        // Para cada serie, obtener subseries y luego tipos
        for (const serie of seriesData.datos) {
            try {
                const subsResp = await fetch(`${API_BASE}/series/${serie.id_serie}/subseries`);
                const subsData = await subsResp.json();
                
                if (subsData.exito && Array.isArray(subsData.datos)) {
                    console.log(`  📊 Serie "${serie.nombre}": ${subsData.datos.length} subserie(s)`);
                    
                    // Para cada subserie, obtener tipos
                    for (const subserie of subsData.datos) {
                        try {
                            const tiposResp = await fetch(`${API_BASE}/series/${serie.id_serie}/subseries/${subserie.id_subserie}/tipos`);
                            const tiposData = await tiposResp.json();
                            
                            if (tiposData.exito && Array.isArray(tiposData.datos)) {
                                if (tiposData.datos.length > 0) {
                                    console.log(`    └─ Subserie "${subserie.nombre}": ${tiposData.datos.length} tipo(s)`);
                                }
                                
                                const tiposConContexto = tiposData.datos.map(tipo => ({
                                    ...tipo,
                                    id_subserie: subserie.id_subserie,
                                    nombre_subserie: subserie.nombre,
                                    id_serie: serie.id_serie,
                                    nombre_serie: serie.nombre
                                }));
                                todosTipos = todosTipos.concat(tiposConContexto);
                            }
                        } catch (e) {
                            console.error(`❌ Error cargando tipos de subserie ${subserie.id_subserie}:`, e);
                        }
                    }
                }
            } catch (e) {
                console.error(`❌ Error cargando subseries de serie ${serie.id_serie}:`, e);
            }
        }

        console.log(`✅ TOTAL CARGADO: ${todosTipos.length} tipos documentales`);
        
        // Guardar AQUÍ y una sola vez en la variable global
        todosLosTiposGlobal = todosTipos;
        
        // Mostrar tabla con todos los tipos
        mostrarTodosTipos(todosTipos);
    } catch (error) {
        console.error('❌ Error cargando todos los tipos:', error);
    }
}

function mostrarTodosTipos(tipos) {
    const tbody = document.getElementById('tipos-table');

    if (tipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay tipos documentales registrados</td></tr>';
        return;
    }

    tbody.innerHTML = tipos.map(tipo => `
        <tr>
            <td><strong>${tipo.codigo || 'SIN CÓDIGO'}</strong></td>
            <td>${tipo.nombre}</td>
            <td>${tipo.nombre_subserie}</td>
            <td>${tipo.nombre_serie}</td>
            <td><span class="badge badge-active">0</span></td>
            <td>
                <button class="btn btn-small btn-primary" onclick="verArchivosDeTipo(${tipo.id_tipo}, '${tipo.nombre}', ${tipo.id_serie}, ${tipo.id_subserie}, '${tipo.nombre_serie}', '${tipo.nombre_subserie}')">
                    Ver ▶
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarTipo(${tipo.id_serie}, ${tipo.id_subserie}, ${tipo.id_tipo})">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

function filtrarTipos(texto) {
    if (texto.trim() === '') {
        mostrarTodosTipos(todosLosTiposGlobal);
        return;
    }

    const textoLower = texto.toLowerCase();
    const tiposFiltrados = todosLosTiposGlobal.filter(tipo => 
        (tipo.codigo && tipo.codigo.toLowerCase().includes(textoLower)) ||
        (tipo.nombre && tipo.nombre.toLowerCase().includes(textoLower)) ||
        (tipo.nombre_subserie && tipo.nombre_subserie.toLowerCase().includes(textoLower)) ||
        (tipo.nombre_serie && tipo.nombre_serie.toLowerCase().includes(textoLower))
    );

    mostrarTodosTipos(tiposFiltrados);
}

// Nueva función para ver archivos de un tipo específico
async function verArchivosDeTipo(idTipo, nombreTipo, idSerie, idSubserie, nombreSerie, nombreSubserie) {
    console.log(`Viendo archivos del tipo: ${nombreTipo} (${idTipo})`);
    
    currentTipo = idTipo;
    currentSerie = idSerie;
    currentSubserie = idSubserie;
    
    // Navegar a sección Archivos
    cambiarSeccion('archivos');
    
    // Actualizar dropdowns para mostrar la selección actual
    document.getElementById('filter-archivo-serie').value = idSerie;
    document.getElementById('filter-archivo-subserie').innerHTML = 
        `<option value=""><Selecciona una subserie...</option>
         <option value="${idSubserie}" selected>${nombreSubserie}</option>`;
    document.getElementById('filter-tipo').value = idTipo;
    
    // Cargar los archivos del tipo
    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos/${idTipo}/archivos`);
        const data = await response.json();
        
        if (data.exito) {
            mostrarArchivos(data.datos);
        } else {
            mostrarError(data.error || 'Error cargando archivos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

function mostrarSeries(series) {
    const tbody = document.getElementById('series-table');

    if (series.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay series registradas</td></tr>';
        return;
    }

    tbody.innerHTML = series.map(serie => `
        <tr>
            <td><strong>${serie.codigo}</strong></td>
            <td>${serie.nombre}</td>
            <td>${serie.descripcion || '-'}</td>
            <td>${serie.años_retencion} años</td>
            <td>
                <span class="badge badge-active">${serie.estadisticas?.total_subseries || 0}</span>
            </td>
            <td>
                <button class="btn btn-small btn-primary" onclick="verDetallesSerie(${serie.id_serie})">
                    Ver
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarSerie(${serie.id_serie})">
                    X
                </button>
            </td>
        </tr>
    `).join('');
}

function filtrarSeries(texto) {
    const filas = document.querySelectorAll('#series-table tr');
    filas.forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(texto.toLowerCase()) ? '' : 'none';
    });
}

async function guardarSerie() {
    const id_oficina = document.getElementById('serie-oficina').value;
    const codigo = document.getElementById('serie-codigo').value;
    const nombre = document.getElementById('serie-nombre').value;
    const descripcion = document.getElementById('serie-descripcion').value;
    const años = document.getElementById('serie-anos').value;

    if (!id_oficina || !codigo || !nombre || !años) {
        mostrarError('Completa todos los campos requeridos (*). Selecciona una oficina.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_oficina: parseInt(id_oficina),
                codigo,
                nombre,
                descripcion,
                tiempo_gestion: parseInt(años),
                tiempo_central: 0
            })
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Serie creada exitosamente');
            cerrarModal('modal-serie');
            limpiarFormulario('modal-serie');
            cargarSeries();
        } else {
            mostrarError(data.error || 'Error creando serie');
        }
    } catch (error) {
        mostrarError('Error de conexión: ' + error.message);
    }
}

async function eliminarSerie(id) {
    if (!confirm('¿Desactivar esta serie?')) return;

    try {
        const response = await fetch(`${API_BASE}/series/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Serie desactivada');
            cargarSeries();
        } else {
            mostrarError(data.error || 'Error desactivando serie');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function actualizarSelectSeries(series) {
    const select = document.getElementById('filter-serie');
    select.innerHTML = '<option value="">Selecciona una serie...</option>' +
        series.map(s => `<option value="${s.id_serie}">${s.codigo} - ${s.nombre}</option>`).join('');
}

function verDetallesSerie(id) {
    console.log('✓ Serie seleccionada:', id);
    mostrarExito(`Detalles de serie #${id}`);
}

function abrirModalSerie() {
    console.log('✓ abrirModalSerie ejecutada');
    cargarOficinasDropdown();
    document.getElementById('modal-serie').classList.add('active');
    console.log('✓ Clase active agregada al modal');
}

async function cargarOficinasDropdown() {
    try {
        const response = await fetch(`${API_BASE}/oficinas`);
        const data = await response.json();
        
        if (data.exito && data.datos) {
            const select = document.getElementById('serie-oficina');
            select.innerHTML = '<option value="">Selecciona una oficina...</option>';
            
            data.datos.forEach(oficina => {
                const option = document.createElement('option');
                option.value = oficina.id_oficina;
                option.textContent = `${oficina.codigo_oficina} - ${oficina.nombre_oficina}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando oficinas:', error);
    }
}

// ============================================
// SUBSERIES
// ============================================

async function cargarSubseries(idSerie) {
    if (!idSerie) {
        document.getElementById('subseries-table').innerHTML = 
            '<tr class="loading"><td colspan="6">Selecciona una serie</td></tr>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries`);
        const data = await response.json();

        if (data.exito) {
            mostrarSubseries(data.datos);
            actualizarSelectSubseries(data.datos);
        } else {
            mostrarError(data.error || 'Error cargando subseries');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function mostrarSubseries(subseries) {
    const tbody = document.getElementById('subseries-table');

    if (subseries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay subseries en esta serie</td></tr>';
        return;
    }

    tbody.innerHTML = subseries.map(sub => `
        <tr>
            <td><strong>${sub.codigo}</strong></td>
            <td>${sub.nombre}</td>
            <td>${sub.descripcion || '-'}</td>
            <td>
                <span class="badge badge-active">${sub.total_tipos || 0}</span>
            </td>
            <td>
                <span class="badge ${sub.activa ? 'badge-active' : 'badge-inactive'}">
                    ${sub.activa ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <button class="btn btn-small btn-danger" onclick="eliminarSubserie(${currentSerie}, ${sub.id_subserie})">
                    X
                </button>
            </td>
        </tr>
    `).join('');
}

async function guardarSubserie() {
    const idSerie = document.getElementById('subserie-serie-parent').value;
    const codigo = document.getElementById('subserie-codigo').value;
    const nombre = document.getElementById('subserie-nombre').value;
    const descripcion = document.getElementById('subserie-descripcion').value;

    if (!idSerie || !codigo || !nombre) {
        mostrarError('Completa los campos requeridos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo,
                nombre,
                descripcion
            })
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Subserie creada exitosamente');
            cerrarModal('modal-subserie');
            limpiarFormulario('modal-subserie');
            cargarSubseries(idSerie);
        } else {
            mostrarError(data.error || 'Error creando subserie');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

async function eliminarSubserie(idSerie, idSubserie) {
    if (!confirm('¿Desactivar esta subserie?')) return;

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Subserie desactivada');
            cargarSubseries(idSerie);
        } else {
            mostrarError(data.error || 'Error desactivando subserie');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function actualizarSelectSubseries(subseries) {
    const select = document.getElementById('filter-subserie');
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona una subserie...</option>' +
        subseries.map(s => `<option value="${s.id_subserie}" data-serie-id="${s.id_serie}">${s.codigo} - ${s.nombre}</option>`).join('');
    
    // NO actualizar filter-subserie-tipos aquí
    // El dropdown de Tipos Documentales debe mantenerse con TODAS las subseries de TODAS las series
}

function abrirModalSubserie() {
    cargarSeriesParaModal();
    document.getElementById('modal-subserie').classList.add('active');
}

async function cargarSeriesParaModal() {
    try {
        const response = await fetch(`${API_BASE}/series`);
        const data = await response.json();
        if (data.exito) {
            const select = document.getElementById('subserie-serie-parent');
            select.innerHTML = '<option value="">Selecciona una serie...</option>' +
                data.datos.map(s => `<option value="${s.id_serie}">${s.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando series para modal:', error);
    }
}

/**
 * Carga TODAS las subseries de TODAS las series
 * para la vista de Tipos Documentales
 */
async function cargarTodasLasSubseriesParaTipos() {
    try {
        console.log('🔍 Cargando todas las subseries de todas las series...');
        
        const seriesResponse = await fetch(`${API_BASE}/series`);
        const seriesData = await seriesResponse.json();

        if (!seriesData.exito || !seriesData.datos || seriesData.datos.length === 0) {
            console.warn('⚠️ No hay series disponibles');
            return;
        }

        console.log(`📂 Encontradas ${seriesData.datos.length} series`);

        let todasLasSubseries = [];

        // Cargar subseries de cada serie EN PARALELO
        const promesas = seriesData.datos.map(async (serie) => {
            try {
                const respSub = await fetch(`${API_BASE}/series/${serie.id_serie}/subseries`);
                const subData = await respSub.json();
                
                if (subData.exito && Array.isArray(subData.datos)) {
                    console.log(`✓ Serie "${serie.nombre}": ${subData.datos.length} subseries`);
                    return subData.datos;
                }
                return [];
            } catch (error) {
                console.error(`❌ Error obteniendo subseries de ${serie.nombre}:`, error);
                return [];
            }
        });

        const resultados = await Promise.all(promesas);
        todasLasSubseries = resultados.flat();

        console.log(`✅ Total subseries cargadas: ${todasLasSubseries.length}`);

        // Llenar dropdown filter-subserie-tipos
        const selectFilterTipos = document.getElementById('filter-subserie-tipos');
        if (selectFilterTipos) {
            if (todasLasSubseries.length === 0) {
                selectFilterTipos.innerHTML = '<option value="">No hay subseries disponibles</option>';
                console.warn('⚠️ El dropdown quedó vacío - revisa la BD');
            } else {
                selectFilterTipos.innerHTML = '<option value="">Selecciona una subserie...</option>' +
                    todasLasSubseries.map(s => `<option value="${s.id_subserie}">${s.codigo || 'SIN CÓDIGO'} - ${s.nombre}</option>`).join('');
                console.log('✓ Dropdown filter-subserie-tipos actualizado');
            }
        } else {
            console.error('❌ No encontré elemento #filter-subserie-tipos en el DOM');
        }

        // Llenar también el dropdown del modal para crear tipo
        const selectModalTipo = document.getElementById('tipo-subserie-parent');
        if (selectModalTipo) {
            if (todasLasSubseries.length === 0) {
                selectModalTipo.innerHTML = '<option value="">No hay subseries disponibles</option>';
            } else {
                selectModalTipo.innerHTML = '<option value="">Selecciona una subserie...</option>' +
                    todasLasSubseries.map(s => `<option value="${s.id_subserie}">${s.codigo || 'SIN CÓDIGO'} - ${s.nombre}</option>`).join('');
                console.log('✓ Dropdown tipo-subserie-parent actualizado');
            }
        }

    } catch (error) {
        console.error('💥 Error en cargarTodasLasSubseriesParaTipos:', error);
        mostrarError('Error al cargar subseries: ' + error.message);
    }
}

// ============================================
// TIPOS DOCUMENTALES
// ============================================

async function cargarTipos(idSubserie) {
    if (!idSubserie) {
        document.getElementById('tipos-table').innerHTML = 
            '<tr class="loading"><td colspan="6">Selecciona una subserie</td></tr>';
        return;
    }

    try {
        console.log(`🔍 Cargando tipos para subserie ${idSubserie}...`);

        // Intentar obtener serie_id del elemento seleccionado en el dropdown
        let serieId = currentSerie;
        
        // Si estamos en la sección de Tipos Documentales y no tenemos currentSerie
        if (!serieId) {
            // Buscar en el dropdown filter-subserie-tipos
            const filterSubserieTipos = document.getElementById('filter-subserie-tipos');
            if (filterSubserieTipos && filterSubserieTipos.value) {
                const selectedOption = filterSubserieTipos.options[filterSubserieTipos.selectedIndex];
                serieId = selectedOption.getAttribute('data-serie-id');
                console.log(`✓ Serie obtenida del dropdown: ${serieId}`);
            }
        }
        
        // Si aún no tenemos serie, búscala
        if (!serieId) {
            console.log('📂 Serie no disponible, buscando...');
            
            const allSeriesResp = await fetch(`${API_BASE}/series`);
            const allSeriesData = await allSeriesResp.json();

            if (allSeriesData.exito && allSeriesData.datos.length > 0) {
                for (const serie of allSeriesData.datos) {
                    const subsResp = await fetch(`${API_BASE}/series/${serie.id_serie}/subseries`);
                    const subsData = await subsResp.json();
                    
                    if (subsData.exito && subsData.datos) {
                        const found = subsData.datos.find(s => s.id_subserie === parseInt(idSubserie));
                        if (found) {
                            serieId = serie.id_serie;
                            currentSerie = serieId;
                            console.log(`✓ Serie padre encontrada: ${serieId}`);
                            break;
                        }
                    }
                }
            }

            if (!serieId) {
                console.error('❌ No se encontró la serie padre');
                mostrarError('No se puede encontrar la serie de esta subserie');
                return;
            }
        }

        console.log(`📍 Llamando endpoint: /series/${serieId}/subseries/${idSubserie}/tipos`);

        const response = await fetch(`${API_BASE}/series/${serieId}/subseries/${idSubserie}/tipos`);
        const data = await response.json();

        console.log(`📊 Respuesta de tipos:`, data);

        if (data.exito) {
            mostrarTipos(data.datos);
            actualizarSelectTipos(data.datos);
        } else {
            console.error('❌ Error en respuesta:', data);
            mostrarError(data.error || 'Error cargando tipos');
        }
    } catch (error) {
        console.error('💥 Error en cargarTipos:', error);
        mostrarError('Error: ' + error.message);
    }
}

function mostrarTipos(tipos) {
    const tbody = document.getElementById('tipos-table');

    if (tipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay tipos en esta subserie</td></tr>';
        return;
    }

    tbody.innerHTML = tipos.map(tipo => `
        <tr>
            <td><strong>${tipo.codigo || 'SIN CÓDIGO'}</strong></td>
            <td>${tipo.nombre}</td>
            <td>${tipo.descripcion || '-'}</td>
            <td>${tipo.id_subserie ? 'Subserie' : 'Serie'}</td>
            <td>
                <span class="badge badge-active">0</span>
            </td>
            <td>
                <button class="btn btn-small btn-danger" onclick="eliminarTipo(${currentSerie}, ${currentSubserie}, ${tipo.id_tipo})">
                    X
                </button>
            </td>
        </tr>
    `).join('');
}

async function guardarTipo() {
    const idSerie = document.getElementById('tipo-serie-parent').value;
    const idSubserie = document.getElementById('tipo-subserie-parent').value;
    const codigo = document.getElementById('tipo-codigo').value;
    const nombre = document.getElementById('tipo-nombre').value;
    const descripcion = document.getElementById('tipo-descripcion').value;

    if (!idSerie || !idSubserie || !codigo || !nombre) {
        mostrarError('Completa los campos requeridos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo,
                nombre,
                descripcion
            })
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Tipo creado exitosamente');
            cerrarModal('modal-tipo');
            limpiarFormulario('modal-tipo');
            cargarTipos(idSubserie);
        } else {
            mostrarError(data.error || 'Error creando tipo');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

async function eliminarTipo(idSerie, idSubserie, idTipo) {
    console.log(`🗑️ Intentando eliminar tipo: serie=${idSerie}, subserie=${idSubserie}, tipo=${idTipo}`);
    
    if (!confirm('¿Desactivar este tipo?')) return;

    try {
        const url = `${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos/${idTipo}`;
        console.log(`📤 DELETE ${url}`);
        
        const response = await fetch(url, {
            method: 'DELETE'
        });

        console.log(`📊 Response status: ${response.status}`);

        const data = await response.json();

        console.log(`📥 Response data:`, data);

        if (data.exito) {
            mostrarExito('Tipo desactivado');
            cargarTodosLosTipos(); // Recargar todos los tipos
        } else {
            mostrarError(data.error || 'Error desactivando tipo');
        }
    } catch (error) {
        console.error('💥 Error en eliminarTipo:', error);
        mostrarError('Error de conexión: ' + error.message);
    }
}

function actualizarSelectTipos(tipos) {
    const select = document.getElementById('filter-tipo');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona un tipo...</option>' +
        tipos.map(t => `<option value="${t.id_tipo}">${t.nombre}</option>`).join('');
}

function abrirModalTipo() {
    cargarSeriesParaModalTipo();
    document.getElementById('modal-tipo').classList.add('active');
}

async function cargarSeriesParaModalTipo() {
    try {
        const response = await fetch(`${API_BASE}/series`);
        const data = await response.json();
        
        if (data.exito) {
            const select = document.getElementById('tipo-serie-parent');
            select.innerHTML = '<option value="">Selecciona una serie...</option>' +
                data.datos.map(s => `<option value="${s.id_serie}">${s.nombre}</option>`).join('');
            
            // Event listener para cuando se selecciona una serie
            select.addEventListener('change', (e) => {
                const idSerie = e.target.value;
                if (idSerie) {
                    cargarSubseriesParaModalTipo(idSerie);
                } else {
                    document.getElementById('tipo-subserie-parent').innerHTML = '<option value="">Selecciona una subserie...</option>';
                }
            });
        }
    } catch (error) {
        console.error('Error cargando series:', error);
    }
}

async function cargarSubseriesParaModalTipo(idSerie) {
    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries`);
        const data = await response.json();
        
        if (data.exito) {
            const select = document.getElementById('tipo-subserie-parent');
            select.innerHTML = '<option value="">Selecciona una subserie...</option>' +
                data.datos.map(s => `<option value="${s.id_subserie}">${s.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando subseries:', error);
    }
}

// ============================================
// ARCHIVOS
// ============================================

async function cargarArchivos(idTipo) {
    if (!idTipo) {
        document.getElementById('archivos-table').innerHTML = 
            '<tr class="loading"><td colspan="5">Selecciona un tipo</td></tr>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series/${currentSerie}/subseries/${currentSubserie}/tipos/${idTipo}/archivos`);
        const data = await response.json();

        if (data.exito) {
            mostrarArchivos(data.datos);
        } else {
            mostrarError(data.error || 'Error cargando archivos');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function mostrarArchivos(archivos) {
    const tbody = document.getElementById('archivos-table');

    if (archivos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No hay archivos en este tipo</td></tr>';
        return;
    }

    tbody.innerHTML = archivos.map(archivo => `
        <tr>
            <td><strong>${archivo.nombre_original}</strong></td>
            <td>${formatearTamano(archivo.tamano_bytes)}</td>
            <td>
                <span class="badge badge-${archivo.estado}">${archivo.estado}</span>
            </td>
            <td>${formatearFecha(archivo.creado_en)}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="descargarArchivo(${archivo.id_archivo})">
                    ⬇️
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarArchivo(${currentSerie}, ${currentSubserie}, ${currentTipo}, ${archivo.id_archivo})">
                    X
                </button>
            </td>
        </tr>
    `).join('');
}

// Cargar subseries para la sección de archivos
async function cargarSubseriesArchivos(idSerie) {
    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries`);
        const data = await response.json();

        if (data.exito) {
            const select = document.getElementById('filter-archivo-subserie');
            select.innerHTML = '<option value="">Selecciona una subserie...</option>' +
                data.datos.map(s => `<option value="${s.id_subserie}">${s.nombre}</option>`).join('');
            
            // Limpiar dropdown de tipos
            document.getElementById('filter-tipo').innerHTML = '<option value="">Selecciona un tipo...</option>';
        }
    } catch (error) {
        console.error('Error cargando subseries para archivos:', error);
    }
}

// Cargar tipos para la sección de archivos
async function cargarTiposArchivos(idSerie, idSubserie) {
    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos`);
        const data = await response.json();

        if (data.exito) {
            const select = document.getElementById('filter-tipo');
            select.innerHTML = '<option value="">Selecciona un tipo...</option>' +
                data.datos.map(t => `<option value="${t.id_tipo}">${t.codigo ? t.codigo + ' - ' : ''}${t.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando tipos para archivos:', error);
    }
}

function mostrarNombreArchivo(file) {
    const span = document.getElementById('filename-display');
    if (file) {
        span.textContent = `✓ ${file.name} (${formatearTamano(file.size)})`;
    }
}

async function guardarArchivo() {
    const idTipo = document.getElementById('archivo-tipo-parent').value;
    const estado = document.getElementById('archivo-estado').value;
    const file = document.getElementById('archivo-file').files[0];

    if (!idTipo || !file) {
        mostrarError('Selecciona un tipo y un archivo');
        return;
    }

    if (file.type !== 'application/pdf') {
        mostrarError('Solo se aceptan archivos PDF');
        return;
    }

    const formData = new FormData();
    formData.append('archivo', file);

    try {
        const response = await fetch(
            `${API_BASE}/series/${currentSerie}/subseries/${currentSubserie}/tipos/${idTipo}/archivos`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Archivo cargado exitosamente');
            cerrarModal('modal-archivo');
            document.getElementById('archivo-file').value = '';
            document.getElementById('filename-display').textContent = '';
            cargarArchivos(idTipo);
        } else {
            mostrarError(data.error || 'Error cargando archivo');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function descargarArchivo(idArchivo) {
    const urlInfo = `${API_BASE}/series/${currentSerie}/subseries/${currentSubserie}/tipos/${currentTipo}/archivos/${idArchivo}`;
    const urlDescarga = `${API_BASE}/series/${currentSerie}/subseries/${currentSubserie}/tipos/${currentTipo}/archivos/${idArchivo}/descargar`;
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        window.location.href = '/login.html';
        return;
    }

    // Primero obtener información del archivo
    fetch(urlInfo, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al obtener información del archivo');
        return response.json();
    })
    .then(data => {
        const nombreArchivo = data.datos?.nombre_original || `archivo_${idArchivo}.pdf`;
        
        // Luego descargar el archivo
        return fetch(urlDescarga, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Error al descargar');
            return response.blob().then(blob => ({ blob, nombreArchivo }));
        });
    })
    .then(({ blob, nombreArchivo }) => {
        const link = document.createElement('a');
        const urlBlob = window.URL.createObjectURL(blob);
        link.href = urlBlob;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);
    })
    .catch(error => {
        console.error('Error al descargar:', error);
        alert('Error al descargar el archivo');
    });
}

async function eliminarArchivo(idSerie, idSubserie, idTipo, idArchivo) {
    if (!confirm('¿Desactivar este archivo?')) return;

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos/${idTipo}/archivos/${idArchivo}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Archivo desactivado');
            cargarArchivos(idTipo);
        } else {
            mostrarError(data.error || 'Error desactivando archivo');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function abrirModalArchivoCargar() {
    const tipoSeleccionado = document.getElementById('filter-tipo').value;
    const selectModal = document.getElementById('archivo-tipo-parent');
    
    if (tipoSeleccionado) {
        // Hay un tipo seleccionado en la sección de Archivos
        // Copiar el HTML completo del dropdown para mantener todas las opciones
        selectModal.innerHTML = document.getElementById('filter-tipo').innerHTML;
        selectModal.value = tipoSeleccionado;
    } else if (currentTipo) {
        // Fallback: usar currentTipo si estaba establecido
        selectModal.innerHTML = `<option value="${currentTipo}">Tipo Actual</option>`;
        selectModal.value = currentTipo;
    } else {
        // No hay tipo seleccionado
        mostrarError('Por favor selecciona una serie, subserie y tipo primero');
        return;
    }
    
    // Limpiar archivo previo
    document.getElementById('archivo-file').value = '';
    document.getElementById('filename-display').textContent = '';
    
    document.getElementById('modal-archivo').classList.add('active');
}
async function cargarTiposParaModal() {
    try {
        const selectArchivos = document.getElementById('filter-tipo');
        const selectModal = document.getElementById('archivo-tipo-parent');
        
        // Copiar las opciones del dropdown de archivos al modal
        if (selectArchivos && selectArchivos.children.length > 1) {
            selectModal.innerHTML = selectArchivos.innerHTML;
        } else {
            selectModal.innerHTML = '<option value="">No hay tipos disponibles</option>';
        }
    } catch (error) {
        console.error('Error cargando tipos para el modal:', error);
    }
}

// ============================================
// BÚSQUEDA
// ============================================

async function realizarBusqueda() {
    const nombre = document.getElementById('search-nombre').value;
    const estado = document.getElementById('search-estado').value;
    const fechaInicio = document.getElementById('search-fecha-inicio').value;
    const fechaFin = document.getElementById('search-fecha-fin').value;

    let url = `${API_BASE}/archivos/buscar?`;
    if (nombre) url += `nombre=${nombre}&`;
    if (estado) url += `estado=${estado}&`;
    if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
    if (fechaFin) url += `fechaFin=${fechaFin}&`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.exito) {
            mostrarResultadosBusqueda(data.datos);
        } else {
            mostrarError(data.error || 'Error en búsqueda');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function mostrarResultadosBusqueda(archivos) {
    const tbody = document.getElementById('search-results');

    if (archivos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No se encontraron resultados</td></tr>';
        return;
    }

    tbody.innerHTML = archivos.map(archivo => `
        <tr>
            <td><strong>${archivo.nombre_original}</strong></td>
            <td>
                <span class="badge badge-${archivo.estado}">${archivo.estado}</span>
            </td>
            <td>${formatearTamano(archivo.tamano_bytes)}</td>
            <td>${formatearFecha(archivo.creado_en)}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="descargarArchivo(${archivo.id_archivo})">
                    ⬇️
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// ESTADÍSTICAS
// ============================================

async function actualizarEstadisticas() {
    try {
        const response = await fetch(`${API_BASE}/archivos/estadisticas`);
        const data = await response.json();

        if (data.exito) {
            const stats = data.datos;
            document.getElementById('stat-total').textContent = stats.total_archivos;
            document.getElementById('stat-storage').textContent = stats.tamano_total_mb.toFixed(2) + ' MB';
            document.getElementById('stat-digital').textContent = stats.por_estado.digital || 0;
            document.getElementById('stat-fisico').textContent = stats.por_estado.fisico || 0;
            document.getElementById('stat-hibrido').textContent = stats.por_estado.hibrido || 0;
            document.getElementById('stat-promedio').textContent = stats.tamano_promedio_mb.toFixed(2) + ' MB';

            mostrarGraficoDistribucion(stats.por_estado);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function mostrarGraficoDistribucion(porEstado) {
    const chart = document.getElementById('distribusion-chart');
    const total = (porEstado.digital || 0) + (porEstado.fisico || 0) + (porEstado.hibrido || 0);

    if (total === 0) {
        chart.innerHTML = '<p class="loading">Sin datos</p>';
        return;
    }

    const alturaTotal = 200;
    const alturaDigital = (porEstado.digital / total) * alturaTotal;
    const alturaFisico = (porEstado.fisico / total) * alturaTotal;
    const alturaHibrido = (porEstado.hibrido / total) * alturaTotal;

    chart.innerHTML = `
        <div style="display: flex; gap: 16px; align-items: flex-end; height: 250px;">
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="height: ${alturaDigital}px; background: linear-gradient(135deg, #2596be, #1d7a9c); width: 100%; border-radius: 8px 8px 0 0;"></div>
                <div style="margin-top: 16px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: #2596be;">${porEstado.digital || 0}</div>
                    <div style="font-size: 12px; color: #6B7280;">Digital</div>
                </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="height: ${alturaFisico}px; background: linear-gradient(135deg, #F59E0B, #D97706); width: 100%; border-radius: 8px 8px 0 0;"></div>
                <div style="margin-top: 16px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: #F59E0B;">${porEstado.fisico || 0}</div>
                    <div style="font-size: 12px; color: #6B7280;">Físico</div>
                </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="height: ${alturaHibrido}px; background: linear-gradient(135deg, #2596be, #1d7a9c); width: 100%; border-radius: 8px 8px 0 0;"></div>
                <div style="margin-top: 16px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: #2596be;">${porEstado.hibrido || 0}</div>
                    <div style="font-size: 12px; color: #6B7280;">Híbrido</div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// MODALES
// ============================================

function abrirModal(id) {
    document.getElementById(id).classList.add('active');
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============================================
// UTILIDADES
// ============================================

function limpiarFormulario(modalId) {
    document.querySelectorAll(`#${modalId} .form-input`).forEach(input => {
        input.value = '';
    });
}

function formatearTamano(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function mostrarError(mensaje) {
    const toast = document.getElementById('toast');
    toast.textContent = '❌ ' + mensaje;
    toast.className = 'toast error show';
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function mostrarExito(mensaje) {
    const toast = document.getElementById('toast');
    toast.textContent = '✓ ' + mensaje;
    toast.className = 'toast success show';
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function mostrarEstadoOffline() {
    document.getElementById('status').textContent = '● Desconectado';
    document.getElementById('status').className = 'status-badge offline';
}

function mostrarEstadoOnline() {
    document.getElementById('status').textContent = '● Conectado';
    document.getElementById('status').className = 'status-badge online';
}

async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/series`);
        if (response.ok) {
            mostrarEstadoOnline();
        } else {
            mostrarEstadoOffline();
        }
    } catch (error) {
        mostrarEstadoOffline();
    }

    // Verificar conexión cada 30 segundos
    setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/series`);
            if (response.ok) {
                mostrarEstadoOnline();
            } else {
                mostrarEstadoOffline();
            }
        } catch (error) {
            mostrarEstadoOffline();
        }
    }, 30000);
}

function refrescarDatos() {
    actualizarEstadisticas();
    cargarSeries();
    mostrarExito('Datos refrescados');
}

function limpiarCache() {
    localStorage.clear();
    sessionStorage.clear();
    mostrarExito('Cache limpiado');
}
