const fs = require('fs/promises');
const { PATHS } = require('../config');

async function logIpLinea(endpoint, ip) {
  const linea = JSON.stringify({ ip, endpoint, fecha: new Date().toISOString() }) + '\n';
  try {
    await fs.appendFile(PATHS.ipsLog, linea, 'utf-8');
  } catch (e) {
    console.error('Error al registrar IP:', e);
  }
}

module.exports = { logIpLinea };