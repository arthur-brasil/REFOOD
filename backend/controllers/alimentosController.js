const pool = require('../config/database');

// Listar todos os alimentos
exports.listar = async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = 'SELECT * FROM alimentos';
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

// Buscar um alimento por ID
exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM alimentos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Alimento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Cadastrar alimento
exports.criar = async (req, res) => {
  try {
    const { nome, categoria, quantidade, unidade, data_validade, local_armazenamento } = req.body;

    if (!nome || !categoria || !quantidade || !unidade || !data_validade) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO alimentos (nome, categoria, quantidade, unidade, data_validade, local_armazenamento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, categoria, quantidade, unidade, data_validade, local_armazenamento]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Editar alimento
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, quantidade, unidade, data_validade, local_armazenamento } = req.body;

    const result = await pool.query(
      `UPDATE alimentos
       SET nome = $1, categoria = $2, quantidade = $3, unidade = $4,
           data_validade = $5, local_armazenamento = $6
       WHERE id = $7 RETURNING *`,
      [nome, categoria, quantidade, unidade, data_validade, local_armazenamento, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Alimento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Excluir alimento
exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM alimentos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Alimento não encontrado' });
    }

    res.json({ mensagem: 'Alimento excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};