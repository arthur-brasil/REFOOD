jest.mock('../config/database', () => require('./helpers/mockPool').criarPoolMock());

const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /relatorios/desperdicio', () => {
  it('monta resumo geral + quebra por categoria, convertendo tudo pra number', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total_descartado: 4, total_consumido: 9 }] }) // totais gerais
      .mockResolvedValueOnce({
        rows: [
          { categoria: 'Laticinios', total_descartado: 3, total_consumido: 5, quantidade_descartada: '2.50' },
          { categoria: 'Frutas', total_descartado: 1, total_consumido: 4, quantidade_descartada: null },
        ],
      }); // vw_desperdicio_por_categoria

    const res = await request(app).get('/relatorios/desperdicio');

    expect(res.status).toBe(200);
    expect(res.body.resumo).toEqual({ total_descartado: 4, total_consumido: 9 });
    expect(res.body.por_categoria).toEqual([
      { categoria: 'Laticinios', total_descartado: 3, total_consumido: 5, quantidade_descartada: 2.5 },
      { categoria: 'Frutas', total_descartado: 1, total_consumido: 4, quantidade_descartada: 0 },
    ]);
  });

  it('devolve 500 se a query falhar', async () => {
    pool.query.mockRejectedValueOnce(new Error('view não existe'));

    const res = await request(app).get('/relatorios/desperdicio');

    expect(res.status).toBe(500);
  });
});

describe('GET /relatorios/historico', () => {
  it('usa limite 50 por padrão', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/relatorios/historico');

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [50]);
  });

  it('respeita o limite informado na query string', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/relatorios/historico?limit=10');

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [10]);
  });

  it('trava o limite em 200 mesmo se pedirem mais', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/relatorios/historico?limit=99999');

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [200]);
  });
});
