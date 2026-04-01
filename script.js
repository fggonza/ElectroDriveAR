const carSelect = document.getElementById('car-select');
const sohRange = document.getElementById('soh-range');
const sohDisplay = document.getElementById('soh-display');
const socRange = document.getElementById('soc-range');
const socDisplay = document.getElementById('soc-display');
const effRange = document.getElementById('efficiency-range');
const effDisplay = document.getElementById('eff-display');
const rangeDisplay = document.getElementById('range-display');

function updateCalculator() {
    // 1. Obtener valores base
    const baseCapacity = parseFloat(carSelect.value);
    const soh = parseInt(sohRange.value) / 100;
    const soc = parseInt(socRange.value) / 100;
    const efficiency = parseFloat(effRange.value);

    // 2. Lógica de Degradación: Capacidad Real disponible
    const realCapacity = baseCapacity * soh;

    // 3. Energía actual en la batería (kWh disponibles ahora)
    const currentEnergy = realCapacity * soc;

    // 4. Cálculo de Autonomía: Energía * km/kWh
    const totalRange = currentEnergy * efficiency;

    // 5. Actualizar UI
    sohDisplay.textContent = `${sohRange.value}%`;
    socDisplay.textContent = socRange.value;
    effDisplay.textContent = efficiency;
    rangeDisplay.textContent = Math.round(totalRange);

    // Feedback visual dinámico (opcional: cambia color si la batería es baja)
    rangeDisplay.style.color = (soc < 0.2) ? '#ff4d4d' : 'var(--accent)';
}

// Event Listeners para reactividad inmediata
[carSelect, sohRange, socRange, effRange].forEach(el => {
    el.addEventListener('input', updateCalculator);
});

// Inicialización
updateCalculator();