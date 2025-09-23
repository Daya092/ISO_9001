# Herramienta ISO 9001

Una herramienta web sencilla para el manejo y seguimiento de la norma ISO 9001, desarrollada con Node.js, Express y SQLite.

## 🚀 Características

- **Registro de Empresa**: Formulario completo para registrar los datos de la empresa
- **Dashboard de Progreso**: Panel visual con estadísticas de avance en tiempo real
- **Módulo de Capacitación**: Gestión de documentos y videos de capacitación
- **Módulo de Auditoría**: Checklist completo de las cláusulas 4 a 10.3 de ISO 9001
- **Interfaz Responsiva**: Diseño moderno con Bootstrap 5

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Iconos**: Font Awesome 6
- **Gráficas**: Chart.js

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- npm (Node Package Manager)

## 🔧 Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd ISO_9001
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```

4. **Acceder a la aplicación**
   - Abrir el navegador en: `http://localhost:3000`

## 📁 Estructura del Proyecto

```
ISO_9001/
│
├── package.json          # Configuración del proyecto y dependencias
├── server.js             # Servidor principal de Express
├── database.js           # Configuración y esquema de SQLite
│
├── inicio.js             # Módulo de inicio de sesión
├── registro.js           # Módulo de registro de empresa
├── desarrollo.js         # Módulo de dashboard/progreso
├── capacitacion.js       # Módulo de capacitación
├── auditoria.js          # Módulo de auditoría
│
└── public/               # Archivos estáticos
    ├── css/
    │   └── style.css     # Estilos personalizados
    ├── js/
    │   ├── main.js       # JavaScript principal
    │   └── dashboard.js  # JavaScript del dashboard
    ├── img/              # Imágenes
    ├── uploads/          # Archivos subidos por usuarios
    ├── templates/        # Plantillas de documentos
    ├── index.html        # Página de inicio
    └── dashboard.html    # Dashboard principal
```

## 📦 Dependencias

- **express**: Framework para crear el servidor web y gestionar rutas HTTP.
- **multer**: Middleware para manejo de archivos (subidas) en Express.
- **path**: Utilidad para trabajar con rutas de archivos y directorios.
- **sqlite3**: Motor de base de datos ligero y embebido.
- **nodemon** (desarrollo): Reinicia automáticamente el servidor al detectar cambios en el código.

### Instalación rápida de dependencias

```bash
npm install express multer path sqlite3 && npm install --save-dev nodemon
```

## 🎯 Funcionalidades Principales

### 1. Registro e Inicio de Sesión
- Registro único de empresa con datos completos
- Inicio de sesión por NIT
- Validación de formularios en tiempo real

### 2. Dashboard de Progreso
- **Estadísticas Generales**: Porcentaje de avance general
- **Documentos**: Progreso de documentos subidos
- **Videos**: Progreso de videos vistos
- **Auditoría**: Progreso del checklist de auditoría
- **Pendientes**: Lista de tareas por completar
- **Historial**: Línea de tiempo de actividades
- **Gráficas**: Visualización de datos con Chart.js

### 3. Módulo de Capacitación
- Lista de documentos de capacitación
- Descarga de plantillas Excel
- Subida de documentos completados
- Videos de YouTube incrustados
- Marcado de videos como vistos
- Estados visuales (pendiente/completado)

### 4. Módulo de Auditoría
- Checklist completo de cláusulas ISO 9001 (4.1 a 10.3)
- Creación de múltiples auditorías
- Marcado de cumplimiento (Cumple/No cumple)
- Campo de observaciones
- Historial de auditorías
- Estadísticas de cumplimiento

## 🗄️ Base de Datos

La aplicación utiliza SQLite con las siguientes tablas principales:

- **empresas**: Datos de la empresa registrada
- **documentos_capacitacion**: Documentos y su estado
- **videos_vistos**: Registro de videos visualizados
- **auditorias**: Auditorías realizadas
- **checklist_auditoria**: Items del checklist por auditoría

## 🚀 Uso de la Aplicación

### Primer Uso
1. Acceder a `http://localhost:3000`
2. Hacer clic en "Registrar Empresa"
3. Completar el formulario con los datos de la empresa
4. Una vez registrado, se redirige automáticamente al dashboard

### Uso Diario
1. Acceder a `http://localhost:3000`
2. Hacer clic en "Iniciar Sesión"
3. Ingresar el NIT de la empresa
4. Navegar por los módulos usando el menú lateral

## 📊 Módulos Disponibles

### Desarrollo (Dashboard)
- Ver progreso general
- Revisar tareas pendientes
- Consultar historial de actividades
- Visualizar gráficas de estado

### Capacitación
- Descargar plantillas de documentos
- Subir documentos completados
- Ver videos de capacitación
- Marcar videos como vistos

### Auditoría
- Crear nuevas auditorías
- Completar checklist de cláusulas
- Agregar observaciones
- Ver historial de auditorías

## 🔧 Configuración Adicional

### Personalización de Videos
Los enlaces de YouTube se pueden modificar en el archivo `database.js` en la función `insertDefaultDocuments()`.

### Plantillas de Documentos
Las plantillas se almacenan en la carpeta `public/templates/` y se pueden agregar nuevos documentos modificando la base de datos.

### Cláusulas de Auditoría
Las cláusulas del checklist se definen en `database.js` en la función `insertDefaultChecklist()`.

## 🐛 Solución de Problemas

### Error de Puerto en Uso
Si el puerto 3000 está ocupado, modificar la variable `PORT` en `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Cambiar a otro puerto
```

### Error de Base de Datos
Si hay problemas con la base de datos, eliminar el archivo `iso9001.db` y reiniciar la aplicación.

### Problemas de Archivos
Asegurarse de que las carpetas `public/uploads/` y `public/templates/` tengan permisos de escritura.

## 📝 Notas de Desarrollo

- La aplicación está diseñada para una sola empresa (no multiusuario)
- Los archivos se almacenan localmente en la carpeta `public/uploads/`
- La base de datos SQLite se crea automáticamente al iniciar
- No se requiere configuración adicional de base de datos

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear una rama para la nueva funcionalidad
3. Realizar los cambios
4. Enviar un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al desarrollador.

---

**Desarrollado con ❤️ para facilitar la gestión de la norma ISO 9001**
