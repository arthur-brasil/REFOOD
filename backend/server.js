const express = require('express');
const cors = require('cors');
require('dotenv').config();
const alimentosRoutes = require('./routes/alimentos');
const categoriasRoutes = require('./routes/categorias');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '🌿 ReFood API funcionando!' });
});

app.use('/alimentos', alimentosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/relatorios', relatoriosRoutes);

const PORT = process.env.PORT || 3000;

// Só sobe o servidor (e conecta no banco, via config/database) quando o
// arquivo é executado diretamente (`node server.js`). Isso permite que os
// testes (backend/tests) importem `app` com o Supertest sem abrir uma porta
// nem exigir conexão real com o Neon.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
