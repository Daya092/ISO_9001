// Variables globales
let currentEmpresa = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkEmpresaStatus();
});

// Verificar si ya existe una empresa registrada
async function checkEmpresaStatus() {
    try {
        const response = await fetch('/registro/check');
        const data = await response.json();
        
        if (data.hasCompany) {
            // Si ya hay una empresa, mostrar solo opción de login
            document.querySelector('button[onclick="showRegisterForm()"]').style.display = 'none';
            showMessage('Ya existe una empresa registrada. Por favor, inicie sesión.', 'info');
        }
    } catch (error) {
        console.error('Error al verificar estado:', error);
    }
}

// Mostrar formulario de registro
function showRegisterForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    clearMessages();
}

// Mostrar formulario de inicio de sesión
function showLoginForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    clearMessages();
}

// Mostrar pantalla de bienvenida
function showWelcome() {
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('welcome-section').style.display = 'block';
    clearMessages();
}

// Manejar registro de empresa
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        razon_social: document.getElementById('razon_social').value,
        nit: document.getElementById('nit').value,
        representante_legal: document.getElementById('representante_legal').value,
        tipo_empresa: document.getElementById('tipo_empresa').value,
        direccion: document.getElementById('direccion').value,
        telefono: document.getElementById('telefono').value,
        numero_empleados: parseInt(document.getElementById('numero_empleados').value),
        email: document.getElementById('email').value,
        web: document.getElementById('web').value
    };

    try {
        const response = await fetch('/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Empresa registrada exitosamente. Redirigiendo al dashboard...', 'success');
            currentEmpresa = data.empresa;
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showMessage(data.error || 'Error al registrar la empresa', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Por favor, intente nuevamente.', 'danger');
    }
});

// Manejar inicio de sesión
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nit = document.getElementById('login_nit').value;

    try {
        const response = await fetch('/inicio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nit })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Inicio de sesión exitoso. Redirigiendo al dashboard...', 'success');
            currentEmpresa = data.empresa;
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showMessage(data.error || 'Error al iniciar sesión', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Por favor, intente nuevamente.', 'danger');
    }
});

// Mostrar mensajes
function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    const alertClass = `alert-${type}`;
    
    container.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Limpiar mensajes
function clearMessages() {
    document.getElementById('message-container').innerHTML = '';
}

// Validaciones del formulario
document.getElementById('nit').addEventListener('input', function(e) {
    // Limpiar caracteres no numéricos excepto guiones
    e.target.value = e.target.value.replace(/[^0-9-]/g, '');
});

document.getElementById('telefono').addEventListener('input', function(e) {
    // Limpiar caracteres no numéricos excepto +, -, espacios y paréntesis
    e.target.value = e.target.value.replace(/[^0-9+\-() ]/g, '');
});

document.getElementById('numero_empleados').addEventListener('input', function(e) {
    // Solo números positivos
    if (e.target.value < 1) {
        e.target.value = 1;
    }
});

// Función para formatear NIT
function formatNIT(nit) {
    // Remover caracteres no numéricos
    const cleanNIT = nit.replace(/[^0-9]/g, '');
    
    // Formatear con guiones si es necesario
    if (cleanNIT.length > 3) {
        return cleanNIT.substring(0, cleanNIT.length - 1) + '-' + cleanNIT.substring(cleanNIT.length - 1);
    }
    
    return cleanNIT;
}

// Función para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función para validar URL
function validateURL(url) {
    if (!url) return true; // URL es opcional
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Validación en tiempo real del formulario
document.getElementById('email').addEventListener('blur', function(e) {
    if (e.target.value && !validateEmail(e.target.value)) {
        e.target.classList.add('is-invalid');
        showFieldError(e.target, 'Por favor, ingrese un email válido');
    } else {
        e.target.classList.remove('is-invalid');
        clearFieldError(e.target);
    }
});

document.getElementById('web').addEventListener('blur', function(e) {
    if (e.target.value && !validateURL(e.target.value)) {
        e.target.classList.add('is-invalid');
        showFieldError(e.target, 'Por favor, ingrese una URL válida');
    } else {
        e.target.classList.remove('is-invalid');
        clearFieldError(e.target);
    }
});

// Mostrar error de campo
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

// Limpiar error de campo
function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Función para limpiar formulario
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Limpiar clases de validación
        const inputs = form.querySelectorAll('.is-invalid');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            clearFieldError(input);
        });
    }
}

// Función para mostrar loading en botones
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando...';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || 'Enviar';
    }
}

// Función para obtener empresa actual
async function getCurrentEmpresa() {
    try {
        const response = await fetch('/inicio/empresa');
        const data = await response.json();
        
        if (data.empresa) {
            currentEmpresa = data.empresa;
            return data.empresa;
        }
        
        return null;
    } catch (error) {
        console.error('Error al obtener empresa:', error);
        return null;
    }
}

// Función para verificar estado de sesión
async function checkSessionStatus() {
    try {
        const response = await fetch('/inicio/status');
        const data = await response.json();
        
        if (!data.hasCompany) {
            // No hay empresa registrada, redirigir al inicio
            window.location.href = '/';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        return false;
    }
}

// Función para logout
function logout() {
    if (confirm('¿Está seguro que desea salir del sistema?')) {
        currentEmpresa = null;
        window.location.href = '/';
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para formatear fechas con hora
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para obtener tiempo transcurrido
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
}
