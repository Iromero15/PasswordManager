const crypto = require('crypto');
const { PEPPER_KEYS } = require('../config');

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function hashPalabra(usuario, palabra) {
  return b64url(
    crypto.createHmac('sha256', PEPPER_KEYS)
      .update(`${usuario}:${palabra}`, 'utf8')
      .digest()
  );
}

function deriveKey(usuario, palabra, n) {
  let acc = Buffer.from(usuario + palabra, 'utf-8');
  for (let i = 0; i < n; i++) {
    acc = crypto.createHash('sha256').update(acc).digest();
  }
  return b64url(acc).slice(0, 16); // 16 chars URL-safe
}

module.exports = { b64url, hashPalabra, deriveKey };