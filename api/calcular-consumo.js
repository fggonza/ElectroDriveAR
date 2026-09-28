// api/calcular-consumo.js
exports.handler = async (event) => {
    try {
        const data = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : event.queryStringParameters || {};

        const baseHogarKwh = parseFloat(data.baseHogarKwh) || 300;
        const distanciaMensualKm = parseFloat(data.distanciaMensualKm) || 50;
        const rendimientoEvKwh100 = parseFloat(data.rendimientoEvKwh100) || 15;
        const factorPerdidaPorc = parseFloat(data.factorPerdidaPorc) || 15;
        const proveedor = (data.proveedor || 'EDENOR').toUpperCase();
        
        // Impuestos
        const ivaPorc = parseFloat(data.ivaPorc) ?? 21;
        const art34Porc = parseFloat(data.art34Porc) ?? 6.383;
        const otrosPorc = parseFloat(data.otrosPorc) ?? 0;
        const factorImpuestos = 1 + ((ivaPorc + art34Porc + otrosPorc) / 100);

        // Vehículo térmico
        const costoLitroNafta = parseFloat(data.costoLitroNafta) || 1350;
        const consumoLitros100km = parseFloat(data.consumoLitros100km) || 8.5;

        // Cuadros tarifarios (Período 08/26)
        const tarifarios = {
            EDENOR: [
                { desde: 0, hasta: 150, fijo: 1741.12, variable: 158.001 },
                { desde: 151, hasta: 400, fijo: 3713.54, variable: 158.636 },
                { desde: 401, hasta: 500, fijo: 12194.46, variable: 170.373 },
                { desde: 501, hasta: 600, fijo: 19508.39, variable: 174.193 },
                { desde: 601, hasta: 700, fijo: 41118.15, variable: 174.479 },
                { desde: 701, hasta: Infinity, fijo: 64134.51, variable: 189.796 }
            ],
            EDESUR: [
                { desde: 0, hasta: 150, fijo: 1703.22, variable: 157.371 },
                { desde: 151, hasta: 400, fijo: 3575.10, variable: 157.925 },
                { desde: 401, hasta: 500, fijo: 11702.44, variable: 169.686 },
                { desde: 501, hasta: 600, fijo: 19083.66, variable: 173.662 },
                { desde: 601, hasta: 700, fijo: 41262.24, variable: 185.718 },
                { desde: 701, hasta: Infinity, fijo: 62612.83, variable: 202.079 }
            ]
        };

        const cuadro = tarifarios[proveedor] || tarifarios.EDENOR;

        function liquidarFactura(kwhTotal) {
            if (kwhTotal <= 0) return 0;
            const escalon = cuadro.find(e => kwhTotal >= e.desde && kwhTotal <= e.hasta) || cuadro[cuadro.length - 1];
            const subtotalNeto = escalon.fijo + (kwhTotal * escalon.variable);
            return subtotalNeto * factorImpuestos;
        }

        // Carga requerida con pérdidas AC->DC
        const kwhNetosEv = (distanciaMensualKm * rendimientoEvKwh100) / 100;
        const cargaEvKwh = kwhNetosEv * (1 + (factorPerdidaPorc / 100));

        // Proyecciones
        const consumoTotalHogarConEv = baseHogarKwh + cargaEvKwh;
        const facturaHogarSinEv = liquidarFactura(baseHogarKwh);
        const costoTotalFactura = liquidarFactura(consumoTotalHogarConEv);
        const costoRealEvMensual = Math.max(0, costoTotalFactura - facturaHogarSinEv);
        const costoPorKmEv = distanciaMensualKm > 0 ? costoRealEvMensual / distanciaMensualKm : 0;

        // Costo del térmico
        const litrosTermicoMensual = (distanciaMensualKm * consumoLitros100km) / 100;
        const costoTermicoMensual = litrosTermicoMensual * costoLitroNafta;
        const costoPorKmTermico = distanciaMensualKm > 0 ? costoTermicoMensual / distanciaMensualKm : 0;
        const ahorroMensual = costoTermicoMensual - costoRealEvMensual;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                facturaHogarSinEv,
                cargaEvKwh,
                costoTotalFactura,
                costoPorKmEv,
                costoRealEvMensual,
                costoTermicoMensual,
                costoPorKmTermico,
                ahorroMensual
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error al procesar cálculo de consumo' })
        };
    }
};