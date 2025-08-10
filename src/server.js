const express = require('express');
const path = require('path');
const { TRUST_PROXY } = require('./config');
const authRoutes = require('./routes/auth');
const keysRoutes = require('./routes/keys');

function createServer() {
  const app = express();

  if (TRUST_PROXY) app.set('trust proxy', true);
  app.use(express.json());

  // servir frontend
  const rootDir = path.resolve(__dirname, '..');
  app.use(express.static(path.join(rootDir, 'public')));

  // rutas API
  app.use(authRoutes);
  app.use(keysRoutes);

  // manejador de errores (simple)
  app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { createServer };