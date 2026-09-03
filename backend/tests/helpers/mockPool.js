// Mock do pool do 'pg' pra rodar os testes sem depender de conexão real
// com o Neon (a porta 5432 nem sempre é alcançável, e testes não devem
// mexer no banco de verdade de qualquer forma).
//
// Uso em um arquivo de teste:
//
//   jest.mock('../config/database', () => require('./helpers/mockPool').criarPoolMock());
//   const pool = require('../config/database'); // é o mock acima
//   pool.query.mockResolvedValueOnce({ rows: [...] });
//
// Pra rotas que usam transação (pool.connect() + client.query(...)):
//
//   const client = await pool.connect(); // sempre devolve pool._client
//   pool._client.query.mockResolvedValueOnce(...); // BEGIN
//   pool._client.query.mockResolvedValueOnce({ rows: [...] }); // SELECT
//   ...

function criarClienteMock() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

function criarPoolMock() {
  const client = criarClienteMock();
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(client),
    _client: client,
  };
}

module.exports = { criarPoolMock, criarClienteMock };
