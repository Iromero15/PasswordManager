const bcrypt = require('bcrypt');

const contraseña = 'Tecl@do2020'; // tu clave real
const rondas = 10; // seguridad (más alto = más lento y seguro)

bcrypt.hash(contraseña, rondas, (err, hash) => {
  if (err) throw err;
  console.log('Hash generado:\n', hash);
});