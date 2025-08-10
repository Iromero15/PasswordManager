require('dotenv').config();
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3000);
const TRUST_PROXY = String(process.env.TRUST_PROXY || 'true').toLowerCase() === 'true';

const PATHS = {
  root: ROOT,
  public: path.join(ROOT, 'public'),
  usuarios: path.join(ROOT, 'usuarios.json'),
  palabrasDir: path.join(ROOT, 'palabras'),
  ipsLog: path.join(ROOT, 'ips.jsonl'),
};

const PEPPER_KEYS = process.env.PEPPER_KEYS || 'cambia-esto-en-produccion';
const DUMMY_HASH =
  process.env.DUMMY_HASH ||
  '$2b$10$IX5J0z7sCgh1P2G7y2N7Aej8H5QF7z2mQw1kYbY0r9x3c0p9o7C2K';

const RATE_LIMIT = {
  LIMITE_INTENTOS: 5,
  TIEMPO_BLOQUEO_MS: 60 * 1000
};

module.exports = {
  PORT,
  TRUST_PROXY,
  PATHS,
  PEPPER_KEYS,
  DUMMY_HASH,
  RATE_LIMIT
};