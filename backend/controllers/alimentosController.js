const pool = require('../config/database');

// View que já traz categoria, dias_para_vencer e status calculados
const SELECT_BASE = 'SELECT * FROM vw_alimentos_status';

// Listar todos os alimentos
exports.listar = async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = SELECT_BASE;
    const params = [];

    if (categoria) {
      query += ' WHERE categoria = $1';
      params.push(categoria);
    }

    query += ' ORDER BY data_validade ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Resumo de status para o banner de alertas
exports.resumo = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*)::int AS total
      FROM vw_alimentos_status
      GROUP BY status
    `);

    const resumo = { vencido: 0, atencao: 0, em_dia: 0 };
    result.rows.forEach(r => { resumo[r.status] = r.total; });

    res.json(resumo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Buscar um alimento por ID
exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(SELECT_BASE + ' WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Alimento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Resolve o id da categoria a partir do nome ou do proprio id
const resolverCategoriaId = async (categoria, categoria_id) => {
  if (categoria_id) return categoria_id;
  if (!categoria) return null;

  const result = await pool.query('SELECT id FROM categorias WHERE nome = $1', [categoria]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

// Cadastrar alimento
exports.criar = async (req, res) => {
  try {
    const { nome, categoria, categoria_id, quantidade, unidade, data_validade, local_armazenamento } = req.body;

    if (!nome || !quantidade || !unidade || !data_validade) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    }

    const catId = await resolverCategoriaId(categoria, categoria_id);
    if (!catId) {
      return res.status(400).json({ erro: 'Categoria inválida ou não informada' });
    }

    const result = await pool.query(
      `INSERT INTO alimentos (nome, categoria_id, quantidade, unidade, data_validade, local_armazenamento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nome, catId, quantidade, unidade, data_validade, local_armazenamento]
    );

    const novo = await pool.query(SELECT_BASE + ' WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(novo.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Editar alimento
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, categoria_id, quantidade, unidade, data_validade, local_armazenamento } = req.body;

    const catId = await resolverCategoriaId(categoria, categoria_id);
    if (!catId) {
      return res.status(400).json({ erro: 'Categoria inválida ou não informada' });
    }

    const result = await pool.query(
      `UPDATE alimentos
       SET nome = $1, categoria_id = $2, quantidade = $3, unidade = $4,
           data_validade = $5, local_armazenamento = $6
       WHERE id = $7 RETURNING id`,
      [nome, catId, quantidade, unidade, data_validade, local_armazenamento, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Alimento não encontrado' });
    }

    const atualizado = await pool.query(SELECT_BASE + ' WHERE id = $1', [id]);
    res.json(atualizado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Excluir alimento
//
// Antes de remover, grava uma cópia em historico_alimentos com o motivo da
// saída (consumido ou descartado). O mobile ainda não envia status_saida no
// corpo da requisição (isso fica pro Lucas implementar na tela de exclusão,
// com a confirmação "Consumido ou Descartado?"); até lá, o backend assume
// 'descartado' como padrão pra não quebrar a exclusão que já está em uso.
exports.deletar = async (req, res) => {
  const { id } = req.params;
  const { status_saida } = req.body || {};
  const status = ['consumido', 'descartado'].includes(status_saida) ? status_saida : 'descartado';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const alimento = await client.query(
      `SELECT a.*, c.nome AS categoria_nome
       FROM alimentos a
       INNER JOIN categorias c ON a.categoria_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (alimento.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Alimento não encontrado' });
    }

    const a = alimento.rows[0];

    await client.query(
      `INSERT INTO historico_alimentos
         (alimento_id, nome, categoria_id, categoria_nome, quantidade, unidade,
          data_validade, local_armazenamento, status_saida, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [a.id, a.nome, a.categoria_id, a.categoria_nome, a.quantidade, a.unidade,
       a.data_validade, a.local_armazenamento, status, a.criado_em]
    );

    await client.query('DELETE FROM alimentos WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ mensagem: 'Alimento excluído com sucesso', status_saida: status });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
};
