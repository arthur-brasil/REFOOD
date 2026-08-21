const pool = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

exports.criar = async (req, res) => {
  try {
    const { nome, icone } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Informe o nome da categoria' });
    }

    const result = await pool.query(
      'INSERT INTO categorias (nome, icone) VALUES ($1, $2) RETURNING *',
      [nome, icone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Já existe uma categoria com esse nome' });
    }
    res.status(500).json({ erro: err.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, icone } = req.body;

    const result = await pool.query(
      'UPDATE categorias SET nome = $1, icone = $2 WHERE id = $3 RETURNING *',
      [nome, icone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    res.json({ mensagem: 'Categoria excluída com sucesso' });
  } catch (err) {
       if (err.code === '23503' || err.code === '23001') {
      return res.status(400).json({
        erro: 'Não é possível excluir: existem alimentos vinculados a esta categoria'
      });
    }
    res.status(500).json({ erro: err.message });
  }
};