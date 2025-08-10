const { createServer } = require('./server');
const { PORT } = require('./config');

const app = createServer();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});