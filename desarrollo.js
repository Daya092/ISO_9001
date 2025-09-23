const express = require('express');
const router = express.Router();
const { getDb } = require('./database');

// Obtener datos del dashboard
router.get('/dashboard/:empresaId', (req, res) => {
    const { empresaId } = req.params;
    const db = getDb();
    
    // Obtener empresa específica
    db.get('SELECT * FROM empresas WHERE id = ?', [empresaId], async (err, empresa) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Documentos fijos
        const documentosFijos = [
            'Onjetivos-beneficios.xlsx',
            'ciclo-phva.xlsx',
            'organizacion.xlsx',
            'liderazgo.xlsx',
            'planifacion.xlsx',
            'apoyo.xlsx',
            'operacion.xlsx',
            'desempeño.xlsx',
            'mejora.xlsx',
            'auditoria.xlsx'
        ];
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(__dirname, 'public', 'documentoscompletos');
        let archivosSubidos = [];
        try {
            archivosSubidos = fs.readdirSync(dir);
        } catch (e) {
            archivosSubidos = [];
        }
        // Consideramos completado si existe un archivo con el nombre exacto
        let docsCompletados = documentosFijos.filter(nombre => archivosSubidos.includes(nombre)).length;
        const totalDocs = documentosFijos.length;

        // Obtener estadísticas de videos
        db.all(`SELECT COUNT(*) as videos_vistos FROM videos_vistos WHERE empresa_id = ?`, [empresa.id], (err, videoStats) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener estadísticas de videos' });
            }
            const videosVistos = videoStats[0]?.videos_vistos || 0;
            const totalVideos = totalDocs;

            // Obtener estadísticas de auditorías
            db.all(`
                SELECT COUNT(*) as total_auditorias,
                       SUM(CASE WHEN ca.cumple = 1 THEN 1 ELSE 0 END) as items_cumplidos,
                       COUNT(ca.id) as total_items
                FROM checklist_auditoria ca
                JOIN auditorias a ON ca.auditoria_id = a.id
                WHERE a.empresa_id = ?
            `, [empresa.id], (err, auditStats) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener estadísticas de auditorías' });
                }
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