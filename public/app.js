document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const inputUsuario = document.getElementById('usuario');
  const inputClave = document.getElementById('clave');
  const resultado = document.getElementById('resultado');

  // ✔️ Listener para Enter en el campo de contraseña
  inputClave.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      btnLogin.click();
    }
  });

  // ✔️ Listener para clic en el botón
  btnLogin.addEventListener('click', async () => {
    const usuario = inputUsuario.value.trim();
    const clave = inputClave.value;

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

    <label for="claveUsuario">Palabra clave:</label><br>
    <input type="text" id="claveUsuario" placeholder="Ej: familia"><br><br>

    <label for="modo">Modo de generación:</label><br>
    <select id="modo">
      <option value="igual">n (igual)</option>
      <option value="mas">n + 1</option>
      <option value="menos">n - 1</option>
    </select><br><br>

    <button id="btnGenerar">Generar contraseña segura</button>
    <button id="btnNueva">Agregar nueva palabra (n = 1)</button>

    <p><strong>Contraseña generada:</strong></p>
    <p id="claveGenerada" style="font-size: 1.4em; color: green;"></p>
  `;

  const palabraInput = document.getElementById('claveUsuario');
  const modoSelect = document.getElementById('modo');
  const salida = document.getElementById('claveGenerada');

  const generarClave = async (modoElegido) => {
    const palabra = palabraInput.value.trim();
    if (!palabra) {
      salida.innerText = "Debe ingresar una palabra clave.";
      return;
    }

    try {
      const res = await fetch('/generar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, palabra, modo: modoElegido })
      });

      const data = await res.json();

      if (data.exito) {
        salida.innerText = `${data.clave}  (n = ${data.n})`;
      } else {
        salida.innerText = data.mensaje || 'Error al generar la clave';
      }
    } catch (error) {
      console.error('Error al generar clave:', error);
      salida.innerText = 'Error de conexión con el servidor';
    }
  };

  document.getElementById('btnGenerar').addEventListener('click', () => {
    generarClave(modoSelect.value);
  });

  document.getElementById('btnNueva').addEventListener('click', () => {
    generarClave('nuevo');
  });
}
