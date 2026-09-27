// api/calcular.js - Backend Serverless en Netlify
const DEGRADACION_ANUAL = 0.015; // 1.5% anual

exports.handler = async (event) => {
    try {
        const params = event.queryStringParameters || {};
        const soc = parseFloat(params.soc);
        const years = parseFloat(params.years);
        const consumo = parseFloat(params.consumo);
        const bateriaKwh = parseFloat(params.bateria_kwh);

        if (isNaN(soc) || isNaN(years) || isNaN(consumo) || isNaN(bateriaKwh)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Parámetros inválidos' })
            };
        }

        // Lógica matemática protegida en el servidor
        const saludBateria = 1 - (years * DEGRADACION_ANUAL);
        const kwhDisponibles = (bateriaKwh * saludBateria) * (soc / 100);
        const rangoEstimado = consumo > 0 ? Math.round((kwhDisponibles / consumo) * 100) : 0;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rangoEstimado,
                kwhDisponibles: Number(kwhDisponibles.toFixed(2)),
                saludBateriaPct: Number((saludBateria * 100).toFixed(1))
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error interno en el servidor' })
        };
    }
};