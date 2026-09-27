const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir la interfaz (Capa 1: Frontend)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const DEGRADACION_ANUAL = 0.015; // 1.5% de degradación por año

// Capa 2: Backend (Cálculo procesado en el servidor)
app.get('/api/calcular', (req, res) => {
    try {
        const soc = parseFloat(req.query.soc);
        const years = parseFloat(req.query.years);
        const consumo = parseFloat(req.query.consumo);
        const bateriaKwh = parseFloat(req.query.bateria_kwh);

        if (isNaN(soc) || isNaN(years) || isNaN(consumo) || isNaN(bateriaKwh)) {
            return res.status(400).json({ error: 'Parámetros inválidos' });
        }

        // Matemática en el servidor
        const saludBateria = 1 - (years * DEGRADACION_ANUAL);
        const kwhDisponibles = (bateriaKwh * saludBateria) * (soc / 100);
        const rangoEstimado = consumo > 0 ? Math.round((kwhDisponibles / consumo) * 100) : 0;

        return res.json({
            rangoEstimado,
            kwhDisponibles: Number(kwhDisponibles.toFixed(2)),
            saludBateriaPct: Number((saludBateria * 100).toFixed(1))
        });
    } catch (err) {
        return res.status(500).json({ error: 'Error interno en el servidor' });
    }
});

// Endpoint de registro / ping local
app.get('/api/ping', (req, res) => {
    const plataforma = req.query.origen || 'desconocido';
    const fechaHora = new Date().toLocaleString();
    console.log(`📡 [PING REGISTRADO] Apertura detectada | Origen: ${plataforma} | Fecha: ${fechaHora}`);
    res.json({ status: 'ok', registrado: true });
});

app.listen(PORT, () => {
    console.log(`⚡ ElectroDriveAR corriendo en http://localhost:${PORT}`);
});