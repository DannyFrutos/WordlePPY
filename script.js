const MAX_INTENTOS = 6;

let intentosRestantes = MAX_INTENTOS;
let palabraSeleccionada;
const botonIntentar = document.getElementById("guess-button");
const inputIntento = document.getElementById('guess-input');
const container = document.getElementById('container');
const botonReiniciar = document.getElementById("reset-button");
const botonEmpezar = document.getElementById("start-button");
const wordLengthSelector = document.getElementById("word-length");
const selectorLength = document.getElementById("word-lengthtxt");
const loading = document.getElementById('loading-message');
const guesses = document.getElementById('guesses');

botonIntentar.addEventListener('click', intentar);
botonReiniciar.addEventListener('click', reiniciarJuego);
botonEmpezar.addEventListener('click', iniciarJuego);

async function seleccionarPalabraAleatoria() {
    const wordLength = wordLengthSelector.value;
    const API_URL = `https://random-word-api.herokuapp.com/word?length=${wordLength}&lang=es`;

    return fetch(API_URL)
        .then(response => response.json())
        .then(response => response[0].toUpperCase())
        .catch(err => {
            console.error(err);
            throw err;
        });
}

async function iniciarJuego() {
    try {
        wordLengthSelector.style.display = 'none';
        botonEmpezar.style.display = 'none';
        selectorLength.style.display = 'none';
        loading.style.display = 'inline-block';

        palabraSeleccionada = await seleccionarPalabraAleatoria();
        
        console.log('Palabra seleccionada:', palabraSeleccionada);

        inputIntento.setAttribute('maxlength', palabraSeleccionada.length);
        inputIntento.style.display = 'block';
        botonIntentar.style.display = 'inline-block';
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error al iniciar el juego:', error);
    }
}

function intentar() {
    const intento = obtenerIntentoUsuario();
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.textContent = '';

    if (intento.length !== palabraSeleccionada.length) {
        errorMessageDiv.textContent = 'La palabra ingresada no tiene el tamaño correcto.';
        return;
    }

    const grid = document.getElementById("grid");
    const row = crearRow(intento, palabraSeleccionada);
    grid.appendChild(row);

    if (intento === palabraSeleccionada) {
        finalizarJuego(0);
    } else {
        intentosRestantes--;

        if (intentosRestantes === 0) {
            finalizarJuego(1);
        }
    }

    inputIntento.value = '';
}

function obtenerIntentoUsuario() {
    return inputIntento.value.toUpperCase();
}

function crearRow(intento, palabra) {
    const row = document.createElement('div');
    row.className = 'row';

    for (let i = 0; i < palabra.length; i++) {
        const letra = crearLetra(intento[i], palabra[i]);
        letra.style.animationDelay = `${i * 0.5}s`;
        row.appendChild(letra);
    }

    return row;
}

function crearLetra(letraIntento, letraPalabra) {
    const span = document.createElement('span');
    span.className = 'letter';
    span.innerHTML = letraIntento;

    if (letraIntento === letraPalabra) {
        span.style.backgroundColor = '#79b851';
    } else if (palabraSeleccionada.includes(letraIntento)) {
        span.style.backgroundColor = '#f3c237';
    } else {
        span.style.backgroundColor = '#a4aec4';
    }

    return span;
}

function finalizarJuego(tipo) {
    inputIntento.disabled = true;
    botonIntentar.disabled = true;
    botonIntentar.style.display = 'none';

    const tiempoTotalAnimacion = palabraSeleccionada.length * 0.5 * 1000;

    setTimeout(() => {
        botonIntentar.style.display = 'none';
        container.style.boxShadow = tipo === 0
            ? '0 14px 28px rgba(74, 189, 21, 0.25), 0 10px 10px rgba(17, 203, 27, 0.22)'
            : '0 14px 28px rgba(207, 14, 14, 0.25), 0 10px 10px rgba(221, 3, 3, 0.22)';
        
        guesses.innerHTML = tipo === 0
            ? '<h1 class="ganaste">Ganaste :D 🥳</h1>'
            : '<h1 class="perdiste">Perdiste D: 😵</h1>';
        
        botonReiniciar.style.display = 'inline-block';
    }, tiempoTotalAnimacion);
}

function reiniciarJuego() {
    container.style.boxShadow = '0 10px 18px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)';
    wordLengthSelector.style.display = 'inline-block';
    botonEmpezar.style.display = 'inline-block';
    selectorLength.style.display = 'inline-block';
    inputIntento.style.display = 'none';
    botonIntentar.style.display = 'none';
    document.getElementById('grid').innerHTML = '';
    guesses.innerHTML = '';
    botonReiniciar.style.display = 'none';
    inputIntento.value = '';
    inputIntento.disabled = false;
    botonIntentar.disabled = false;
    intentosRestantes = MAX_INTENTOS;
}
