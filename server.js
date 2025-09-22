const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Importar módulos
const database = require('./database');
const registro = require('./registro');
const inicio = require('./inicio');
const desarrollo = require('./desarrollo');
const capacitacion = require('./capacitacion');
const auditoria = require('./auditoria');

// Inicializar base de datos
database.init();

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de módulos
app.use('/registro', registro);
app.use('/inicio', inicio);
app.use('/desarrollo', desarrollo);
app.use('/capacitacion', capacitacion);
app.use('/auditoria', auditoria);

// Ruta para dashboard principal
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
