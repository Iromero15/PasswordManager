// public/app.js
document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const inputUsuario = document.getElementById('usuario');
  const inputClave = document.getElementById('clave');
  const resultado = document.getElementById('resultado');

  // Enter en password => login
  inputClave.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      btnLogin.click();
    }
  });

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
        headers: { 'Content-Type': 'application/json' },
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

    <div class="panel">
      <div class="row">
        <label for="claveUsuario"><strong>Palabra clave</strong></label><br>
        <input type="text" id="claveUsuario" placeholder="Ej: familia">
      </div>

      <div class="row">
        <label for="modo"><strong>Modo</strong></label><br>
        <select id="modo">
          <option value="igual">n (igual)</option>
          <option value="mas">n + 1</option>
          <option value="menos">n - 1</option>
          <option value="nuevo">reiniciar (n = 1)</option>
        </select>
        <span class="muted">* Solo afecta al guardar</span>
      </div>

      <div class="row">
        <label for="largo"><strong>Largo de la contraseña</strong></label><br>
        <span class="muted">mín 8 — máx 64</span><br>
        <div class="slider-wrap">
          <input type="range" id="largo" min="8" max="64" step="1" value="16">
          <span id="largoVal">16</span> <span class="muted">caracteres</span>
        </div>
        <div class="muted">* El largo del slider solo se aplica al guardar</div>
      </div>

      <div class="row">
        <button id="btnBuscar">Buscar Palabra</button>
        <button id="btnAgregar">Agregar Palabra</button>
      </div>

      <div class="row">
        <p><strong>Contraseña:</strong></p>
        <p id="claveGenerada" class="ok" style="font-size: 1.3em;"></p>
      </div>
    </div>
  `;

  const palabraInput = document.getElementById('claveUsuario');
  const modoSelect = document.getElementById('modo');
  const salida = document.getElementById('claveGenerada');
  const slider = document.getElementById('largo');
  const sliderVal = document.getElementById('largoVal');

  // Mostrar el valor del slider en vivo
  slider.addEventListener('input', () => {
    sliderVal.textContent = slider.value;
  });

  // ENTER en el campo "palabra" => Buscar Palabra
  palabraInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarClave();
    }
  });

  // --------- Acciones ---------

  // Buscar: NO modifica base. Usa n/largo guardados si existen.
  async function buscarClave() {
    const palabra = palabraInput.value.trim();
    if (!palabra) {
      salida.innerText = "Ingresá una palabra.";
      return;
    }
    try {
      const res = await fetch('/generar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, palabra, accion: 'buscar' })
      });
      const data = await res.json();

      if (data.exito) {
        salida.innerText = `${data.clave}  (n = ${data.n}, largo = ${data.largo})`;
        // reflejar lo guardado en los controles (sin grabar)
        slider.value = data.largo;
        sliderVal.textContent = data.largo;
      } else if (data.notFound) {
        salida.innerText = 'No existe esa palabra en tu base. Podés agregarla.';
      } else {
        salida.innerText = data.mensaje || 'Error al buscar';
      }
    } catch (e) {
      console.error(e);
      salida.innerText = 'Error de conexión con el servidor';
    }
  }

  // Agregar/Guardar: CONFIRMAR antes de escribir. Aplica modo + slider.
  async function guardarClave() {
    const palabra = palabraInput.value.trim();
    const largo = parseInt(slider.value, 10);
    const modo = modoSelect.value;

    if (!palabra) {
      salida.innerText = "Ingresá una palabra.";
      return;
    }

    try {
      // Traer estado actual para mostrar en el confirm
      let nActual = null;
      let largoActual = null;
      try {
        const r0 = await fetch('/generar-clave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, palabra, accion: 'buscar' })
        });
        const d0 = await r0.json();
        if (d0.exito) {
          nActual = d0.n;
          largoActual = d0.largo;
        }
      } catch {}

      // Calcular cómo quedaría
      let nNuevo;
      if (nActual == null) {
        // alta nueva
        nNuevo = (modo === 'nuevo' || modo === 'igual' || modo === 'mas' || modo === 'menos') ? 1 : 1;
      } else {
        nNuevo = nActual;
        if (modo === 'nuevo') nNuevo = 1;
        else if (modo === 'mas') nNuevo = nActual + 1;
        else if (modo === 'menos') nNuevo = Math.max(1, nActual - 1);
        // igual: sin cambios
      }
      const largoNuevo = largo; // slider se aplica al guardar

      // Mensaje de confirmación
      const existeTxt = (nActual == null) ? 'No existe (se creará).' : `Actual: n=${nActual}, largo=${largoActual}`;
      const cambiaTxt = `Nuevo valor: n=${nNuevo}, largo=${largoNuevo}\n\n¿Confirmás actualizar la base de datos?`;
      const ok = window.confirm(`Palabra: "${palabra}"\n${existeTxt}\n${cambiaTxt}`);
      if (!ok) return;

      // Guardar
      const res = await fetch('/generar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, palabra, modo, largo, accion: 'guardar' })
      });
      const data = await res.json();

      if (data.exito) {
        salida.innerText = `${data.clave}  (n = ${data.n}, largo = ${data.largo})`;
        // reflejar lo guardado
        slider.value = data.largo;
        sliderVal.textContent = data.largo;
      } else {
        salida.innerText = data.mensaje || 'Error al guardar';
      }
    } catch (e) {
      console.error(e);
      salida.innerText = 'Error de conexión con el servidor';
    }
  }

  document.getElementById('btnBuscar').addEventListener('click', buscarClave);
  document.getElementById('btnAgregar').addEventListener('click', guardarClave);
}