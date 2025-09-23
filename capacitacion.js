const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getDb } = require('./database');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/documentoscompletos/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Obtener lista de documentos
router.get('/documentos/:empresaId', (req, res) => {
    // Documentos fijos para todas las empresas
    const videoBase = 'https://www.youtube.com/watch?v=l9cFvtXH5Bo&list=PL2te6ntc99jG02WFC-q0OEwY3YqHWkbTY';
    const documentos = [
        { nombre: 'Onjetivos-beneficios', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: 'https://www.youtube.com/embed/l9cFvtXH5Bo?si=e06g-t5kc9lhG7fI' },
        { nombre: 'ciclo phva', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'organizacion', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'liderazgo', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'planifacion', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'apoyo', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'operacion', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'desempeño', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'mejora', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase },
        { nombre: 'auditoria', archivo_plantilla: 'documentos/plantilla.xlsx', video_url: videoBase }
    ];
    res.json({ documentos });
});

// Descargar plantilla de documento
router.get('/descargar/:id', (req, res) => {
    // Descargar el archivo correspondiente según el nombre del documento
    const documentos = [
        { nombre: 'Objetivos-beneficios', archivo_plantilla: 'plantilla.xlsx', video_url: 'https://www.youtube.com/watch?v=l9cFvtXH5Bo&list=PL2te6ntc99jG02WFC-q0OEwY3YqHWkbTYL'  },
        { nombre: 'ciclo phva', archivo_plantilla: 'ciclo-phva.xlsx' },
        { nombre: 'organizacion', archivo_plantilla: 'organizacion.xlsx' },
        { nombre: 'liderazgo', archivo_plantilla: 'liderazgo.xlsx' },
        { nombre: 'planifacion', archivo_plantilla: 'planifacion.xlsx' },
        { nombre: 'apoyo', archivo_plantilla: 'apoyo.xlsx' },
        { nombre: 'operacion', archivo_plantilla: 'operacion.xlsx' },
        { nombre: 'desempeño', archivo_plantilla: 'desempeño.xlsx' },
        { nombre: 'mejora', archivo_plantilla: 'mejora.xlsx' },
        { nombre: 'auditoria', archivo_plantilla: 'auditoria.xlsx' }
    ];
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 0 || id >= documentos.length) {
        return res.status(404).json({ error: 'Documento no encontrado' });
    }
    const doc = documentos[id];
    const filePath = path.join(__dirname, 'public', 'documentos', doc.archivo_plantilla);
    res.download(filePath, doc.archivo_plantilla);
});

// Subir documento completado
router.post('/subir/:id', upload.single('archivo'), (req, res) => {
    const { id } = req.params;
    const db = getDb();

    if (!req.file) {
        return res.status(400).json({ error: 'No se ha seleccionado ningún archivo' });
    }

    const archivoSubido = req.file.filename;

    db.run(`
        UPDATE documentos_capacitacion 
        SET archivo_subido = ?, estado = 'completado', fecha_subida = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [archivoSubido, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar documento' });
        }

        res.json({ 
            success: true, 
            message: 'Documento subido exitosamente',
            archivo: archivoSubido
        });
    });
});

// Marcar video como visto
router.post('/video-visto/:id/:empresaId', (req, res) => {
    const { id, empresaId } = req.params;
    const db = getDb();

    db.get('SELECT id FROM empresas WHERE id = ?', [empresaId], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        // Verificar si ya fue marcado como visto
        db.get(`
            SELECT id FROM videos_vistos 
            WHERE documento_id = ? AND empresa_id = ?
        `, [id, empresa.id], (err, videoVisto) => {
            if (err) {
                return res.status(500).json({ error: 'Error al verificar video' });
            }

            if (videoVisto) {
                // Si ya está marcado, eliminar el registro (desmarcar)
                db.run(`DELETE FROM videos_vistos WHERE id = ?`, [videoVisto.id], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al desmarcar video' });
                    }
                    res.json({ 
                        success: true, 
                        message: 'Video desmarcado exitosamente',
                        marcado: false
                    });
                });
            } else {
                // Marcar como visto
                db.run(`
                    INSERT INTO videos_vistos (documento_id, empresa_id)
                    VALUES (?, ?)
                `, [id, empresaId], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al marcar video como visto' });
                    }
                    res.json({ 
                        success: true, 
                        message: 'Video marcado como visto exitosamente',
                        marcado: true
                    });
                });
            }
        });
    });
});

// Obtener estado de videos
router.get('/videos-estado/:empresaId', (req, res) => {
    const { empresaId } = req.params;
    const db = getDb();
    
    db.get('SELECT id FROM empresas WHERE id = ?', [empresaId], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        db.all(`
            SELECT 
                dc.id,
                dc.nombre,
                CASE WHEN vv.id IS NOT NULL THEN 1 ELSE 0 END as visto
            FROM documentos_capacitacion dc
            LEFT JOIN videos_vistos vv ON dc.id = vv.documento_id AND vv.empresa_id = ?
            WHERE dc.empresa_id = ?
            ORDER BY dc.nombre
        `, [empresaId, empresaId], (err, videos) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener estado de videos' });
            }

            res.json({ videos });
        });
    });
});

// Crear plantillas por defecto (solo para desarrollo)
router.post('/crear-plantillas/:empresaId', (req, res) => {
    const { empresaId } = req.params;
    const db = getDb();
    
    const plantillas = [
        { nombre: 'Manual de Calidad', archivo: 'manual_calidad.xlsx' },
        { nombre: 'Política de Calidad', archivo: 'politica_calidad.xlsx' },
        { nombre: 'Procedimientos Generales', archivo: 'procedimientos.xlsx' },
        { nombre: 'Registros de Calidad', archivo: 'registros_calidad.xlsx' },
        { nombre: 'Plan de Capacitación', archivo: 'plan_capacitacion.xlsx' }
    ];

    db.get('SELECT id FROM empresas WHERE id = ?', [empresaId], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        let completados = 0;
        plantillas.forEach(plantilla => {
            db.run(`
                UPDATE documentos_capacitacion 
                SET archivo_plantilla = ?
                WHERE nombre = ? AND empresa_id = ?
            `, [plantilla.archivo, plantilla.nombre, empresaId], (err) => {
                if (!err) completados++;
            });
        });

        res.json({ 
            success: true, 
            message: `Plantillas actualizadas: ${completados}/${plantillas.length}` 
        });
    });
});

module.exports = router;