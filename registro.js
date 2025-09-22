const express = require('express');
const router = express.Router();
const { getDb } = require('./database');

// Mostrar formulario de registro
router.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/registro.html');
});

// Procesar registro de empresa
router.post('/', (req, res) => {
    const {
        razon_social,
        nit,
        representante_legal,
        tipo_empresa,
        direccion,
        telefono,
        numero_empleados,
        email,
        web
    } = req.body;

    const db = getDb();

    // Verificar si ya existe una empresa con ese NIT
    db.get('SELECT id FROM empresas WHERE nit = ?', [nit], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (row) {
            return res.status(400).json({ error: 'Ya existe una empresa registrada con este NIT' });
        }

        // Insertar nueva empresa
        db.run(`
            INSERT INTO empresas (
                razon_social, nit, representante_legal, tipo_empresa,
                direccion, telefono, numero_empleados, email, web
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            razon_social, nit, representante_legal, tipo_empresa,
            direccion, telefono, numero_empleados, email, web
        ], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al registrar la empresa' });
            }

            // Crear documentos de capacitación para esta empresa
            createDocumentsForCompany(this.lastID);

            res.json({ 
                success: true, 
                message: 'Empresa registrada exitosamente',
                empresa_id: this.lastID
            });
        });
    });
});

// Función para crear documentos de capacitación para una empresa
function createDocumentsForCompany(empresaId) {
    const db = getDb();
    
    // Obtener todos los documentos por defecto
    db.all('SELECT * FROM documentos_capacitacion WHERE empresa_id IS NULL', [], (err, documentos) => {
        if (err) {
            console.error('Error al obtener documentos:', err);
            return;
        }

        // Crear copias de los documentos para esta empresa
        documentos.forEach(doc => {
            db.run(`
                INSERT INTO documentos_capacitacion (
                    nombre, video_url, empresa_id, estado
                ) VALUES (?, ?, ?, 'pendiente')
            `, [doc.nombre, doc.video_url, empresaId]);
        });
    });
}

// Verificar si ya existe una empresa registrada
router.get('/check', (req, res) => {
    const db = getDb();
    
    db.get('SELECT COUNT(*) as count FROM empresas', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ 
            hasCompany: row.count > 0,
            message: row.count > 0 ? 'Ya existe una empresa registrada' : 'No hay empresa registrada'
        });
    });
});

module.exports = router;