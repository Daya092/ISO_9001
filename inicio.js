const express = require('express');
const router = express.Router();
const { getDb } = require('./database');

// Mostrar formulario de inicio de sesión
router.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/inicio.html');
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

// Obtener información de la empresa actual
router.get('/empresa', (req, res) => {
    const db = getDb();
    
    db.get('SELECT * FROM empresas LIMIT 1', [], (err, empresa) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (!empresa) {
            return res.status(404).json({ error: 'No hay empresa registrada' });
        }

        res.json({ empresa });
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