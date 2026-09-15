jest.mock('../config/database', () => require('./helpers/mockPool').criarPoolMock());

const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /lista-compras', () => {
  it('lista todos os itens sem filtro', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Arroz', comprado: false }] });

    const res = await request(app).get('/lista-compras');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: 'Arroz', comprado: false }]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/^SELECT \* FROM lista_compras ORDER BY/),
      []
    );
  });

  it('filtra por comprado=true', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/lista-compras?comprado=true');

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE comprado = $1'), [true]);
  });

  it('filtra por comprado=false', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/lista-compras?comprado=false');

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE comprado = $1'), [false]);
  });
});

describe('GET /lista-compras/sugestoes', () => {
  it('converte total_saidas pra number', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ nome: 'Leite', categoria: 'Laticinios', total_saidas: '3', ultima_saida: '2026-09-10T00:00:00.000Z' }],
    });

    const res = await request(app).get('/lista-compras/sugestoes');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { nome: 'Leite', categoria: 'Laticinios', total_saidas: 3, ultima_saida: '2026-09-10T00:00:00.000Z' },
    ]);
  });

  it('devolve 500 se a view falhar', async () => {
    pool.query.mockRejectedValueOnce(new Error('view não existe'));

    const res = await request(app).get('/lista-compras/sugestoes');

    expect(res.status).toBe(500);
  });
});

describe('POST /lista-compras', () => {
  it('cria item manual quando origem não é informada', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2, nome: 'Feijão', origem: 'manual' }] });

    const res = await request(app).post('/lista-compras').send({ nome: 'Feijão' });

    expect(res.status).toBe(201);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['Feijão', null, null, 'manual']);
  });

  it('aceita origem "sugestao" quando informada', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 3, nome: 'Leite', origem: 'sugestao' }] });

    await request(app).post('/lista-compras').send({ nome: 'Leite', origem: 'sugestao' });

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['Leite', null, null, 'sugestao']);
  });

  it('ignora origem inválida e usa manual', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 4, nome: 'Ovos', origem: 'manual' }] });

    await request(app).post('/lista-compras').send({ nome: 'Ovos', origem: 'hackeado' });

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['Ovos', null, null, 'manual']);
  });

  it('retorna 400 se faltar nome', async () => {
    const res = await request(app).post('/lista-compras').send({});

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('PUT /lista-compras/:id', () => {
  it('atualiza o item e marca como comprado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Arroz', comprado: true }] });

    const res = await request(app)
      .put('/lista-compras/1')
      .send({ nome: 'Arroz', quantidade: 1, unidade: 'kg', comprado: true });

    expect(res.status).toBe(200);
    expect(res.body.comprado).toBe(true);
  });

  it('retorna 404 se o item não existir', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/lista-compras/999').send({ nome: 'X', comprado: false });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /lista-compras/:id', () => {
  it('remove o item', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app).delete('/lista-compras/1');

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/removido/);
  });

  it('retorna 404 se o item não existir', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/lista-compras/999');

    expect(res.status).toBe(404);
  });
});
