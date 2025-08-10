#!/usr/bin/env node
// scripts/addUser.js
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const USUARIOS_PATH = path.join(PROJECT_ROOT, 'usuarios.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { user: null, rounds: 12, force: false, plain: false, password: null };
  for (const a of args) {
    if (!a.startsWith('--') && !opts.user) { opts.user = a; continue; }
    if (a === '--force') { opts.force = true; continue; }
    if (a === '--plain') { opts.plain = true; continue; }
    if (a.startsWith('--rounds=')) {
      const n = Number(a.split('=')[1]); if (Number.isInteger(n)) opts.rounds = n; continue;
    }
    if (a.startsWith('--password=')) { opts.password = a.slice('--password='.length); continue; }
  }
  return opts;
}

async function ensureUsuariosJson() {
  try {
    const raw = await fsp.readFile(USUARIOS_PATH, 'utf-8');
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  } catch {
    return {};
  }
}

async function atomicWrite(file, data) {
  const tmp = file + '.tmp';
  await fsp.writeFile(tmp, data);
  await fsp.rename(tmp, file);
}

// Prompt visible (no oculto), simple
function promptLine(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const onData = (chunk) => {
      const line = chunk.toString().replace(/\r?\n$/, '');
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      resolve(line);
    };
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', onData);
  });
}

// Prompt oculto con manejo de * y backspace (cruzaplataforma)
function promptHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let buf = '';

    function onData(ch) {
      if (ch === '\r' || ch === '\n') {
        stdout.write('\n');
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        return resolve(buf);
      }
      // Backspace (Win: \x08, Unix: \x7F)
      if (ch === '\x08' || ch === '\x7F') {
        if (buf.length > 0) {
          buf = buf.slice(0, -1);
          stdout.write('\x1b[1D \x1b[1D'); // borra un carácter en pantalla
        }
        return;
      }
      // Evitar caracteres de control
      if (ch < ' ' && ch !== '\t') return;
      buf += ch;
      stdout.write('*'); // muestra *
    }

    stdin.on('data', onData);
  });
}

(async () => {
  const opts = parseArgs();

  let usuario = opts.user;
  if (!usuario) usuario = await promptLine('Usuario: ');
  usuario = String(usuario || '').trim();
  if (!usuario) { console.error('✖ Usuario vacío.'); process.exit(1); }

  let pass1, pass2;
  if (opts.password != null) {
    pass1 = String(opts.password);
    pass2 = pass1;
  } else if (opts.plain) {
    pass1 = await promptLine('Contraseña (visible): ');
    pass2 = await promptLine('Repetir contraseña (visible): ');
  } else {
    console.log('(Escribí la contraseña; no se verá en pantalla)');
    pass1 = await promptHidden('Contraseña: ');
    pass2 = await promptHidden('Repetir contraseña: ');
  }

  if (!pass1) { console.error('✖ Contraseña vacía.'); process.exit(1); }
  if (pass1 !== pass2) { console.error('✖ Las contraseñas no coinciden.'); process.exit(1); }

  const rounds = Math.min(15, Math.max(4, Number(opts.rounds) || 12));

  const usuarios = await ensureUsuariosJson();

  if (usuarios[usuario] && !opts.force) {
    const resp = await promptLine(`El usuario "${usuario}" ya existe. ¿Sobrescribir? (y/N): `);
    if (!/^y(es)?$/i.test(String(resp).trim())) {
      console.log('Operación cancelada.');
      process.exit(0);
    }
  }

  console.log(`Hasheando con bcrypt (rounds=${rounds})...`);
  const hash = await bcrypt.hash(pass1, rounds);

  usuarios[usuario] = hash;
  await atomicWrite(USUARIOS_PATH, JSON.stringify(usuarios, null, 2));
  console.log(`✔ Usuario "${usuario}" actualizado en ${path.relative(PROJECT_ROOT, USUARIOS_PATH)}.`);
  process.exit(0);
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});