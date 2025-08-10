const { RATE_LIMIT } = require('../config');

const intentosFallidos = Object.create(null);

function registrarFallo(ip) {
  const now = Date.now();
  if (!intentosFallidos[ip]) {
    intentosFallidos[ip] = { intentos: 0, bloqueadoHasta: 0 };
  }
  const st = intentosFallidos[ip];
  if (st.bloqueadoHasta > now) return;

  st.intentos += 1;
  if (st.intentos >= RATE_LIMIT.LIMITE_INTENTOS) {
    st.bloqueadoHasta = now + RATE_LIMIT.TIEMPO_BLOQUEO_MS;
    st.intentos = 0;
    console.warn(`⚠️ IP ${ip} bloqueada por ${RATE_LIMIT.TIEMPO_BLOQUEO_MS / 1000}s.`);
  }
}

function segundosRestantesBloqueo(ip) {
  const st = intentosFallidos[ip];
  if (!st || !st.bloqueadoHasta) return 0;
  const ms = st.bloqueadoHasta - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

function limpiarFallo(ip) {
  delete intentosFallidos[ip];
}

module.exports = { registrarFallo, segundosRestantesBloqueo, limpiarFallo };