const rangeValue = document.getElementById('range-value');
const socSlider = document.getElementById('soc-slider');
const yearSlider = document.getElementById('years-slider');

async function updateAll() {
    const soc = socSlider.value;
    const years = yearSlider.value;

    // 1. UX: Encendemos el estado visual de carga antes de viajar a la red
    rangeValue.classList.add('calculando');

    try {
        const response = await fetch(`/.netlify/functions/calcular?soc=${soc}&years=${years}`);
        const data = await response.json();
        
        // 2. Éxito: Actualizamos el número real del Dolphin Mini GS
        rangeValue.innerText = data.km;
    } catch (error) {
        console.error("Error contactando al servidor:", error);
        rangeValue.innerText = "---";
    } finally {
        // 3. Limpieza: Apagamos el efecto luminoso, ya sea que haya fallado o funcionado
        rangeValue.classList.remove('calculando');
    }
}

socSlider.oninput = updateAll;
yearSlider.oninput = updateAll;