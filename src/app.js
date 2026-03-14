const db = require('./models/db');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

app.use(cors());
//app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '10mb' })); // Incrementa el límite de carga

app.use(express.static('public'));

// Rutas
const routes = require('./routes');
app.use('/api', routes);

// Puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Comprobando bbdd
(async () => {
  try {
    const [results] = await db.query('SELECT 1');
    console.log('Conexión a la base de datos exitosa:', results);
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
})();

  