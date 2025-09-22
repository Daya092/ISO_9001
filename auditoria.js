const express = require('express');
const router = express.Router();
const { getDb } = require('./database');

// Obtener lista de auditorías
router.get('/auditorias', (req, res) => {
    const db = getDb();
    
    db.get('SELECT id FROM empresas LIMIT 1', [], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        db.all(`
            SELECT 
                a.id,
                a.fecha_auditoria,
                a.fecha_creacion,
                COUNT(ca.id) as total_items,
                SUM(CASE WHEN ca.cumple = 1 THEN 1 ELSE 0 END) as items_cumplidos
            FROM auditorias a
            LEFT JOIN checklist_auditoria ca ON a.id = ca.auditoria_id
            WHERE a.empresa_id = ?
            GROUP BY a.id, a.fecha_auditoria, a.fecha_creacion
            ORDER BY a.fecha_auditoria DESC
        `, [empresa.id], (err, auditorias) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener auditorías' });
            }

            res.json({ auditorias });
        });
    });
});

// Crear nueva auditoría
router.post('/nueva', (req, res) => {
    const { fecha_auditoria } = req.body;
    const db = getDb();

    if (!fecha_auditoria) {
        return res.status(400).json({ error: 'La fecha de auditoría es requerida' });
    }

    db.get('SELECT id FROM empresas LIMIT 1', [], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        // Crear nueva auditoría
        db.run(`
            INSERT INTO auditorias (empresa_id, fecha_auditoria)
            VALUES (?, ?)
        `, [empresa.id, fecha_auditoria], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al crear auditoría' });
            }

            const auditoriaId = this.lastID;

            // Crear checklist para esta auditoría
            createChecklistForAudit(auditoriaId, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al crear checklist' });
                }

                res.json({ 
                    success: true, 
                    message: 'Auditoría creada exitosamente',
                    auditoria_id: auditoriaId
                });
            });
        });
    });
});

// Función para crear checklist para una auditoría
function createChecklistForAudit(auditoriaId, callback) {
    const db = getDb();
    
    // Obtener cláusulas por defecto
    db.all(`
        SELECT clausula, descripcion 
        FROM checklist_auditoria 
        WHERE auditoria_id IS NULL
    `, [], (err, clausulas) => {
        if (err) {
            return callback(err);
        }

        let completados = 0;
        const total = clausulas.length;

        if (total === 0) {
            return callback(null);
        }

        clausulas.forEach(clausula => {
            db.run(`
                INSERT INTO checklist_auditoria (auditoria_id, clausula, descripcion)
                VALUES (?, ?, ?)
            `, [auditoriaId, clausula.clausula, clausula.descripcion], (err) => {
                if (!err) completados++;
                if (completados === total) {
                    callback(null);
                }
            });
        });
    });
}

// Obtener checklist de una auditoría específica
router.get('/checklist/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();

    db.all(`
        SELECT id, clausula, descripcion, cumple, observaciones
        FROM checklist_auditoria 
        WHERE auditoria_id = ?
        ORDER BY clausula
    `, [id], (err, checklist) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener checklist' });
        }

        res.json({ checklist });
    });
});

// Actualizar item del checklist
router.put('/checklist/:id', (req, res) => {
    const { id } = req.params;
    const { cumple, observaciones } = req.body;
    const db = getDb();

    db.run(`
        UPDATE checklist_auditoria 
        SET cumple = ?, observaciones = ?
        WHERE id = ?
    `, [cumple ? 1 : 0, observaciones || '', id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar checklist' });
        }

        res.json({ 
            success: true, 
            message: 'Checklist actualizado exitosamente' 
        });
    });
});

// Obtener resumen de auditoría
router.get('/resumen/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();

    db.get(`
        SELECT 
            a.fecha_auditoria,
            COUNT(ca.id) as total_items,
            SUM(CASE WHEN ca.cumple = 1 THEN 1 ELSE 0 END) as items_cumplidos,
            SUM(CASE WHEN ca.cumple = 0 THEN 1 ELSE 0 END) as items_no_cumplidos
        FROM auditorias a
        LEFT JOIN checklist_auditoria ca ON a.id = ca.auditoria_id
        WHERE a.id = ?
        GROUP BY a.id, a.fecha_auditoria
    `, [id], (err, resumen) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener resumen' });
        }

        if (!resumen) {
            return res.status(404).json({ error: 'Auditoría no encontrada' });
        }

        const porcentaje = resumen.total_items > 0 
            ? Math.round((resumen.items_cumplidos / resumen.total_items) * 100) 
            : 0;

        res.json({
            ...resumen,
            porcentaje_cumplimiento: porcentaje
        });
    });
});

// Eliminar auditoría
router.delete('/auditoria/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();

    // Primero eliminar el checklist
    db.run('DELETE FROM checklist_auditoria WHERE auditoria_id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar checklist' });
        }

        // Luego eliminar la auditoría
        db.run('DELETE FROM auditorias WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar auditoría' });
            }

            res.json({ 
                success: true, 
                message: 'Auditoría eliminada exitosamente' 
            });
        });
    });
});

// Obtener estadísticas generales de auditorías
router.get('/estadisticas', (req, res) => {
    const db = getDb();
    
    db.get('SELECT id FROM empresas LIMIT 1', [], (err, empresa) => {
        if (err || !empresa) {
            return res.status(500).json({ error: 'Error al obtener empresa' });
        }

        db.get(`
            SELECT 
                COUNT(DISTINCT a.id) as total_auditorias,
                COUNT(ca.id) as total_items,
                SUM(CASE WHEN ca.cumple = 1 THEN 1 ELSE 0 END) as items_cumplidos,
                AVG(CASE WHEN ca.cumple = 1 THEN 1.0 ELSE 0.0 END) * 100 as promedio_cumplimiento
            FROM auditorias a
            LEFT JOIN checklist_auditoria ca ON a.id = ca.auditoria_id
            WHERE a.empresa_id = ?
        `, [empresa.id], (err, stats) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener estadísticas' });
            }

            res.json({
                total_auditorias: stats.total_auditorias || 0,
                total_items: stats.total_items || 0,
                items_cumplidos: stats.items_cumplidos || 0,
                promedio_cumplimiento: Math.round(stats.promedio_cumplimiento || 0)
            });
        });
    });
});

module.exports = router;