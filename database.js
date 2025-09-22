const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'iso9001.db');
let db;

const init = () => {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error al conectar con la base de datos:', err.message);
        } else {
            console.log('Conectado a la base de datos SQLite');
            createTables();
        }
    });
};

const createTables = () => {
    // Tabla de empresas
    db.run(`
        CREATE TABLE IF NOT EXISTS empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            razon_social TEXT NOT NULL,
            nit TEXT UNIQUE NOT NULL,
            representante_legal TEXT NOT NULL,
            tipo_empresa TEXT NOT NULL,
            direccion TEXT NOT NULL,
            telefono TEXT NOT NULL,
            numero_empleados INTEGER NOT NULL,
            email TEXT NOT NULL,
            web TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error al crear tabla empresas:', err);
        }
    });

    // Tabla de documentos de capacitación
    db.run(`
        CREATE TABLE IF NOT EXISTS documentos_capacitacion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            archivo_plantilla TEXT,
            archivo_subido TEXT,
            video_url TEXT,
            estado TEXT DEFAULT 'pendiente',
            fecha_subida DATETIME,
            empresa_id INTEGER,
            FOREIGN KEY (empresa_id) REFERENCES empresas (id)
        )
    `, (err) => {
        if (err) {
            console.error('Error al crear tabla documentos_capacitacion:', err);
        }
    });

    // Tabla de videos vistos
    db.run(`
        CREATE TABLE IF NOT EXISTS videos_vistos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            documento_id INTEGER,
            empresa_id INTEGER,
            fecha_visto DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (documento_id) REFERENCES documentos_capacitacion (id),
            FOREIGN KEY (empresa_id) REFERENCES empresas (id)
        )
    `, (err) => {
        if (err) {
            console.error('Error al crear tabla videos_vistos:', err);
        }
    });

    // Tabla de auditorías
    db.run(`
        CREATE TABLE IF NOT EXISTS auditorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER,
            fecha_auditoria DATE NOT NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES empresas (id)
        )
    `, (err) => {
        if (err) {
            console.error('Error al crear tabla auditorias:', err);
        }
    });

    // Tabla de checklist de auditoría
    db.run(`
        CREATE TABLE IF NOT EXISTS checklist_auditoria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            auditoria_id INTEGER,
            clausula TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            cumple INTEGER DEFAULT 0,
            observaciones TEXT,
            FOREIGN KEY (auditoria_id) REFERENCES auditorias (id)
        )
    `, (err) => {
        if (err) {
            console.error('Error al crear tabla checklist_auditoria:', err);
        } else {
            // Insertar datos por defecto después de crear todas las tablas
            setTimeout(() => {
                insertDefaultDocuments();
                insertDefaultChecklist();
            }, 1000);
        }
    });
};

const insertDefaultDocuments = () => {
    const documentos = [
        { nombre: 'Manual de Calidad', video_url: 'https://www.youtube.com/embed/VIDEO_ID_1' },
        { nombre: 'Política de Calidad', video_url: 'https://www.youtube.com/embed/VIDEO_ID_2' },
        { nombre: 'Procedimientos Generales', video_url: 'https://www.youtube.com/embed/VIDEO_ID_3' },
        { nombre: 'Registros de Calidad', video_url: 'https://www.youtube.com/embed/VIDEO_ID_4' },
        { nombre: 'Plan de Capacitación', video_url: 'https://www.youtube.com/embed/VIDEO_ID_5' }
    ];

    documentos.forEach(doc => {
        db.run(`
            INSERT OR IGNORE INTO documentos_capacitacion (nombre, video_url)
            VALUES (?, ?)
        `, [doc.nombre, doc.video_url]);
    });
};

const insertDefaultChecklist = () => {
    const clausulas = [
        { clausula: '4.1', descripcion: 'Comprensión de la organización y su contexto' },
        { clausula: '4.2', descripcion: 'Comprensión de las necesidades y expectativas de las partes interesadas' },
        { clausula: '4.3', descripcion: 'Determinación del alcance del sistema de gestión de la calidad' },
        { clausula: '4.4', descripcion: 'Sistema de gestión de la calidad y sus procesos' },
        { clausula: '5.1', descripcion: 'Liderazgo y compromiso' },
        { clausula: '5.2', descripcion: 'Política' },
        { clausula: '5.3', descripcion: 'Roles, responsabilidades y autoridades en la organización' },
        { clausula: '6.1', descripcion: 'Acciones para abordar riesgos y oportunidades' },
        { clausula: '6.2', descripcion: 'Objetivos de la calidad y planificación para lograrlos' },
        { clausula: '6.3', descripcion: 'Planificación de los cambios' },
        { clausula: '7.1', descripcion: 'Recursos' },
        { clausula: '7.2', descripcion: 'Competencia' },
        { clausula: '7.3', descripcion: 'Toma de conciencia' },
        { clausula: '7.4', descripcion: 'Comunicación' },
        { clausula: '7.5', descripcion: 'Información documentada' },
        { clausula: '8.1', descripcion: 'Planificación y control operacional' },
        { clausula: '8.2', descripcion: 'Requisitos para los productos y servicios' },
        { clausula: '8.3', descripcion: 'Diseño y desarrollo de los productos y servicios' },
        { clausula: '8.4', descripcion: 'Control de los procesos, productos y servicios suministrados externamente' },
        { clausula: '8.5', descripcion: 'Producción y provisión del servicio' },
        { clausula: '8.6', descripcion: 'Liberación de los productos y servicios' },
        { clausula: '8.7', descripcion: 'Control de las salidas no conformes' },
        { clausula: '9.1', descripcion: 'Seguimiento, medición, análisis y evaluación' },
        { clausula: '9.2', descripcion: 'Auditoría interna' },
        { clausula: '9.3', descripcion: 'Revisión por la dirección' },
        { clausula: '10.1', descripcion: 'No conformidad y acción correctiva' },
        { clausula: '10.2', descripcion: 'Mejora continua' },
        { clausula: '10.3', descripcion: 'Mejora continua' }
    ];

    clausulas.forEach(clausula => {
        db.run(`
            INSERT OR IGNORE INTO checklist_auditoria (clausula, descripcion)
            VALUES (?, ?)
        `, [clausula.clausula, clausula.descripcion]);
    });
};

const getDb = () => {
    return db;
};

module.exports = {
    init,
    getDb
};
