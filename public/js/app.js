// Constantes del vehículo (BYD Dolphin Mini GS)
const RANGO_BASE_KM = 380; 
const DEGRADACION_ANUAL = 0.015; // Asumimos un 1.5% de pérdida de capacidad por año

// Selectores del DOM
const socInput = document.getElementById('soc');
const yearsInput = document.getElementById('years');
const socValue = document.getElementById('soc-value');
const yearsValue = document.getElementById('years-value');
const outputAutonomia = document.getElementById('autonomia');

// Función principal de cálculo
function calcularAutonomia() {
  const soc = parseInt(socInput.value);
  const years = parseInt(yearsInput.value);

  // Actualizamos los textos de los labels
  socValue.textContent = `${soc}%`;
  yearsValue.textContent = years === 1 ? '1 año' : `${years} años`;

  // Cálculo: Salud de batería restante
  const saludBateria = 1 - (years * DEGRADACION_ANUAL);
  
  // Cálculo: Rango actual basado en degradación y % de carga
  const rangoMaximoActual = RANGO_BASE_KM * saludBateria;
  const rangoEstimado = Math.round(rangoMaximoActual * (soc / 100));

  // Render en UI
  outputAutonomia.textContent = rangoEstimado;
}

// Listeners: Usamos 'input' en lugar de 'change' para fluidez a 60fps
socInput.addEventListener('input', calcularAutonomia);
yearsInput.addEventListener('input', calcularAutonomia);

// Init para setear valores por defecto al cargar
calcularAutonomia();