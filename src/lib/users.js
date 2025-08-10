const fs = require('fs');
const { PATHS } = require('../config');

let usuariosMap = {};
try {
  usuariosMap = JSON.parse(fs.readFileSync(PATHS.usuarios, 'utf-8'));
} catch {
  usuariosMap = {};
}

// recarga si cambia el archivo
try {
  fs.watch(PATHS.usuarios, { persistent: false }, () => {
    try {
      usuariosMap = JSON.parse(fs.readFileSync(PATHS.usuarios, 'utf-8'));
      console.log('usuarios.json recargado');
    } catch {
      /* ignorar lecturas parciales */
    }
  });
} catch {
  // no crítico
}

function getUserHash(usuario) {
  return usuariosMap[usuario];
}

module.exports = { getUserHash };