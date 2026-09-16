// ==========================================
// INICIALIZACIÓN SEGURA (Espera a que el HTML cargue)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. LÓGICA DE NAVEGACIÓN (TABS)
    // ==========================================
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Apagar todos
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            // Encender el clickeado
            btn.classList.add('active');
            const targetView = document.getElementById(btn.getAttribute('data-target'));
            if(targetView) targetView.classList.add('active');
        });
    });

    // ==========================================
    // 2. ESTADO GLOBAL Y VARIABLES
    // ==========================================
    const DEGRADACION_ANUAL = 0.015; // 1.5% de pérdida por año
    
    // Fallback: Si falla el JSON, la app arranca igual con tu auto
    let vehiculoActivo = {
        id: "byd-dolphin-mini-gs",
        marca: "BYD",
        modelo: "Dolphin Mini GS",
        bateria_kwh: 43.2,
        autonomia_km: 380
    };

    // ==========================================
    // 3. LÓGICA DE CÁLCULO DE AUTONOMÍA
    // ==========================================
    const socSlider = document.getElementById('soc-slider');
    const yearsSlider = document.getElementById('years-slider');
    const socDisplay = document.getElementById('soc-display');
    const yearsDisplay = document.getElementById('years-display');
    const rangeValue = document.getElementById('range-value');
    const evTitle = document.getElementById('ev-title');
    const evBadge = document.getElementById('ev-badge');
    const consumptionSlider = document.getElementById('consumption-slider');
    const consumptionInput = document.getElementById('consumption-input');

 function calcularAutonomia() {
        if (!vehiculoActivo || !socSlider || !consumptionSlider) return; 

        const soc = parseInt(socSlider.value);
        const years = parseInt(yearsSlider.value);
        const consumo = parseFloat(consumptionSlider.value);

        // Actualizar UI de los sliders y textos
        socDisplay.textContent = `${soc}%`;
        yearsDisplay.textContent = years === 1 ? '1 año' : `${years} años`;
        consumptionInput.value = consumo.toFixed(1);

        // Matemática: Batería neta disponible según SOC y degradación
        const saludBateria = 1 - (years * DEGRADACION_ANUAL);
        const kwhDisponibles = (vehiculoActivo.bateria_kwh * saludBateria) * (soc / 100);

        // Autonomía calculada según rendimiento real: (kWh disponibles / consumo cada 100km) * 100
        const rangoEstimado = consumo > 0 ? Math.round((kwhDisponibles / consumo) * 100) : 0;

        // Renderizar resultado
        rangeValue.textContent = rangoEstimado;
    }

    // Activar sliders
    if (socSlider && yearsSlider) {
        socSlider.addEventListener('input', calcularAutonomia);
        yearsSlider.addEventListener('input', calcularAutonomia);

// Sincronización del slider con el input manual
        consumptionSlider.addEventListener('input', () => {
            consumptionInput.value = consumptionSlider.value;
            calcularAutonomia();
        });

        consumptionInput.addEventListener('input', () => {
            let val = parseFloat(consumptionInput.value);
            if (!isNaN(val)) {
                if (val > 20) val = 20;
                if (val < 10) val = 10;
                consumptionSlider.value = val;
                calcularAutonomia();
            }
        });


        calcularAutonomia(); // Primera carga de números
    }

    // ==========================================
    // 4. CARGA DE JSON Y SELECTOR DE VEHÍCULO
    // ==========================================
    const selectVehiculo = document.getElementById('vehiculo-select');
    const infoVehiculo = document.getElementById('vehiculo-info');

    async function cargarVehiculos() {
        if (!selectVehiculo) return;

        try {
            // Usamos ruta relativa por seguridad en servidores locales
            const response = await fetch('data/vehiculos.json'); 
            const vehiculosDB = await response.json();
            
            // Poblar el selector
            selectVehiculo.innerHTML = '';
            vehiculosDB.forEach(auto => {
                const option = document.createElement('option');
                option.value = auto.id;
                option.textContent = `${auto.marca} ${auto.modelo}`;
                selectVehiculo.appendChild(option);
            });

            // Escuchar cambios en la lista
            selectVehiculo.addEventListener('change', (e) => {
                const seleccionado = vehiculosDB.find(v => v.id === e.target.value);
                if (seleccionado) {
                    vehiculoActivo = seleccionado;
                    
                    // Actualizar textos en pantalla
                    infoVehiculo.innerHTML = `
                        <strong>Batería:</strong> ${vehiculoActivo.bateria_kwh} kWh <br>
                        <strong>Autonomía Base WLTP:</strong> ${vehiculoActivo.autonomia_km} km
                    `;
                    evTitle.textContent = `${vehiculoActivo.marca} ${vehiculoActivo.modelo}`;
                    evBadge.textContent = `${vehiculoActivo.bateria_kwh} kWh`;
                    
                    // Recalcular
                    calcularAutonomia();
                }
            });

            // Disparar la selección inicial del JSON
            selectVehiculo.dispatchEvent(new Event('change'));

        } catch (error) {
            console.error("Error cargando vehiculos.json. Usando BYD Dolphin de respaldo.", error);
            selectVehiculo.innerHTML = '<option>Error al cargar catálogo</option>';
        }
    }

    // Iniciar el fetch
    cargarVehiculos();

});