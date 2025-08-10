const fs = require('fs');
const path = require('path');
const { PATHS } = require('../config');

if (!fs.existsSync(PATHS.palabrasDir)) {
  fs.mkdirSync(PATHS.palabrasDir, { recursive: true });
}

function sanitizeUser(u) {
  return String(u).normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}
function userFile(usuario) {
  return path.join(PATHS.palabrasDir, `${sanitizeUser(usuario)}.json`);
}

// { [hashPalabra]: n }
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

module.exports = { loadUserWords, saveUserWords };