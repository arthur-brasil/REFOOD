const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');
const alimentosRoutes = require('./routes/alimentos');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '🌿 ReFood API funcionando!' });
});

app.use('/alimentos', alimentosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});