jest.mock('../config/database', () => require('./helpers/mockPool').criarPoolMock());

const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

const client = pool._client;

beforeEach(() => {
  pool.query.mockReset();
  client.query.mockReset();
  pool.connect.mockClear();
});

describe('GET /alimentos', () => {
  it('lista todos os alimentos sem filtro', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Leite Integral', categoria: 'Laticinios', status: 'em_dia' }],
    });

    const res = await request(app).get('/alimentos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM vw_alimentos_status'),
      []
    );
    expect(pool.query.mock.calls[0][0]).not.toContain('WHERE');
  });

  it('filtra por categoria quando informado na query string', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/alimentos?categoria=Laticinios');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE categoria = $1'),
      ['Laticinios']
    );
  });

  it('devolve 500 se a query falhar', async () => {
    pool.query.mockRejectedValueOnce(new Error('conexão perdida'));

    const res = await request(app).get('/alimentos');

    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('conexão perdida');
  });
});

describe('GET /alimentos/resumo', () => {
  it('monta o objeto de totais por status, com 0 pros status ausentes', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { status: 'vencido', total: 2 },
        { status: 'em_dia', total: 5 },
      ],
    });

    const res = await request(app).get('/alimentos/resumo');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ vencido: 2, atencao: 0, em_dia: 5 });
  });
});

describe('GET /alimentos/:id', () => {
  it('retorna 404 quando o alimento não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/alimentos/999');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Alimento não encontrado');
  });

  it('retorna o alimento quando encontrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5, nome: 'Leite Integral' }] });

    const res = await request(app).get('/alimentos/5');

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Leite Integral');
  });
});

describe('POST /alimentos', () => {
  const payloadBase = {
    nome: 'Leite Integral',
    quantidade: 1,
    unidade: 'litro',
    data_validade: '2026-09-15',
    local_armazenamento: 'Geladeira',
  };

  it('retorna 400 quando falta campo obrigatório', async () => {
    const { nome, ...semNome } = payloadBase;

    const res = await request(app).post('/alimentos').send(semNome);

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('retorna 400 quando a categoria informada não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // resolverCategoriaId não acha

    const res = await request(app)
      .post('/alimentos')
      .send({ ...payloadBase, categoria: 'Categoria Fantasma' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Categoria inválida ou não informada');
  });

  it('cadastra com sucesso quando categoria_id é informado direto', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 42 }] }) // INSERT
      .mockResolvedValueOnce({ rows: [{ id: 42, nome: 'Leite Integral' }] }); // SELECT_BASE

    const res = await request(app)
      .post('/alimentos')
      .send({ ...payloadBase, categoria_id: 3 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(42);
  });
});

describe('PUT /alimentos/:id', () => {
  it('retorna 404 quando o alimento não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE não encontra nada

    const res = await request(app)
      .put('/alimentos/999')
      .send({ nome: 'X', categoria_id: 1, quantidade: 1, unidade: 'un', data_validade: '2026-09-15' });

    expect(res.status).toBe(404);
  });

  it('atualiza com sucesso', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ id: 5, nome: 'Leite Desnatado' }] }); // SELECT_BASE

    const res = await request(app)
      .put('/alimentos/5')
      .send({ nome: 'Leite Desnatado', categoria_id: 1, quantidade: 1, unidade: 'litro', data_validade: '2026-09-20' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Leite Desnatado');
  });
});

describe('DELETE /alimentos/:id (grava histórico antes de excluir)', () => {
  const alimento = {
    id: 7,
    nome: 'Iogurte',
    categoria_id: 1,
    categoria_nome: 'Laticinios',
    quantidade: '2.00',
    unidade: 'un',
    data_validade: '2026-09-10',
    local_armazenamento: 'Geladeira',
    criado_em: '2026-08-01T00:00:00.000Z',
  };

  it('retorna 404 e faz rollback quando o alimento não existe', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const res = await request(app).delete('/alimentos/999');

    expect(res.status).toBe(404);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('usa "descartado" como padrão quando status_saida não é informado', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [alimento] }) // SELECT
      .mockResolvedValueOnce(undefined) // INSERT historico
      .mockResolvedValueOnce(undefined) // DELETE
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await request(app).delete('/alimentos/7');

    expect(res.status).toBe(200);
    expect(res.body.status_saida).toBe('descartado');
    const insertCall = client.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO historico_alimentos'));
    expect(insertCall[1]).toContain('descartado');
  });

  it('aceita status_saida "consumido" explicitamente', async () => {
    client.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [alimento] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const res = await request(app).delete('/alimentos/7').send({ status_saida: 'consumido' });

    expect(res.status).toBe(200);
    expect(res.body.status_saida).toBe('consumido');
  });

  it('ignora status_saida inválido e usa "descartado"', async () => {
    client.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [alimento] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const res = await request(app).delete('/alimentos/7').send({ status_saida: 'jogado_no_lixo' });

    expect(res.status).toBe(200);
    expect(res.body.status_saida).toBe('descartado');
  });

  it('faz rollback e devolve 500 se algo falhar no meio da transação', async () => {
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error('falha no SELECT')) // SELECT explode
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const res = await request(app).delete('/alimentos/7');

    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('falha no SELECT');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
