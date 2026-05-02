// public/js/app.js
const socS = document.getElementById('soc-slider');
const yearS = document.getElementById('years-slider');
const rangeT = document.getElementById('range-value');

async function solicitarCalculo() {
    const soc = socS.value;
    const years = yearS.value;

    // Llamada asíncrona a nuestra API interna
    try {
        const res = await fetch(`/.netlify/functions/calcular?soc=${soc}&years=${years}`);
        const data = await res.json();
        
        // Actualizamos la UI con la respuesta del servidor
        rangeT.innerText = data.km;
        rangeT.style.color = soc < 20 ? '#ff4b2b' : '#39ff14';
    } catch (err) {
        console.error("Error conectando con el backend");
    }
}

// Eventos reactivos
socS.oninput = solicitarCalculo;
yearS.oninput = solicitarCalculo;