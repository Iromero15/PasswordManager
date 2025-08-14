const express = require('express');
const { getIp } = require('../utils/ip');
const { logIpLinea } = require('../lib/log');
const { loadUserWords, saveUserWords } = require('../lib/words');
const { hashPalabra, deriveKey, clampLen, DEFAULT_LEN } = require('../utils/crypto');

const router = express.Router();

/**
 * POST /generar-clave
 * Acciones:
 *  - accion = 'buscar'  → NO modifica base; usa n/largo guardados; devuelve clave.
 *  - accion = 'guardar' → SÍ modifica base; aplica modo y largo; devuelve clave.
 *
 * Body: { usuario, palabra, accion, modo?, largo? }
 *   - modo: 'nuevo' | 'igual' | 'mas' | 'menos' (solo en 'guardar')
 *   - largo: entero [8..64] (solo en 'guardar'; si falta, conserva el existente o DEFAULT_LEN en alta)
 */
router.post('/generar-clave', async (req, res) => {
  const { usuario, palabra, accion, modo, largo } = req.body || {};
  const ip = getIp(req);
  logIpLinea('POST /generar-clave', ip).catch(() => {});

  if (!usuario || !palabra) {
    return res.status(400).json({ exito: false, mensaje: 'Datos incompletos' });
  }

  const mapa = loadUserWords(usuario);
  const h = hashPalabra(usuario, palabra);

  // Migración: si había un número, convertir a objeto { n, largo }
  if (typeof mapa[h] === 'number') {
    mapa[h] = { n: mapa[h], largo: DEFAULT_LEN };
  }

  const N_MAX = 5000;

  // --- ACCION: BUSCAR (no escribe) ---
  if (accion === 'buscar') {
    const entry = mapa[h];
    if (!entry) {
      return res.json({ exito: false, notFound: true, mensaje: 'Palabra no encontrada' });
    }
    const n = Math.min(Math.max(1, entry.n || 1), N_MAX);
    const L = clampLen(entry.largo ?? DEFAULT_LEN);
    const claveFinal = deriveKey(usuario, palabra, n, L);
    return res.json({ exito: true, clave: claveFinal, n, largo: L, accion: 'buscar' });
  }

  // --- ACCION: GUARDAR (escribe cambios) ---
  if (accion === 'guardar') {
    if (!modo) {
      return res.status(400).json({ exito: false, mensaje: 'Falta "modo" para guardar' });
    }

    let entry = mapa[h];
    const requestedLen = (largo === undefined || largo === null)
      ? (entry?.largo ?? DEFAULT_LEN)
      : clampLen(largo);

    if (!entry) {
      // alta
      entry = { n: modo === 'nuevo' ? 1 : 1, largo: requestedLen };
    } else {
      // update
      if (modo === 'nuevo') entry.n = 1;
      else if (modo === 'mas') entry.n += 1;
      else if (modo === 'menos') entry.n = Math.max(1, entry.n - 1);
      // igual → no cambia n
      entry.largo = requestedLen; // slider solo se aplica en guardar
    }

    entry.n = Math.min(Math.max(1, entry.n), N_MAX);
    entry.largo = clampLen(entry.largo ?? DEFAULT_LEN);

    mapa[h] = entry;

    try {
      saveUserWords(usuario, mapa);
    } catch (e) {
      console.error('Error guardando archivo de usuario:', e);
      return res.status(500).json({ exito: false, mensaje: 'No se pudo guardar' });
    }

    const claveFinal = deriveKey(usuario, palabra, entry.n, entry.largo);
    return res.json({ exito: true, clave: claveFinal, n: entry.n, largo: entry.largo, accion: 'guardar' });
  }

  // Si no vino accion válida:
  return res.status(400).json({ exito: false, mensaje: 'Acción inválida (usar "buscar" o "guardar")' });
});

module.exports = router;
