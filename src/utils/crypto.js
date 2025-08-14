const crypto = require('crypto');
const { PEPPER_KEYS } = require('../config');

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

const LENGTH_MIN = 8;
const LENGTH_MAX = 64;
const DEFAULT_LEN = 16;

function clampLen(len) {
  const n = Number(len);
  if (!Number.isFinite(n)) return DEFAULT_LEN;
  return Math.max(LENGTH_MIN, Math.min(LENGTH_MAX, Math.floor(n)));
}

function hashPalabra(usuario, palabra) {
  return b64url(
    crypto.createHmac('sha256', PEPPER_KEYS)
      .update(`${usuario}:${palabra}`, 'utf8')
      .digest()
  );
}

function deriveKey(usuario, palabra, n, len = DEFAULT_LEN) {
  let acc = Buffer.from(usuario + palabra, 'utf-8');
  for (let i = 0; i < n; i++) {
    acc = crypto.createHash('sha256').update(acc).digest();
  }
  const L = clampLen(len);
  return b64url(acc).slice(0, L);
}

module.exports = { b64url, hashPalabra, deriveKey, clampLen, LENGTH_MIN, LENGTH_MAX, DEFAULT_LEN };