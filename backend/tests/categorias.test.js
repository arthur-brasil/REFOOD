jest.mock('../config/database', () => require('./helpers/mockPool').criarPoolMock());

const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /categorias', () => {
  it('lista todas as categorias', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Laticinios', icone: '🥛' }],
    });

    const res = await request(app).get('/categorias');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /categorias', () => {
  it('retorna 400 quando não informa o nome', async () => {
    const res = await request(app).post('/categorias').send({ icone: '🥛' });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('cria a categoria com sucesso', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 7, nome: 'Congelados', icone: '🧊' }] });

    const res = await request(app).post('/categorias').send({ nome: 'Congelados', icone: '🧊' });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Congelados');
  });

  it('retorna 400 amigável quando o nome já existe (unique violation)', async () => {
    const erro = new Error('duplicate key value violates unique constraint');
    erro.code = '23505';
    pool.query.mockRejectedValueOnce(erro);

    const res = await request(app).post('/categorias').send({ nome: 'Laticinios' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Já existe uma categoria com esse nome');
  });
});

describe('PUT /categorias/:id', () => {
  it('retorna 404 quando a categoria não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/categorias/999').send({ nome: 'X', icone: '❓' });

    expect(res.status).toBe(404);
  });

  it('atualiza com sucesso', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Laticínios', icone: '🥛' }] });

    const res = await request(app).put('/categorias/1').send({ nome: 'Laticínios', icone: '🥛' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Laticínios');
  });
});

describe('DELETE /categorias/:id', () => {
  it('retorna 404 quando a categoria não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/categorias/999');

    expect(res.status).toBe(404);
  });

  it('bloqueia a exclusão quando existem alimentos vinculados (FK violation)', async () => {
    const erro = new Error('update or delete on table "categorias" violates foreign key constraint');
    erro.code = '23503';
    pool.query.mockRejectedValueOnce(erro);

    const res = await request(app).delete('/categorias/1');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Não é possível excluir: existem alimentos vinculados a esta categoria');
  });

  it('exclui com sucesso quando não há alimentos vinculados', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 9, nome: 'Enlatados' }] });

    const res = await request(app).delete('/categorias/9');

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('Categoria excluída com sucesso');
  });
});
