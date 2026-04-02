const car = document.getElementById('car-select');
const soh = document.getElementById('soh-range');
const sStart = document.getElementById('soc-start');
const sEnd = document.getElementById('soc-end');
const eff = document.getElementById('eff-range');
const rangeS = document.getElementById('range-slider');

function calculate(trigger) {
    const batteryCap = parseFloat(car.value);
    const health = parseInt(soh.value) / 100;
    const performance = parseFloat(eff.value);
    const realCap = batteryCap * health;

    // 1. Validar solapamiento de puntas (Batería)
    let valStart = parseInt(sStart.value);
    let valEnd = parseInt(sEnd.value);

    if (trigger === 'start' && valStart > valEnd) sEnd.value = valStart;
    if (trigger === 'end' && valEnd < valStart) sStart.value = valEnd;

    valStart = parseInt(sStart.value);
    valEnd = parseInt(sEnd.value);
    const deltaSOC = (valEnd - valStart) / 100;

    // 2. Lógica Bidireccional
    if (trigger === 'range') {
        const targetKm = parseFloat(rangeS.value);
        const neededSOC = (targetKm / performance) / realCap;
        const newEnd = valStart + (neededSOC * 100);
        sEnd.value = Math.min(100, Math.max(valStart, newEnd.toFixed(1)));
        valEnd = sEnd.value;
    }

    const finalRange = realCap * ((valEnd - valStart) / 100) * performance;

    // 3. Actualizar UI
    document.getElementById('soh-val').textContent = soh.value + '%';
    document.getElementById('soc-range-text').textContent = `${valStart}% - ${valEnd}%`;
    document.getElementById('soc-delta').textContent = Math.round(valEnd - valStart);
    document.getElementById('eff-val').textContent = performance;
    document.getElementById('km-val').textContent = Math.round(finalRange);

    if (trigger !== 'range') {
        rangeS.value = finalRange;
    }
}

function setEff(val) {
    eff.value = val;
    calculate('eff');
}

// Eventos de interacción
car.addEventListener('change', () => calculate('normal'));
soh.addEventListener('input', () => calculate('normal'));
sStart.addEventListener('input', () => calculate('start'));
sEnd.addEventListener('input', () => calculate('end'));
eff.addEventListener('input', () => calculate('eff'));
rangeS.addEventListener('input', () => calculate('range'));

// Inicio
calculate();
