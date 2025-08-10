// server.js
const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// =====================
// Config básica
// =====================
app.set('trust proxy', true); // respeta X-Forwarded-For detrás de proxy
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// Archivos y paths
// =====================
const archivoIPs = path.join(__dirname, 'ips.jsonl');       // log (JSON Lines)
const archivoUsuarios = path.join(__dirname, 'usuarios.json');

const PAL_DIR = path.join(__dirname, 'palabras');           // carpeta por-usuario
if (!fs.existsSync(PAL_DIR)) fs.mkdirSync(PAL_DIR, { recursive: true });

// =====================
// Utilidades "palabras" (solo por usuario)
// =====================
function sanitizeUser(u) {
  return String(u).normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}
function userFile(usuario) {
  return path.join(PAL_DIR, `${sanitizeUser(usuario)}.json`);
}
// lee SOLO las palabras del usuario: { [hashPalabra]: n }
function loadUserWords(usuario) {
  try {
    const raw = fs.readFileSync(userFile(usuario), 'utf-8');
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch {
    return {};
  }
}
function saveUserWords(usuario, obj) {
  fs.writeFileSync(userFile(usuario), JSON.stringify(obj, null, 2));
}

// =====================
// Rate limiting simple por IP (en memoria)
// =====================
const intentosFallidos = Object.create(null);
const LIMITE_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 60 * 1000;

function registrarFallo(ip) {
  const now = Date.now();
  if (!intentosFallidos[ip]) {
    intentosFallidos[ip] = { intentos: 0, bloqueadoHasta: 0 };
  }
  const st = intentosFallidos[ip];
  if (st.bloqueadoHasta > now) return; // ya bloqueado

  st.intentos += 1;
  if (st.intentos >= LIMITE_INTENTOS) {
    st.bloqueadoHasta = now + TIEMPO_BLOQUEO_MS;
    st.intentos = 0;
    console.warn(`⚠️ IP ${ip} bloqueada por 1 minuto.`);
  }
}
function segundosRestantesBloqueo(ip) {
  const st = intentosFallidos[ip];
  if (!st || !st.bloqueadoHasta) return 0;
  const ms = st.bloqueadoHasta - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

// =====================
// IP + logging
// =====================
function obtenerIp(req) {
  return (req.ip || '').replace('::ffff:', '') || '0.0.0.0';
}
async function logIpLinea(endpoint, ip) {
  const linea = JSON.stringify({ ip, endpoint, fecha: new Date().toISOString() }) + '\n';
  try {
    await fsp.appendFile(archivoIPs, linea, 'utf-8');
  } catch (e) {
    console.error('Error al registrar IP:', e);
  }
}

// =====================
// Manejo de usuarios (mapa en memoria { usuario: hash })
// =====================
let usuariosMap = {};
try {
  usuariosMap = JSON.parse(fs.readFileSync(archivoUsuarios, 'utf-8'));
} catch {
  usuariosMap = {};
}
// Recargar si cambia el archivo (best effort)
try {
  fs.watch(archivoUsuarios, { persistent: false }, () => {
    try {
      usuariosMap = JSON.parse(fs.readFileSync(archivoUsuarios, 'utf-8'));
      console.log('usuarios.json recargado');
    } catch {
      /* ignorar lecturas parciales */
    }
  });
} catch {
  // no crítico
}

// Hash dummy para igualar tiempos cuando el usuario no existe
// (podés generar uno propio con bcrypt.hash("dummy-password", 10))
const DUMMY_HASH = "$2b$10$IX5J0z7sCgh1P2G7y2N7Aej8H5QF7z2mQw1kYbY0r9x3c0p9o7C2K";

// =====================
// Hash/HMAC para "palabras"
// =====================
const PEPPER_KEYS = process.env.PEPPER_KEYS || 'cambia-esto-en-produccion';
function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
// HMAC-SHA256 de (usuario:palabra) → base64 URL-safe
function hashPalabra(usuario, palabra) {
  return b64url(
    crypto.createHmac('sha256', PEPPER_KEYS)
      .update(`${usuario}:${palabra}`, 'utf8')
      .digest()
  );
}

// =====================
// Rutas
// =====================

// Login
app.post('/login', async (req, res) => {
  const { usuario, clave } = req.body || {};
  const ip = obtenerIp(req);
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
    const hash = usuariosMap[usuario];               // acceso O(1)
    const ok = await bcrypt.compare(clave, hash || DUMMY_HASH); // iguala tiempos

    if (!hash || !ok) {
      registrarFallo(ip);
      return res.json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });
    }

    delete intentosFallidos[ip];
    return res.json({ exito: true, mensaje: 'Inicio de sesión exitoso' });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// Generar contraseña segura (por usuario, guardando hash de "palabra" → n)
app.post('/generar-clave', async (req, res) => {
  const { usuario, palabra, modo } = req.body || {};
  const ip = obtenerIp(req);
  logIpLinea('POST /generar-clave', ip).catch(() => {});

  if (!usuario || !palabra || !modo) {
    return res.status(400).json({ exito: false, mensaje: 'Datos incompletos' });
  }
  const modosValidos = new Set(['nuevo', 'igual', 'mas', 'menos']);
  if (!modosValidos.has(modo)) {
    return res.status(400).json({ exito: false, mensaje: 'Modo inválido' });
  }

  // Cargar SOLO el mapa del usuario
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

  // Guardar SOLO el mapa del usuario
  try {
    saveUserWords(usuario, mapa);
  } catch (e) {
    console.error('Error guardando archivo de usuario:', e);
    return res.status(500).json({ exito: false, mensaje: 'No se pudo guardar' });
  }

  // Generar la contraseña final (SHA-256 iterado n veces sobre usuario+palabra)
  const n = mapa[h];
  let acc = Buffer.from(usuario + palabra, 'utf-8');
  for (let i = 0; i < n; i++) {
    acc = crypto.createHash('sha256').update(acc).digest();
  }
  const claveFinal = b64url(acc).slice(0, 16); // 16 chars URL-safe

  return res.json({ exito: true, clave: claveFinal, n });
});

// =====================
// Start
// =====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en todas las interfaces, puerto ${PORT}`);
});
