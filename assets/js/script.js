// Referencias a los elementos del DOM
const inputMonto = document.getElementById("monto");
const selectMoneda = document.getElementById("moneda");
const btnBuscar = document.getElementById("btnBuscar");
const pResultado = document.getElementById("resultado");
const ctx = document.getElementById("grafico"); // Canvas para el gráfico

// URL base de la API mindicador.cl
const baseUrl = "https://mindicador.cl/api/";

let chart = null; // Aquí se guardará la instancia del gráfico Chart.js

// Función para obtener las monedas desde la API y llenar el <select>
async function getMonedas() {
  try {
    const res = await fetch(baseUrl); // Llamada a la API
    const data = await res.json(); // Convertimos la respuesta a JSON

    // Filtramos solo las monedas que queremos mostrar
    const monedasPermitidas = ["dolar", "euro", "bitcoin"];

    // Por cada moneda permitida, creamos una opción en el <select>
    monedasPermitidas.forEach((codigo) => {
      const moneda = data[codigo]; // Obtenemos los datos de esa moneda
      const option = document.createElement("option"); // Creamos <option>
      option.value = codigo;
      option.textContent = moneda.nombre; // Mostramos el nombre en español
      selectMoneda.appendChild(option); // Añadimos al <select>
    });
  } catch (error) {
    // Si ocurre un error (por ejemplo, la API está caída), lo mostramos
    pResultado.textContent = "Error al cargar monedas. Intenta más tarde.";
  }
}

// Función para hacer la conversión de CLP a otra moneda
async function convertirMoneda() {
  const monto = Number(inputMonto.value); // Convertimos el valor ingresado a número
  const codigo = selectMoneda.value; // Obtenemos el código de moneda seleccionada

  // Validamos que se haya ingresado un monto y una moneda
  if (!monto || !codigo) {
    pResultado.textContent = "Debe ingresar un monto y seleccionar una moneda.";
    return;
  }

  try {
    // Llamamos a la API para obtener los datos de esa moneda
    const res = await fetch(`${baseUrl}${codigo}`);
    const data = await res.json();

    // Tomamos el valor actual de la moneda (último disponible)
    const valor = data.serie[0].valor;

    // Calculamos el resultado de la conversión
    const resultado = monto / valor;

    // Mostramos el resultado en el DOM
    pResultado.textContent = `$${monto} CLP ≈ ${resultado.toFixed(
      2
    )} ${codigo.toUpperCase()}`;

    // Llamamos a la función que genera el gráfico con los últimos 10 días
    renderGrafico(data.serie.slice(0, 10).reverse(), codigo);
  } catch (error) {
    // En caso de error (por ejemplo, sin conexión), mostramos mensaje
    pResultado.textContent = "Error al obtener los datos de la moneda.";
  }
}

// Función que genera el gráfico con Chart.js
function renderGrafico(serie, codigo) {
  // Extraemos fechas y valores para mostrar en el gráfico
  const labels = serie.map((item) =>
    new Date(item.fecha).toLocaleDateString("es-CL")
  );
  const valores = serie.map((item) => item.valor);

  // Si ya existe un gráfico anterior, lo eliminamos para no sobreponer
  if (chart) {
    chart.destroy();
  }

  // Creamos el nuevo gráfico
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels, // Fechas (eje X)
      datasets: [
        {
          label: `Historial últimos 10 días - ${codigo.toUpperCase()}`,
          data: valores, // Valores (eje Y)
          borderColor: "#e94b77",
          backgroundColor: "#e94b77",
          tension: 0.3, // Suavizado de línea
        },
      ],
    },
    options: {
      responsive: true, // Se adapta al tamaño del contenedor
      scales: {
        y: {
          beginAtZero: false, // No fuerza a iniciar en cero
        },
      },
    },
  });
}

// Inicializamos la app cargando las monedas cuando se abre la página
getMonedas();

// Agregamos el evento al botón para convertir al hacer clic
btnBuscar.addEventListener("click", convertirMoneda);
