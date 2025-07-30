const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Base de datos
const db = new sqlite3.Database('./db.sqlite');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);
  // Usuario de prueba: admin / 1234
  const hash = bcrypt.hashSync("1234", 10);
  db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, ["admin", hash]);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de login
app.post('/login', (req, res) => {
  const { usuario, clave } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [usuario], (err, row) => {
    if (row && bcrypt.compareSync(clave, row.password)) {
      res.redirect(`/success.html?lang=${req.query.lang || 'es'}`);
    } else {
      res.send('<script>alert("Credenciales incorrectas"); window.history.back();</script>');
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
});