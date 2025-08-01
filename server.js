const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Guardamos intentos fallidos por IP
const intentosFallidos = {};
const LIMITE_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 60 * 1000; // 1 minuto

function obtenerIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

app.post('/login', async (req, res) => {
  const { usuario, clave } = req.body;
  const ip = obtenerIp(req);

  // Bloqueo activo
  if (
    intentosFallidos[ip] &&
    intentosFallidos[ip].bloqueadoHasta > Date.now()
  ) {
    const espera = Math.ceil((intentosFallidos[ip].bloqueadoHasta - Date.now()) / 1000);
    return res.json({
      exito: false,
      mensaje: `Demasiados intentos fallidos. Intentá de nuevo en ${espera} segundos.`
    });
  }

  try {
    const data = fs.readFileSync('./usuarios.json', 'utf-8');
    const usuarios = JSON.parse(data);

    const encontrado = usuarios.find(u => u.usuario === usuario);

    if (!encontrado) {
      registrarFallo(ip);
      return res.json({ exito: false, mensaje: "Usuario incorrecto" });
    }

    const valido = await bcrypt.compare(clave, encontrado.hash);

    if (valido) {
      // Éxito: reiniciar contador
      delete intentosFallidos[ip];
      return res.json({ exito: true, mensaje: "Inicio de sesión exitoso" });
    } else {
      registrarFallo(ip);
      return res.json({ exito: false, mensaje: "Contraseña incorrecta" });
    }
  } catch (err) {
    console.error('Error al procesar login:', err);
    return res.status(500).json({ exito: false, mensaje: "Error interno del servidor" });
  }
});

function registrarFallo(ip) {
  if (!intentosFallidos[ip]) {
    intentosFallidos[ip] = { intentos: 1, bloqueadoHasta: 0 };
  } else {
    intentosFallidos[ip].intentos += 1;
  }

  if (intentosFallidos[ip].intentos >= LIMITE_INTENTOS) {
    intentosFallidos[ip].bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO_MS;
  }
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});