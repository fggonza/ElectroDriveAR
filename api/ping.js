// api/ping.js - Registro de aperturas (Telemetría)
exports.handler = async (event) => {
    try {
        const params = event.queryStringParameters || {};
        const plataforma = params.origen || 'desconocido'; // 'app-movil' o 'web'
        const fechaHora = new Date().toISOString();
        
        // Datos de contexto que entrega Netlify automáticamente
        const ip = event.headers['x-forwarded-for'] || 'IP no disponible';
        const pais = event.headers['x-country'] || 'Desconocido';
        const userAgent = event.headers['user-agent'] || 'Sin agente';

        // Registro estructurado visible en Netlify Logs
        console.log(`[TELEMETRIA-APERTURA] Plataforma: ${plataforma} | Fecha: ${fechaHora} | País: ${pais} | IP: ${ip} | Dispositivo: ${userAgent}`);

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Permite pings desde el celular (Capacitor)
            },
            body: JSON.stringify({ status: 'ok', registrado: true })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error al registrar ping' })
        };
    }
};