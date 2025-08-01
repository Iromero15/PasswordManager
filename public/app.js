// Este script debe cargarse como <script type="module" src="app.js"></script>

document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const inputUsuario = document.getElementById('usuario');
  const inputClave = document.getElementById('clave');
  const resultado = document.getElementById('resultado');

  btnLogin.addEventListener('click', async () => {
    const usuario = inputUsuario.value.trim();
    const clave = inputClave.value;

    document.getElementById('clave').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('btnLogin').click();
  }
});
    if (!usuario || !clave) {
      resultado.innerText = 'Completa ambos campos';
      return;
    }

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, clave })
      });

      const data = await res.json();

      if (data.exito) {
        mostrarPanel(usuario);
      } else {
        resultado.innerText = data.mensaje || 'Error al iniciar sesión';
      }
    } catch (error) {
      console.error('Error en fetch:', error);
      resultado.innerText = 'Error de conexión con el servidor';
    }
  });
});

function mostrarPanel(usuario) {
  document.body.innerHTML = `
    <h2>Bienvenido, ${usuario}</h2>
    <p>Haz clic para generar una palabra clave:</p>
    <button onclick="generarPalabra()">Generar palabra</button>
    <p id="palabra"></p>
  `;
}

function generarPalabra() {
  const palabras = ["puerta", "fuerza", "lluvia", "clave", "sol"];
  const aleatoria = palabras[Math.floor(Math.random() * palabras.length)];
  document.getElementById('palabra').innerText = aleatoria;
}