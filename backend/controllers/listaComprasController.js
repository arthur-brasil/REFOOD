const pool = require('../config/database');

const ORIGENS_VALIDAS = ['manual', 'sugestao'];

// Listar itens da lista de compras (aceita ?comprado=true|false)
exports.listar = async (req, res) => {
  try {
    const { comprado } = req.query;
    let query = 'SELECT * FROM lista_compras';
    const params = [];

    if (comprado === 'true' || comprado === 'false') {
      query += ' WHERE comprado = $1';
      params.push(comprado === 'true');
    }

    query += ' ORDER BY comprado ASC, criado_em DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Sugestões automáticas a partir do histórico de consumo (US-12/US-13):
// itens que saíram da despensa recentemente, não estão mais em estoque e
// ainda não foram adicionados como pendentes na lista. Não persiste nada —
// o mobile decide quais aceitar via POST /lista-compras.
exports.sugestoes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vw_sugestao_compras');
    res.json(result.rows.map(r => ({
      nome: r.nome,
      categoria: r.categoria,
      total_saidas: Number(r.total_saidas),
      ultima_saida: r.ultima_saida,
    })));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Adicionar item — manual ou aceito a partir de uma sugestão
// (nesse caso o mobile manda origem: "sugestao")
exports.criar = async (req, res) => {
  try {
    const { nome, quantidade, unidade, origem } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Informe o nome do item' });
    }

    const origemFinal = ORIGENS_VALIDAS.includes(origem) ? origem : 'manual';

    const result = await pool.query(
      `INSERT INTO lista_compras (nome, quantidade, unidade, origem)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, quantidade || null, unidade || null, origemFinal]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Editar item — inclui marcar/desmarcar como comprado
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, quantidade, unidade, comprado } = req.body;

    const result = await pool.query(
      `UPDATE lista_compras
       SET nome = $1, quantidade = $2, unidade = $3, comprado = $4
       WHERE id = $5 RETURNING *`,
      [nome, quantidade, unidade, comprado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Item não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Remover item
exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM lista_compras WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Item não encontrado' });
    }

    res.json({ mensagem: 'Item removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
