# 🚀 Instrucciones de Instalación y Uso - Herramienta ISO 9001

## ✅ Instalación Completada

La herramienta ISO 9001 ha sido instalada exitosamente en tu sistema. Aquí tienes las instrucciones para usarla:

## 🎯 Cómo Iniciar la Aplicación

### 1. Iniciar el Servidor
```bash
npm start
```

### 2. Acceder a la Aplicación
- Abrir el navegador web
- Ir a: `http://localhost:3000`

## 📋 Primer Uso

### Paso 1: Registro de Empresa
1. En la pantalla principal, hacer clic en **"Registrar Empresa"**
2. Completar el formulario con los datos de la empresa:
   - Razón Social
   - NIT
   - Representante Legal
   - Tipo de Empresa
   - Dirección
   - Teléfono
   - Número de Empleados
   - E-mail
   - Sitio Web (opcional)
3. Hacer clic en **"Registrar"**

### Paso 2: Acceso al Dashboard
- Una vez registrada la empresa, serás redirigido automáticamente al dashboard
- El dashboard muestra el progreso general de la implementación ISO 9001

## 🎛️ Módulos Disponibles

### 📊 Desarrollo (Dashboard)
- **Progreso General**: Porcentaje de avance en todos los módulos
- **Estadísticas**: Documentos, videos y auditorías completadas
- **Pendientes**: Lista de tareas por completar
- **Historial**: Línea de tiempo de actividades realizadas
- **Gráficas**: Visualización de datos con gráficos

### 🎓 Capacitación
- **Documentos**: 5 documentos de capacitación predefinidos
- **Plantillas**: Descarga de plantillas Excel
- **Subida**: Carga de documentos completados
- **Videos**: Videos de YouTube incrustados para cada documento
- **Seguimiento**: Marcado de videos como vistos

### 🔍 Auditoría
- **Checklist**: Cláusulas 4.1 a 10.3 de ISO 9001
- **Nueva Auditoría**: Crear auditorías con fecha específica
- **Cumplimiento**: Marcar ítems como "Cumple" o "No cumple"
- **Observaciones**: Agregar comentarios a cada ítem
- **Historial**: Ver auditorías anteriores

## 🔄 Uso Diario

### Iniciar Sesión
1. Ir a `http://localhost:3000`
2. Hacer clic en **"Iniciar Sesión"**
3. Ingresar el **NIT** de la empresa
4. Hacer clic en **"Iniciar Sesión"**

### Navegación
- Usar el menú lateral para cambiar entre módulos
- El dashboard se actualiza automáticamente con el progreso
- Los cambios se guardan inmediatamente

## 📁 Estructura de Archivos

```
ISO_9001/
├── data/                    # Base de datos JSON
│   ├── empresas.json
│   ├── documentos.json
│   ├── videos.json
│   ├── auditorias.json
│   └── checklist.json
├── public/
│   ├── uploads/            # Archivos subidos por usuarios
│   ├── templates/          # Plantillas de documentos
│   ├── css/               # Estilos
│   ├── js/                # JavaScript
│   ├── index.html         # Página principal
│   └── dashboard.html     # Dashboard
├── server.js              # Servidor principal
├── database.js            # Gestión de datos
├── registro.js            # Módulo de registro
├── inicio.js              # Módulo de inicio de sesión
├── desarrollo.js          # Módulo de dashboard
├── capacitacion.js        # Módulo de capacitación
├── auditoria.js           # Módulo de auditoría
└── package.json           # Configuración del proyecto
```

## 🛠️ Comandos Útiles

### Iniciar en Modo Desarrollo
```bash
npm run dev
```

### Detener el Servidor
- Presionar `Ctrl + C` en la terminal

### Reiniciar el Servidor
```bash
npm start
```

## 📊 Datos Iniciales

La aplicación viene con datos predefinidos:

### Documentos de Capacitación
1. Manual de Calidad
2. Política de Calidad
3. Procedimientos Generales
4. Registros de Calidad
5. Plan de Capacitación

### Cláusulas de Auditoría (ISO 9001)
- **4.1** a **4.4**: Contexto de la organización
- **5.1** a **5.3**: Liderazgo
- **6.1** a **6.3**: Planificación
- **7.1** a **7.5**: Soporte
- **8.1** a **8.7**: Operación
- **9.1** a **9.3**: Evaluación del desempeño
- **10.1** a **10.3**: Mejora

## 🔧 Personalización

### Agregar Videos de YouTube
1. Editar el archivo `database.js`
2. Buscar la función `initializeFiles()`
3. Modificar las URLs de los videos en `documentosIniciales`

### Agregar Plantillas de Documentos
1. Colocar archivos Excel en `public/templates/`
2. Nombrar los archivos según el patrón: `nombre_documento.xlsx`

### Modificar Cláusulas de Auditoría
1. Editar el archivo `database.js`
2. Buscar `clausulasIniciales` en la función `initializeFiles()`
3. Agregar o modificar las cláusulas según necesidades

## 🚨 Solución de Problemas

### Puerto Ocupado
Si el puerto 3000 está ocupado:
1. Editar `server.js`
2. Cambiar `const PORT = process.env.PORT || 3000;` por `const PORT = process.env.PORT || 3001;`

### Error de Base de Datos
Si hay problemas con los datos:
1. Detener el servidor
2. Eliminar la carpeta `data/`
3. Reiniciar el servidor (se recrearán los archivos)

### Problemas de Archivos
Asegurarse de que las carpetas tengan permisos de escritura:
- `public/uploads/`
- `public/templates/`
- `data/`

## 📞 Soporte

### Logs del Servidor
Los logs aparecen en la terminal donde se ejecuta `npm start`

### Archivos de Datos
Los datos se almacenan en archivos JSON en la carpeta `data/`

### Backup
Para hacer backup, copiar la carpeta `data/` completa

## 🎉 ¡Listo para Usar!

La herramienta ISO 9001 está completamente funcional y lista para ayudarte a gestionar la implementación de la norma de calidad en tu empresa.

**¡Disfruta usando la herramienta!** 🚀
