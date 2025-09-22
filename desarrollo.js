const express = require('express');
const router = express.Router();
const { getDb } = require('./database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de subida de archivos (para reemplazos de documentos completados)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'documentoscompletos'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'archivo-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage });

// Obtener datos del dashboard
router.get('/dashboard/:empresaId', (req, res) => {
    const { empresaId } = req.params;
    const db = getDb();
    
    // Obtener empresa específica
    db.get('SELECT * FROM empresas WHERE id = ?', [empresaId], (err, empresa) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Obtener estadísticas de documentos
        db.all(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados
            FROM documentos_capacitacion 
            WHERE empresa_id = ?
        `, [empresa.id], (err, docStats) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener estadísticas de documentos' });
            }

            // Obtener estadísticas de videos
            db.all(`
                SELECT COUNT(*) as videos_vistos
                FROM videos_vistos 
                WHERE empresa_id = ?
            `, [empresa.id], (err, videoStats) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener estadísticas de videos' });
                }

                // Obtener estadísticas de auditorías
                db.all(`
                    SELECT 
                        COUNT(*) as total_auditorias,
                        SUM(CASE WHEN ca.cumple = 1 THEN 1 ELSE 0 END) as items_cumplidos,
                        COUNT(ca.id) as total_items
                    FROM checklist_auditoria ca
                    JOIN auditorias a ON ca.auditoria_id = a.id
                    WHERE a.empresa_id = ?
                `, [empresa.id], (err, auditStats) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al obtener estadísticas de auditorías' });
                    }

                    // Calcular porcentajes
                    const totalDocs = docStats[0]?.total || 0;
                    const docsCompletados = docStats[0]?.completados || 0;
                    const videosVistos = videoStats[0]?.videos_vistos || 0;
                    const totalVideos = totalDocs; // Asumimos un video por documento
                    const itemsCumplidos = auditStats[0]?.items_cumplidos || 0;
                    const totalItems = auditStats[0]?.total_items || 0;

                    const porcentajeDocs = totalDocs > 0 ? Math.round((docsCompletados / totalDocs) * 100) : 0;
                    const porcentajeVideos = totalVideos > 0 ? Math.round((videosVistos / totalVideos) * 100) : 0;
                    const porcentajeAuditoria = totalItems > 0 ? Math.round((itemsCumplidos / totalItems) * 100) : 0;
                    const porcentajeGeneral = Math.round((porcentajeDocs + porcentajeVideos + porcentajeAuditoria) / 3);

                    res.json({
                        empresa,
                        estadisticas: {
                            documentos: {
                                total: totalDocs,
                                completados: docsCompletados,
                                pendientes: totalDocs - docsCompletados,
                                porcentaje: porcentajeDocs
                            },
                            videos: {
                                total: totalVideos,
                                vistos: videosVistos,
                                pendientes: totalVideos - videosVistos,
                                porcentaje: porcentajeVideos
                            },
                            auditoria: {
                                total_items: totalItems,
                                cumplidos: itemsCumplidos,
                                pendientes: totalItems - itemsCumplidos,
                                porcentaje: porcentajeAuditoria
                            },
                            general: {
                                porcentaje: porcentajeGeneral
                            }
                        }
                    });
                });
            });
        });
    });
});

// Categorizar archivos de capacitación (basado en nombres) en secciones
router.get('/capacitacion-secciones', (req, res) => {
    try {
        const documentosDir = path.join(__dirname, 'public', 'documentos');
        const files = fs.readdirSync(documentosDir);

        // Definir mapeo de palabras clave a secciones
        const secciones = {
            'objetivos_especificos': [],
            'ciclo_phva': [],
            'organizacion': [],
            'liderazgo': [],
            'planificacion': [],
            'apoyo': [],
            'operacion': [],
            'desempeno': []
        };

        const addTo = (section, file) => {
            secciones[section].push({
                nombre: file,
                url: `/documentos/${encodeURIComponent(file)}`
            });
        };

        files.forEach(file => {
            const lower = file.toLowerCase();
            // Planificar por cláusulas ISO 9001 y palabras clave en español
            if (/(objetivos|smart|indicadores|6\.2)/.test(lower)) {
                addTo('objetivos_especificos', file);
                return;
            }
            if (/(phva|mejora|10\.|9\.|seguimiento|medición|analisis|evaluación|desempeño)/.test(lower)) {
                // 9.x y 10.x suelen ser desempeño y mejora
                if (/(9\.|seguimiento|medición|analisis|evaluación|desempeño)/.test(lower)) {
                    addTo('desempeno', file);
                } else {
                    addTo('ciclo_phva', file);
                }
                return;
            }
            if (/(4\.|organización|conocimientos|partes\+interesadas|alcance|mapa\+de\+procesos|ficha\+de\+procesos|organigrama)/.test(lower)) {
                addTo('organizacion', file);
                return;
            }
            if (/(5\.|liderazgo|política)/.test(lower)) {
                addTo('liderazgo', file);
                return;
            }
            if (/(6\.|riesgos|oportunidades|planificaci[oó]n|pestal|foda|porter)/.test(lower)) {
                addTo('planificacion', file);
                return;
            }
            if (/(7\.|apoyo|recursos|infraestructura|seguimiento\+y\+medición|competencia|toma\+de\+conciencia|información\+documentada|gestión\+del\+conocimiento)/.test(lower)) {
                addTo('apoyo', file);
                return;
            }
            if (/(8\.|operacional|requisitos|procesos\+externos|liberación|salidas\+no\+conformes|control\+operacional)/.test(lower)) {
                addTo('operacion', file);
                return;
            }
            // Si no coincide, ubicar según mejores heurísticas adicionales
            if (/indicadores|financieros|desempeño/.test(lower)) {
                addTo('desempeno', file);
                return;
            }
            // Por defecto, colocar en organizacion
            addTo('organizacion', file);
        });

        res.json({ secciones });
    } catch (error) {
        console.error('Error al categorizar documentos:', error);
        res.status(500).json({ error: 'Error al categorizar documentos' });
    }
});

// Videos de capacitación categorizados por secciones (por nombre)
router.get('/videos-secciones/:empresaId', (req, res) => {
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
                dc.video_url,
                CASE WHEN vv.id IS NOT NULL THEN 1 ELSE 0 END as visto
            FROM documentos_capacitacion dc
            LEFT JOIN videos_vistos vv ON dc.id = vv.documento_id AND vv.empresa_id = ?
            WHERE dc.empresa_id = ? AND dc.video_url IS NOT NULL AND dc.video_url != ''
            ORDER BY dc.nombre
        `, [empresaId, empresaId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener videos' });
            }

            const secciones = {
                'objetivos_especificos': [],
                'ciclo_phva': [],
                'organizacion': [],
                'liderazgo': [],
                'planificacion': [],
                'apoyo': [],
                'operacion': [],
                'desempeno': []
            };

            const push = (key, row) => secciones[key].push(row);

            rows.forEach(row => {
                const lower = row.nombre.toLowerCase();
                if (/(objetivos|smart|indicadores|6\.2)/.test(lower)) {
                    return push('objetivos_especificos', row);
                }
                if (/(phva|mejora|10\.|9\.|seguimiento|medición|analisis|evaluación|desempeño)/.test(lower)) {
                    if (/(9\.|seguimiento|medición|analisis|evaluación|desempeño)/.test(lower)) {
                        return push('desempeno', row);
                    }
                    return push('ciclo_phva', row);
                }
                if (/(4\.|organización|conocimientos|partes\+interesadas|alcance|mapa\+de\+procesos|ficha\+de\+procesos|organigrama)/.test(lower)) {
                    return push('organizacion', row);
                }
                if (/(5\.|liderazgo|política)/.test(lower)) {
                    return push('liderazgo', row);
                }
                if (/(6\.|riesgos|oportunidades|planificaci[oó]n|pestal|foda|porter)/.test(lower)) {
                    return push('planificacion', row);
                }
                if (/(7\.|apoyo|recursos|infraestructura|seguimiento\+y\+medición|competencia|toma\+de\+conciencia|información\+documentada|gestión\+del\+conocimiento)/.test(lower)) {
                    return push('apoyo', row);
                }
                if (/(8\.|operacional|requisitos|procesos\+externos|liberación|salidas\+no\+conformes|control\+operacional)/.test(lower)) {
                    return push('operacion', row);
                }
                if (/indicadores|financieros|desempeño/.test(lower)) {
                    return push('desempeno', row);
                }
                push('organizacion', row);
            });

            res.json({ secciones });
        });
    });
});

// Subir documento completado (genérico para secciones de desarrollo)
router.post('/subir', upload.single('archivo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha seleccionado ningún archivo' });
    }
    res.json({ success: true, message: 'Archivo subido exitosamente', archivo: req.file.filename });
});

// Obtener pendientes
router.get('/pendientes/:empresaId', (req, res) => {
    const { empresaId } = req.params;
    const db = getDb();
    
    db.get('SELECT id FROM empresas WHERE id = ?', [empresaId], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        // Obtener documentos pendientes
        db.all(`
            SELECT nombre, estado
            FROM documentos_capacitacion 
            WHERE empresa_id = ? AND estado = 'pendiente'
        `, [empresa.id], (err, docsPendientes) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener documentos pendientes' });
            }

            // Obtener videos no vistos
            db.all(`
                SELECT dc.nombre
                FROM documentos_capacitacion dc
                LEFT JOIN videos_vistos vv ON dc.id = vv.documento_id AND vv.empresa_id = ?
                WHERE dc.empresa_id = ? AND vv.id IS NULL
            `, [empresa.id, empresa.id], (err, videosPendientes) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener videos pendientes' });
                }

                // Obtener items de auditoría pendientes
                db.all(`
                    SELECT ca.clausula, ca.descripcion
                    FROM checklist_auditoria ca
                    JOIN auditorias a ON ca.auditoria_id = a.id
                    WHERE a.empresa_id = ? AND ca.cumple = 0
                    ORDER BY a.fecha_auditoria DESC
                    LIMIT 10
                `, [empresa.id], (err, auditPendientes) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al obtener auditorías pendientes' });
                    }

                    res.json({
                        documentos: docsPendientes,
                        videos: videosPendientes,
                        auditoria: auditPendientes
                    });
                });
            });
        });
    });
});

// Obtener historial de avances
router.get('/historial/:empresaId', (req, res) => {
    const { empresaId } = req.params;
    const db = getDb();
    
    db.get('SELECT id FROM empresas WHERE id = ?', [empresaId], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        const historial = [];

        // Obtener documentos subidos recientemente
        db.all(`
            SELECT nombre, fecha_subida, 'documento' as tipo
            FROM documentos_capacitacion 
            WHERE empresa_id = ? AND estado = 'completado' AND fecha_subida IS NOT NULL
            ORDER BY fecha_subida DESC
            LIMIT 5
        `, [empresa.id], (err, docs) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener historial de documentos' });
            }

            historial.push(...docs);

            // Obtener videos vistos recientemente
            db.all(`
                SELECT dc.nombre, vv.fecha_visto, 'video' as tipo
                FROM videos_vistos vv
                JOIN documentos_capacitacion dc ON vv.documento_id = dc.id
                WHERE vv.empresa_id = ?
                ORDER BY vv.fecha_visto DESC
                LIMIT 5
            `, [empresa.id], (err, videos) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener historial de videos' });
                }

                historial.push(...videos);

                // Obtener auditorías recientes
                db.all(`
                    SELECT fecha_auditoria, 'auditoria' as tipo
                    FROM auditorias 
                    WHERE empresa_id = ?
                    ORDER BY fecha_auditoria DESC
                    LIMIT 3
                `, [empresa.id], (err, auditorias) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al obtener historial de auditorías' });
                    }

                    historial.push(...auditorias);

                    // Ordenar por fecha
                    historial.sort((a, b) => {
                        const fechaA = new Date(a.fecha_subida || a.fecha_visto || a.fecha_auditoria);
                        const fechaB = new Date(b.fecha_subida || b.fecha_visto || b.fecha_auditoria);
                        return fechaB - fechaA;
                    });

                    res.json({ historial: historial.slice(0, 10) });
                });
            });
        });
    });
});

module.exports = router;