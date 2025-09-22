const express = require('express');
const router = express.Router();
const path = require('path');
const { getDb } = require('./database');

// Mostrar formulario de inicio de sesión
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

// Procesar inicio de sesión
router.post('/', (req, res) => {
    const { nit } = req.body;

    if (!nit) {
        return res.status(400).json({ error: 'El NIT es requerido' });
    }

    const db = getDb();

    // Buscar empresa por NIT
    db.get('SELECT * FROM empresas WHERE nit = ?', [nit], (err, empresa) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (!empresa) {
            return res.status(401).json({ error: 'No se encontró una empresa con este NIT' });
        }

        // Inicio de sesión exitoso
        res.json({ 
            success: true, 
            message: 'Inicio de sesión exitoso',
            empresa: {
                id: empresa.id,
                razon_social: empresa.razon_social,
                nit: empresa.nit
            }
        });
    });
});

// Obtener información de una empresa específica
router.get('/empresa/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    
    db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, empresa) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json({ empresa });
    });
});

// Obtener lista de empresas para selección
router.get('/empresas', (req, res) => {
    const db = getDb();
    
    db.all('SELECT id, razon_social, nit FROM empresas ORDER BY fecha_registro DESC', [], (err, empresas) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ empresas });
    });
});

// Verificar estado de sesión
router.get('/status', (req, res) => {
    const db = getDb();
    
    db.get('SELECT COUNT(*) as count FROM empresas', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ 
            hasCompany: row.count > 0,
            canLogin: row.count > 0
        });
    });
});

module.exports = router;