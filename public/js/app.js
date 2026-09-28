// ==========================================
// INICIALIZACIÓN SEGURA (Espera a que el HTML cargue)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. ESTADO GLOBAL Y VARIABLES BASE
    // ==========================================
    const DEGRADACION_ANUAL = 0.015; // 1.5% de pérdida por año
    
    // Fallback: Si falla el JSON, la app arranca con datos de respaldo
    let vehiculoActivo = {
        id: "byd-dolphin-mini-gs",
        marca: "BYD",
        modelo: "Dolphin Mini GS",
        bateria_kwh: 43.2,
        autonomia_km: 380
    };

    // ==========================================
    // 2. REFERENCIAS AL DOM (SLIDERS Y CONTROLES)
    // ==========================================
    // Solapa 1: Simulador de Autonomía
    const socSlider = document.getElementById('soc-slider');
    const yearsSlider = document.getElementById('years-slider');
    const consumptionSlider = document.getElementById('consumption-slider');
    const consumptionInput = document.getElementById('consumption-input');

    const socDisplay = document.getElementById('soc-display');
    const yearsDisplay = document.getElementById('years-display');
    const rangeValue = document.getElementById('range-value');
    const evTitle = document.getElementById('ev-title');
    const evBadge = document.getElementById('ev-badge');

    // Solapa 2: Selector de Vehículo
    const selectVehiculo = document.getElementById('vehiculo-select');
    const infoVehiculo = document.getElementById('vehiculo-info');

    // Solapas 3 y 4: Consumo, Tarifas y Combustible
    const baseHogarInput = document.getElementById('base-hogar-input');
    const distanciaSlider = document.getElementById('distancia-slider');
    const distanciaDisplay = document.getElementById('distancia-display');
    const proveedorSelect = document.getElementById('proveedor-select');
    const ivaInput = document.getElementById('iva-input');
    const art34Input = document.getElementById('art34-input');
    const otrosInput = document.getElementById('otros-input');
    const perdidaInput = document.getElementById('perdida-input');
    const naftaPrecioInput = document.getElementById('nafta-precio-input');
    const naftaConsumoInput = document.getElementById('nafta-consumo-input');

    const valFacturaBase = document.getElementById('val-factura-base');
    const valCargaKwh = document.getElementById('val-carga-kwh');
    const valFacturaTotal = document.getElementById('val-factura-total');
    const valCostoKmEv = document.getElementById('val-costo-km-ev');
    const valCostoEvMensual = document.getElementById('val-costo-ev-mensual');
    const valCostoKmTermico = document.getElementById('val-costo-km-termico');
    const valCostoTermicoMensual = document.getElementById('val-costo-termico-mensual');
    const valAhorroMensual = document.getElementById('val-ahorro-mensual');

    // ==========================================
    // 3. NAVEGACIÓN ENTRE SOLAPAS (TABS)
    // ==========================================
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
        });
    });

    // ==========================================
    // 4. LÓGICA DEL SIMULADOR DE AUTONOMÍA
    // ==========================================
    let debounceTimer = null;

    async function solicitarCalculoAlServidor() {
        if (!vehiculoActivo || !socSlider || !consumptionSlider) return;

        const soc = parseInt(socSlider.value);
        const years = parseInt(yearsSlider.value);
        const consumo = parseFloat(consumptionSlider.value);

        if (socDisplay) socDisplay.textContent = `${soc}%`;
        if (yearsDisplay) yearsDisplay.textContent = years === 1 ? '1 año' : `${years} años`;
        if (consumptionInput) consumptionInput.value = consumo.toFixed(1);

        try {
            const query = new URLSearchParams({
                soc,
                years,
                consumo,
                bateria_kwh: vehiculoActivo.bateria_kwh
            });

            const res = await fetch(`/api/calcular?${query.toString()}`);
            if (!res.ok) throw new Error('Error en respuesta del servidor');

            const data = await res.json();
            if (rangeValue) rangeValue.textContent = data.rangoEstimado;
        } catch (error) {
            console.error("Error al calcular en el servidor:", error);
        }
    }

    function calcularAutonomia() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(solicitarCalculoAlServidor, 50);
    }

    if (socSlider && yearsSlider && consumptionSlider) {
        socSlider.addEventListener('input', calcularAutonomia);
        yearsSlider.addEventListener('input', calcularAutonomia);

        consumptionSlider.addEventListener('input', () => {
            if (consumptionInput) consumptionInput.value = consumptionSlider.value;
            calcularAutonomia();
            solicitarCalculoConsumo(); // Sincroniza con la solapa de costo
        });

        if (consumptionInput) {
            consumptionInput.addEventListener('input', () => {
                let val = parseFloat(consumptionInput.value);
                if (!isNaN(val)) {
                    if (val > 20) val = 20;
                    if (val < 10) val = 10;
                    consumptionSlider.value = val;
                    calcularAutonomia();
                    solicitarCalculoConsumo();
                }
            });
        }

        calcularAutonomia();
    }

    // ==========================================
    // 5. CÁLCULO DE CONSUMO, TARIFAS Y TÉRMICO
    // ==========================================
    function formatearPesos(num) {
        return `$ ${Number(num || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    let timerConsumo = null;
    function solicitarCalculoConsumo() {
        if (!distanciaSlider || !baseHogarInput) return;
        if (distanciaDisplay) distanciaDisplay.textContent = `${distanciaSlider.value} km`;

        clearTimeout(timerConsumo);
        timerConsumo = setTimeout(async () => {
            const payload = {
                baseHogarKwh: parseFloat(baseHogarInput.value) || 300,
                distanciaMensualKm: parseFloat(distanciaSlider.value) || 50,
                rendimientoEvKwh100: parseFloat(consumptionSlider ? consumptionSlider.value : 15),
                proveedor: proveedorSelect ? proveedorSelect.value : 'EDENOR',
                ivaPorc: parseFloat(ivaInput ? ivaInput.value : 21),
                art34Porc: parseFloat(art34Input ? art34Input.value : 6.383),
                otrosPorc: parseFloat(otrosInput ? otrosInput.value : 0),
                factorPerdidaPorc: parseFloat(perdidaInput ? perdidaInput.value : 15),
                costoLitroNafta: parseFloat(naftaPrecioInput ? naftaPrecioInput.value : 1350),
                consumoLitros100km: parseFloat(naftaConsumoInput ? naftaConsumoInput.value : 8.5)
            };

            try {
                const res = await fetch('/api/calcular-consumo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const resData = await res.json();

                if (valFacturaBase) valFacturaBase.textContent = formatearPesos(resData.facturaHogarSinEv);
                if (valCargaKwh) valCargaKwh.textContent = `${(resData.cargaEvKwh || 0).toFixed(1)} kWh`;
                if (valFacturaTotal) valFacturaTotal.textContent = formatearPesos(resData.costoTotalFactura);
                if (valCostoKmEv) valCostoKmEv.textContent = formatearPesos(resData.costoPorKmEv);
                if (valCostoEvMensual) valCostoEvMensual.textContent = formatearPesos(resData.costoRealEvMensual);

                if (valCostoTermicoMensual) valCostoTermicoMensual.textContent = formatearPesos(resData.costoTermicoMensual);
                if (valCostoKmTermico) valCostoKmTermico.textContent = `${formatearPesos(resData.costoPorKmTermico)} / km`;
                
                if (valAhorroMensual) {
                    const ahorro = resData.ahorroMensual;
                    valAhorroMensual.textContent = ahorro >= 0 
                        ? `Ahorro mensual con EV: ${formatearPesos(ahorro)}` 
                        : `Costo extra vs nafta: ${formatearPesos(Math.abs(ahorro))}`;
                }
            } catch (err) {
                console.error("Error al calcular consumo en backend:", err);
            }
        }, 100);
    }

    const inputsConsumo = [
        baseHogarInput, distanciaSlider, proveedorSelect, ivaInput, 
        art34Input, otrosInput, perdidaInput, naftaPrecioInput, naftaConsumoInput
    ];
    inputsConsumo.forEach(elem => {
        if (elem) elem.addEventListener('input', solicitarCalculoConsumo);
    });

    solicitarCalculoConsumo();

    // ==========================================
    // 6. CARGA DE CATÁLOGO DE VEHÍCULOS
    // ==========================================
    async function cargarVehiculos() {
        if (!selectVehiculo) return;

        try {
            const response = await fetch('/data/vehiculos.json');
            const vehiculosDB = await response.json();
            
            selectVehiculo.innerHTML = '';
            vehiculosDB.forEach(auto => {
                const option = document.createElement('option');
                option.value = auto.id;
                option.textContent = `${auto.marca} ${auto.modelo}`;
                selectVehiculo.appendChild(option);
            });

            selectVehiculo.addEventListener('change', (e) => {
                const seleccionado = vehiculosDB.find(v => v.id === e.target.value);
                if (seleccionado) {
                    vehiculoActivo = seleccionado;
                    if (infoVehiculo) {
                        infoVehiculo.innerHTML = `
                            <strong>Batería:</strong> ${vehiculoActivo.bateria_kwh} kWh <br>
                            <strong>Autonomía Base WLTP:</strong> ${vehiculoActivo.autonomia_km} km
                        `;
                    }
                    if (evTitle) evTitle.textContent = `${vehiculoActivo.marca} ${vehiculoActivo.modelo}`;
                    if (evBadge) evBadge.textContent = `${vehiculoActivo.bateria_kwh} kWh`;
                    calcularAutonomia();
                }
            });

            selectVehiculo.dispatchEvent(new Event('change'));
        } catch (error) {
            console.error("Error cargando vehiculos.json", error);
            selectVehiculo.innerHTML = '<option>Error al cargar catálogo</option>';
        }
    }

    cargarVehiculos();

    // ==========================================
    // 7. TELEMETRÍA (PING SILENCIOSO)
    // ==========================================
    function registrarApertura() {
        const esAppMovil = window.Capacitor !== undefined || window.location.protocol === 'capacitor:';
        const origen = esAppMovil ? 'app-movil' : 'web';
        const baseUrl = esAppMovil ? 'https://electrodrivear.com.ar' : '';

        fetch(`${baseUrl}/api/ping?origen=${origen}`)
            .then(res => res.json())
            .then(data => console.log('Telemetría registrada:', data.status))
            .catch(() => {});
    }

    registrarApertura();
});