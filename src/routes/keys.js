const express = require('express');
const { getIp } = require('../utils/ip');
const { logIpLinea } = require('../lib/log');
const { loadUserWords, saveUserWords } = require('../lib/words');
const { hashPalabra, deriveKey } = require('../utils/crypto');

const router = express.Router();

router.post('/generar-clave', async (req, res) => {
  const { usuario, palabra, modo } = req.body || {};
  const ip = getIp(req);
  logIpLinea('POST /generar-clave', ip).catch(() => {});

  if (!usuario || !palabra || !modo) {
    return res.status(400).json({ exito: false, mensaje: 'Datos incompletos' });
  }
  const modosValidos = new Set(['nuevo', 'igual', 'mas', 'menos']);
  if (!modosValidos.has(modo)) {
    return res.status(400).json({ exito: false, mensaje: 'Modo inválido' });
  }

  // cargar SOLO palabras del usuario
  const mapa = loadUserWords(usuario);
  const h = hashPalabra(usuario, palabra);

  if (modo === 'nuevo') {
    mapa[h] = 1;
  } else {
    if (!(h in mapa)) {
      mapa[h] = 1;
    } else {
      if (modo === 'mas') mapa[h] += 1;
      if (modo === 'menos') mapa[h] = Math.max(1, mapa[h] - 1);
      // "igual": no cambia
    }
  }

  const N_MAX = 5000;
  mapa[h] = Math.min(Math.max(1, mapa[h]), N_MAX);

  try {
    saveUserWords(usuario, mapa);
  } catch (e) {
    console.error('Error guardando archivo de usuario:', e);
    return res.status(500).json({ exito: false, mensaje: 'No se pudo guardar' });
  }

  const n = mapa[h];
  const claveFinal = deriveKey(usuario, palabra, n);

  return res.json({ exito: true, clave: claveFinal, n });
});

module.exports = router;