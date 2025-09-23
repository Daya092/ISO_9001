// Variables globales del dashboard
let dashboardData = null;
let progressChart = null;
let statusChart = null;

// Inicialización del dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Inicializar dashboard
async function initializeDashboard() {
    // Verificar sesión
    const hasSession = await checkSessionStatus();
    if (!hasSession) return;

    // Cargar información de la empresa
    await loadEmpresaInfo();
    
    // Cargar datos del dashboard
    await loadDashboardData();
    
    // Mostrar sección de desarrollo por defecto
    showSection('desarrollo');
}

// Cargar información de la empresa
async function loadEmpresaInfo() {
    try {
        const response = await fetch('/inicio/empresa');
        const data = await response.json();
        
        if (data.empresa) {
            document.getElementById('empresa-info').textContent = 
                `${data.empresa.razon_social} (${data.empresa.nit})`;
        }
    } catch (error) {
        console.error('Error al cargar información de empresa:', error);
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        const response = await fetch('/desarrollo/dashboard');
        const data = await response.json();
        
        if (data.empresa) {
            dashboardData = data;
            updateDashboardStats(data.estadisticas);
            await loadPendientes();
            await loadHistorial();
            initializeCharts(data.estadisticas);
        }
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showAlert('Error al cargar los datos del dashboard', 'danger');
    }
}

// Actualizar estadísticas del dashboard
function updateDashboardStats(stats) {
    // Porcentaje general
    document.getElementById('porcentaje-general').textContent = `${stats.general.porcentaje}%`;
    
    // Documentos
    document.getElementById('documentos-completados').textContent = stats.documentos.completados;
    document.getElementById('progress-docs').style.width = `${stats.documentos.porcentaje}%`;
    document.getElementById('docs-text').textContent = 
        `${stats.documentos.completados} de ${stats.documentos.total} completados`;
    
    // Videos
    document.getElementById('videos-vistos').textContent = stats.videos.vistos;
    document.getElementById('progress-videos').style.width = `${stats.videos.porcentaje}%`;
    document.getElementById('videos-text').textContent = 
        `${stats.videos.vistos} de ${stats.videos.total} vistos`;
    
    // Auditoría
    document.getElementById('auditorias-completadas').textContent = stats.auditoria.cumplidos;
    document.getElementById('progress-audit').style.width = `${stats.auditoria.porcentaje}%`;
    document.getElementById('audit-text').textContent = 
        `${stats.auditoria.cumplidos} de ${stats.auditoria.total_items} completados`;
}

// Cargar pendientes
async function loadPendientes() {
    try {
        const response = await fetch('/desarrollo/pendientes');
        const data = await response.json();
        
        const container = document.getElementById('pendientes-content');
        container.innerHTML = '';
        
        if (data.documentos.length === 0 && data.videos.length === 0 && data.auditoria.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-check-circle fa-3x mb-3 text-success"></i>
                    <h5>¡Excelente!</h5>
                    <p>No tienes tareas pendientes en este momento.</p>
                </div>
            `;
            return;
        }
        
        // Documentos pendientes
        data.documentos.forEach(doc => {
            const item = document.createElement('div');
            item.className = 'pendiente-item';
            item.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <span>Subir documento: <strong>${doc.nombre}</strong></span>
            `;
            container.appendChild(item);
        });
        
        // Videos pendientes
        data.videos.forEach(video => {
            const item = document.createElement('div');
            item.className = 'pendiente-item';
            item.innerHTML = `
                <i class="fas fa-play-circle"></i>
                <span>Ver video: <strong>${video.nombre}</strong></span>
            `;
            container.appendChild(item);
        });
        
        // Auditorías pendientes
        data.auditoria.forEach(audit => {
            const item = document.createElement('div');
            item.className = 'pendiente-item';
            item.innerHTML = `
                <i class="fas fa-clipboard-check"></i>
                <span>Completar: <strong>${audit.clausula} - ${audit.descripcion}</strong></span>
            `;
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error al cargar pendientes:', error);
        document.getElementById('pendientes-content').innerHTML = 
            '<div class="alert alert-danger">Error al cargar las tareas pendientes</div>';
    }
}

// Cargar historial
async function loadHistorial() {
    try {
        const response = await fetch('/desarrollo/historial');
        const data = await response.json();
        
        const container = document.getElementById('historial-content');
        container.innerHTML = '';
        
        if (data.historial.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-history fa-3x mb-3"></i>
                    <h5>Sin historial</h5>
                    <p>Aún no hay actividades registradas.</p>
                </div>
            `;
            return;
        }
        
        data.historial.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'historial-item';
            
            let icon = '';
            let text = '';
            let date = '';
            
            switch (item.tipo) {
                case 'documento':
                    icon = 'fas fa-file-upload';
                    text = `Documento subido: <strong>${item.nombre}</strong>`;
                    date = getTimeAgo(item.fecha_subida);
                    break;
                case 'video':
                    icon = 'fas fa-play';
                    text = `Video visto: <strong>${item.nombre}</strong>`;
                    date = getTimeAgo(item.fecha_visto);
                    break;
                case 'auditoria':
                    icon = 'fas fa-clipboard-check';
                    text = `Auditoría realizada`;
                    date = formatDate(item.fecha_auditoria);
                    break;
            }
            
            historyItem.innerHTML = `
                <i class="${icon}"></i>
                <span>${text}</span>
                <span class="historial-fecha">${date}</span>
            `;
            container.appendChild(historyItem);
        });
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
        document.getElementById('historial-content').innerHTML = 
            '<div class="alert alert-danger">Error al cargar el historial</div>';
    }
}

// Inicializar gráficas
function initializeCharts(stats) {
    // Gráfica de progreso
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            labels: ['Documentos', 'Videos', 'Auditoría'],
            datasets: [{
                data: [stats.documentos.porcentaje, stats.videos.porcentaje, stats.auditoria.porcentaje],
                backgroundColor: ['#0d6efd', '#17a2b8', '#ffc107'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfica de estado
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'bar',
        data: {
            labels: ['Completado', 'Pendiente'],
            datasets: [{
                label: 'Estado General',
                data: [
                    stats.general.porcentaje,
                    100 - stats.general.porcentaje
                ],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Mostrar sección específica
function showSection(section) {
    // Ocultar todas las secciones
    document.getElementById('desarrollo-section').style.display = 'none';
    document.getElementById('capacitacion-section').style.display = 'none';
    document.getElementById('auditoria-section').style.display = 'none';
    
    // Remover clase active de todos los enlaces
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // Activar enlace correspondiente
    document.querySelector(`[onclick="showSection('${section}')"]`).classList.add('active');
    
    // Cargar contenido específico de la sección
    switch (section) {
        case 'capacitacion':
            loadCapacitacion();
            break;
        case 'auditoria':
            loadAuditorias();
            break;
    }
}

// Cargar contenido de capacitación
async function loadCapacitacion() {
    try {
        const response = await fetch('/capacitacion/documentos');
        const data = await response.json();
        
        const container = document.getElementById('capacitacion-content');
        container.innerHTML = '';
        
        if (data.documentos.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-graduation-cap fa-3x mb-3"></i>
                    <h5>Sin documentos</h5>
                    <p>No hay documentos de capacitación disponibles.</p>
                </div>
            `;
            return;
        }
        
        data.documentos.forEach(doc => {
            const docCard = document.createElement('div');
            docCard.className = 'documento-card';
            // Estado del video (visto: 1, no visto: 0)
            const visto = doc.visto === 1;
            docCard.innerHTML = `
                <div class="documento-header">
                    <h5 class="documento-title">${doc.nombre}</h5>
                    <span class="estado-badge ${doc.estado === 'completado' ? 'estado-completado' : 'estado-pendiente'}">
                        ${doc.estado === 'completado' ? 'Completado' : 'Pendiente'}
                    </span>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="descargarPlantilla(${doc.id})">
                                <i class="fas fa-download me-2"></i>
                                Descargar Plantilla
                            </button>
                            <button class="btn btn-success" onclick="subirDocumento(${doc.id})">
                                <i class="fas fa-upload me-2"></i>
                                Subir Documento
                            </button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="video-container">
                            <iframe src="${doc.video_url}" frameborder="0" allowfullscreen></iframe>
                        </div>
                        <button class="btn btn-info btn-sm w-100" onclick="marcarVideoVisto(${doc.id}, empresaId)">
                            <i class="fas fa-check me-2"></i>
                            ${visto ? 'Desmarcar Video como Visto' : 'Marcar Video como Visto'}
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(docCard);
        });
        
    } catch (error) {
        console.error('Error al cargar capacitación:', error);
        document.getElementById('capacitacion-content').innerHTML = 
            '<div class="alert alert-danger">Error al cargar los documentos de capacitación</div>';
    }
}

// Cargar auditorías
async function loadAuditorias() {
    try {
        const response = await fetch('/auditoria/auditorias');
        const data = await response.json();
        
        const container = document.getElementById('auditoria-content');
        container.innerHTML = '';
        
        if (data.auditorias.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-clipboard-check fa-3x mb-3"></i>
                    <h5>Sin auditorías</h5>
                    <p>No hay auditorías registradas. Crea una nueva auditoría para comenzar.</p>
                </div>
            `;
            return;
        }
        
        data.auditorias.forEach(audit => {
            const auditCard = document.createElement('div');
            auditCard.className = 'auditoria-card';
            
            const porcentaje = audit.total_items > 0 
                ? Math.round((audit.items_cumplidos / audit.total_items) * 100) 
                : 0;
            
            auditCard.innerHTML = `
                <div class="auditoria-header">
                    <div>
                        <h5 class="auditoria-fecha">${formatDate(audit.fecha_auditoria)}</h5>
                        <small class="text-muted">Creada: ${getTimeAgo(audit.fecha_creacion)}</small>
                    </div>
                    <div class="auditoria-progreso">
                        <span class="badge bg-primary">${porcentaje}%</span>
                        <div class="progress" style="width: 100px; height: 8px;">
                            <div class="progress-bar" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                </div>
                
                <p class="mb-3">
                    <strong>${audit.items_cumplidos}</strong> de <strong>${audit.total_items}</strong> ítems cumplidos
                </p>
                
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="verChecklist(${audit.id})">
                        <i class="fas fa-eye me-1"></i>
                        Ver Checklist
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarAuditoria(${audit.id})">
                        <i class="fas fa-trash me-1"></i>
                        Eliminar
                    </button>
                </div>
            `;
            container.appendChild(auditCard);
        });
        
    } catch (error) {
        console.error('Error al cargar auditorías:', error);
        document.getElementById('auditoria-content').innerHTML = 
            '<div class="alert alert-danger">Error al cargar las auditorías</div>';
    }
}

// Funciones de capacitación
async function descargarPlantilla(documentoId) {
    try {
        const response = await fetch(`/capacitacion/descargar/${documentoId}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plantilla_${documentoId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            showAlert('No se pudo descargar la plantilla', 'warning');
        }
    } catch (error) {
        console.error('Error al descargar plantilla:', error);
        showAlert('Error al descargar la plantilla', 'danger');
    }
}

function subirDocumento(documentoId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.pdf,.doc,.docx';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('archivo', file);
        
        try {
            const response = await fetch(`/capacitacion/subir/${documentoId}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Documento subido exitosamente', 'success');
                // Actualizar dashboard y gráficas forzosamente
                const responseDashboard = await fetch('/desarrollo/dashboard');
                const dataDashboard = await responseDashboard.json();
                if (dataDashboard.empresa) {
                    dashboardData = dataDashboard;
                    updateDashboardStats(dataDashboard.estadisticas);
                    initializeCharts(dataDashboard.estadisticas);
                }
            } else {
                showAlert(data.error || 'Error al subir documento', 'danger');
            }
        } catch (error) {
            console.error('Error al subir documento:', error);
            showAlert('Error al subir el documento', 'danger');
        }
    };
    
    input.click();
}

async function marcarVideoVisto(documentoId) {
    try {
        // Obtener empresaId si no se pasa
        let eid = arguments.length > 1 ? arguments[1] : (typeof empresaId !== 'undefined' ? empresaId : null);
        if (!eid) {
            showAlert('No se pudo obtener la empresa', 'danger');
            return;
        }
        const response = await fetch(`/capacitacion/video-visto/${documentoId}/${eid}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            showAlert(data.message, 'success');
            window.location.reload();
        } else {
            showAlert(data.error || 'Error al marcar/desmarcar video', 'danger');
        }
    } catch (error) {
        console.error('Error al marcar video:', error);
        showAlert('Error al marcar el video', 'danger');
    }
}

// Funciones de auditoría
function showNuevaAuditoria() {
    const modal = new bootstrap.Modal(document.getElementById('nuevaAuditoriaModal'));
    document.getElementById('fecha_auditoria').value = new Date().toISOString().split('T')[0];
    modal.show();
}

async function crearAuditoria() {
    const fecha = document.getElementById('fecha_auditoria').value;
    
    if (!fecha) {
        showAlert('Por favor, seleccione una fecha', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/auditoria/nueva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fecha_auditoria: fecha })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Auditoría creada exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('nuevaAuditoriaModal')).hide();
            window.location.reload();
        } else {
            showAlert(data.error || 'Error al crear auditoría', 'danger');
        }
    } catch (error) {
        console.error('Error al crear auditoría:', error);
        showAlert('Error al crear la auditoría', 'danger');
    }
}

async function verChecklist(auditoriaId) {
    // Implementar vista de checklist
    showAlert('Función de checklist en desarrollo', 'info');
}

async function eliminarAuditoria(auditoriaId) {
    if (!confirm('¿Está seguro que desea eliminar esta auditoría?')) {
        return;
    }
    
    try {
        const response = await fetch(`/auditoria/auditoria/${auditoriaId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Auditoría eliminada exitosamente', 'success');
            window.location.reload();
        } else {
            showAlert(data.error || 'Error al eliminar auditoría', 'danger');
        }
    } catch (error) {
        console.error('Error al eliminar auditoría:', error);
        showAlert('Error al eliminar la auditoría', 'danger');
    }
}

// Funciones de utilidad
function refreshDashboard() {
    loadDashboardData();
}

function refreshCapacitacion() {
    loadCapacitacion();
}

function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertContainer.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.remove();
        }
    }, 5000);
}
