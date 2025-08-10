const express = require('express');
const bcrypt = require('bcrypt');
const { getUserHash } = require('../lib/users');
const { getIp } = require('../utils/ip');
const { logIpLinea } = require('../lib/log');
const { registrarFallo, segundosRestantesBloqueo, limpiarFallo } = require('../middleware/rateLimit');
const { DUMMY_HASH } = require('../config');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, clave } = req.body || {};
  const ip = getIp(req);
  await logIpLinea('POST /login', ip);

  if (!usuario || !clave) {
    return res.json({ exito: false, mensaje: 'Completa ambos campos' });
  }

  const espera = segundosRestantesBloqueo(ip);
  if (espera > 0) {
    return res.json({
      exito: false,
      mensaje: `Demasiados intentos fallidos. Intentá de nuevo en ${espera} segundos.`
    });
  }

  try {
    const hash = getUserHash(usuario);
    const ok = await bcrypt.compare(clave, hash || DUMMY_HASH);

    if (!hash || !ok) {
      registrarFallo(ip);
      return res.json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });
    }

    limpiarFallo(ip);
    return res.json({ exito: true, mensaje: 'Inicio de sesión exitoso' });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;