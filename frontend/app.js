/**
 * Frontend TRD SGDEA
 * Sistema de Gestión Documental - Interfaz de Usuario
 * 
 * API BASE: http://localhost:3000/api/trd
 */

// ============================================
// CONFIGURACIÓN
// ============================================

const API_BASE = 'http://localhost:3000/api/trd';
let currentSerie = null;
let currentSubserie = null;
let currentTipo = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkConnection();
});

function initializeApp() {
    cargarSeries();
    actualizarEstadisticas();
}

function setupEventListeners() {
    // Navegación sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            cambiarSeccion(section);
        });
    });

    // Filtros
    document.getElementById('filter-serie').addEventListener('change', (e) => {
        currentSerie = e.target.value;
        if (currentSerie) cargarSubseries(currentSerie);
    });

    document.getElementById('filter-subserie').addEventListener('change', (e) => {
        currentSubserie = e.target.value;
        if (currentSubserie) cargarTipos(currentSubserie);
    });

    document.getElementById('filter-tipo').addEventListener('change', (e) => {
        currentTipo = e.target.value;
        if (currentTipo) cargarArchivos(currentTipo);
    });

    // Búsqueda quick
    document.getElementById('buscar-series').addEventListener('input', (e) => {
        filtrarSeries(e.target.value);
    });

    // Carga de archivos
    const fileInput = document.getElementById('archivo-file');
    const uploadLabel = document.querySelector('.upload-label');

    uploadLabel.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => mostrarNombreArchivo(e.target.files[0]));

    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.style.backgroundColor = '#3B82F6';
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

    // Cargar datos según la sección
    if (section === 'tipos') {
        console.log('📋 Cargando subseries para sección de tipos...');
        cargarTodasLasSubseries();
    }
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
    const codigo = document.getElementById('serie-codigo').value;
    const nombre = document.getElementById('serie-nombre').value;
    const descripcion = document.getElementById('serie-descripcion').value;
    const años = document.getElementById('serie-anos').value;

    if (!codigo || !nombre || !años) {
        mostrarError('Completa los campos requeridos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo,
                nombre,
                descripcion,
                años_retencion: parseInt(años)
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
        mostrarError('Error de conexión');
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
    const select = document.getElementById('subserie-serie-parent');
    select.innerHTML = '<option value="">Selecciona una serie...</option>' +
        series.map(s => `<option value="${s.id_serie}">${s.nombre}</option>`).join('');
}

function verDetallesSerie(id) {
    const serie = document.querySelector(`#series-table [data-id="${id}"]`);
    mostrarExito(`Serie #${id} seleccionada`);
}

function abrirModalSerie() {
    document.getElementById('modal-serie').classList.add('active');
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
                <span class="badge badge-active">0</span>
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
    const select = document.getElementById('tipo-subserie-parent');
    select.innerHTML = '<option value="">Selecciona una subserie...</option>' +
        subseries.map(s => `<option value="${s.id_subserie}">${s.nombre}</option>`).join('');
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

// ============================================
// TIPOS DOCUMENTALES
// ============================================

async function cargarTodasLasSubseries() {
    try {
        console.log('🔍 Cargando todas las subseries...');
        
        // Primero, obtener series
        const seriesResponse = await fetch(`${API_BASE}/series`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!seriesResponse.ok) {
            console.error('❌ Error obteniendo series:', seriesResponse.statusText, seriesResponse.status);
            mostrarError(`Error: ${seriesResponse.statusText}`);
            return;
        }

        const seriesData = await seriesResponse.json();
        console.log('📊 Datos de series:', seriesData);

        if (!seriesData.exito) {
            console.error('❌ Error en respuesta de series:', seriesData);
            mostrarError(seriesData.error || 'Error obteniendo series');
            return;
        }

        if (!seriesData.datos || seriesData.datos.length === 0) {
            console.warn('⚠️ No hay series disponibles');
            return;
        }

        let todasLasSubseries = [];
        const totalSeries = seriesData.datos.length;
        let procesadas = 0;

        // Obtener subseries de cada serie en paralelo
        const promesasSubseries = seriesData.datos.map(async (serie) => {
            try {
                console.log(`📂 Obteniendo subseries de serie ${serie.id_serie} (${serie.nombre})...`);
                
                const respSub = await fetch(`${API_BASE}/series/${serie.id_serie}/subseries`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!respSub.ok) {
                    console.warn(`⚠️ Error en serie ${serie.id_serie}: ${respSub.statusText}`);
                    return [];
                }

                const dataSub = await respSub.json();
                console.log(`✓ Respuesta subseries (${serie.id_serie}):`, dataSub);

                procesadas++;
                console.log(`📊 Progreso: ${procesadas}/${totalSeries}`);

                if (dataSub.exito && Array.isArray(dataSub.datos)) {
                    return dataSub.datos;
                }
                return [];
            } catch (error) {
                console.error(`💥 Error procesando serie ${serie.id_serie}:`, error);
                return [];
            }
        });

        // Aguardar todas las promesas en paralelo
        const resultados = await Promise.all(promesasSubseries);
        
        // Concatenar todas las subseries
        todasLasSubseries = resultados.flat();
        
        console.log('✅ Total subseries recolectadas:', todasLasSubseries.length, todasLasSubseries);

        // Llenar dropdown de filtro
        const select = document.getElementById('filter-subserie');
        if (select) {
            if (todasLasSubseries.length === 0) {
                select.innerHTML = '<option value="">No hay subseries disponibles</option>';
            } else {
                select.innerHTML = '<option value="">Selecciona una subserie...</option>' +
                    todasLasSubseries.map(s => `<option value="${s.id_subserie}">${s.nombre}</option>`).join('');
            }
            console.log('✓ Dropdown principal actualizado');
        } else {
            console.error('❌ No encontré elemento #filter-subserie');
        }

        // Llenar dropdown del modal
        const selectModal = document.getElementById('tipo-subserie-parent');
        if (selectModal) {
            if (todasLasSubseries.length === 0) {
                selectModal.innerHTML = '<option value="">No hay subseries disponibles</option>';
            } else {
                selectModal.innerHTML = '<option value="">Selecciona una subserie...</option>' +
                    todasLasSubseries.map(s => `<option value="${s.id_subserie}">${s.nombre}</option>`).join('');
            }
            console.log('✓ Dropdown del modal actualizado');
        }

        if (todasLasSubseries.length === 0) {
            console.warn('⚠️ No se encontraron subseries');
            mostrarError('No hay subseries disponibles. Crea subseries primero.');
        }

    } catch (error) {
        console.error('💥 Error en cargarTodasLasSubseries:', error);
        console.error('Stack:', error.stack);
        mostrarError('Error de conexión: ' + error.message);
    }
}

async function cargarTipos(idSubserie) {
    if (!idSubserie) {
        document.getElementById('tipos-table').innerHTML = 
            '<tr class="loading"><td colspan="6">Selecciona una subserie</td></tr>';
        return;
    }

    try {
        // Si no tenemos currentSerie, primero obtenemos la subserie para conseguir su serie padre
        if (!currentSerie) {
            const subserieResponse = await fetch(`${API_BASE}/series/0/subseries/${idSubserie}`);
            
            // Intentamos obtener la subserie desde todas las series
            let serieId = null;
            const seriesResponse = await fetch(`${API_BASE}/series`);
            const seriesData = await seriesResponse.json();
            
            if (seriesData.exito) {
                for (const serie of seriesData.datos) {
                    const subsResponse = await fetch(`${API_BASE}/series/${serie.id_serie}/subseries`);
                    const subsData = await subsResponse.json();
                    if (subsData.exito) {
                        const found = subsData.datos.find(s => s.id_subserie === parseInt(idSubserie));
                        if (found) {
                            serieId = serie.id_serie;
                            currentSerie = serieId;
                            break;
                        }
                    }
                }
            }

            if (!serieId) {
                mostrarError('No se pudo encontrar la serie de esta subserie');
                return;
            }
        }

        const response = await fetch(`${API_BASE}/series/${currentSerie}/subseries/${idSubserie}/tipos`);
        const data = await response.json();

        if (data.exito) {
            mostrarTipos(data.datos);
            actualizarSelectTipos(data.datos);
        } else {
            mostrarError(data.error || 'Error cargando tipos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}
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
            <td><strong>${tipo.codigo || '-'}</strong></td>
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
    const idSubserie = document.getElementById('tipo-subserie-parent').value;
    const codigo = document.getElementById('tipo-codigo').value;
    const nombre = document.getElementById('tipo-nombre').value;
    const descripcion = document.getElementById('tipo-descripcion').value;

    if (!idSubserie || !codigo || !nombre) {
        mostrarError('Completa los campos requeridos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/series/${currentSerie}/subseries/${idSubserie}/tipos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo,
                nombre,
                descripcion,
                idSubserie: parseInt(idSubserie)
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
    if (!confirm('¿Desactivar este tipo?')) return;

    try {
        const response = await fetch(`${API_BASE}/series/${idSerie}/subseries/${idSubserie}/tipos/${idTipo}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.exito) {
            mostrarExito('Tipo desactivado');
            cargarTipos(idSubserie);
        } else {
            mostrarError(data.error || 'Error desactivando tipo');
        }
    } catch (error) {
        mostrarError('Error de conexión');
    }
}

function actualizarSelectTipos(tipos) {
    const select = document.getElementById('archivo-tipo-parent');
    select.innerHTML = '<option value="">Selecciona un tipo...</option>' +
        tipos.map(t => `<option value="${t.id_tipo}">${t.nombre}</option>`).join('');
}

function abrirModalTipo() {
    cargarTodasLasSubseries();
    document.getElementById('modal-tipo').classList.add('active');
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
    const url = `${API_BASE}/series/${currentSerie}/subseries/${currentSubserie}/tipos/${currentTipo}/archivos/${idArchivo}/descargar`;
    window.location.href = url;
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
    cargarTiposParaModal();
    document.getElementById('modal-archivo').classList.add('active');
}

async function cargarTiposParaModal() {
    if (currentSubserie) {
        cargarTipos(currentSubserie);
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
                <div style="height: ${alturaDigital}px; background: linear-gradient(135deg, #10B981, #059669); width: 100%; border-radius: 8px 8px 0 0;"></div>
                <div style="margin-top: 16px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: #10B981;">${porEstado.digital || 0}</div>
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
                <div style="height: ${alturaHibrido}px; background: linear-gradient(135deg, #3B82F6, #2563EB); width: 100%; border-radius: 8px 8px 0 0;"></div>
                <div style="margin-top: 16px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: #3B82F6;">${porEstado.hibrido || 0}</div>
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
