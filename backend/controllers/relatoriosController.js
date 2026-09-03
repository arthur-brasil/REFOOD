const pool = require('../config/database');

// Resumo de desperdício: totais gerais + quebra por categoria.
// Consome vw_desperdicio_por_categoria (criada na migration_v3) pra não
// duplicar a lógica de agregação aqui no controller.
exports.desperdicio = async (req, res) => {
  try {
    const geral = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status_saida = 'descartado') AS total_descartado,
        COUNT(*) FILTER (WHERE status_saida = 'consumido')  AS total_consumido
      FROM historico_alimentos
    `);

    const porCategoria = await pool.query(`
      SELECT categoria, total_descartado, total_consumido, quantidade_descartada
      FROM vw_desperdicio_por_categoria
      ORDER BY total_descartado DESC
    `);

    res.json({
      resumo: {
        total_descartado: Number(geral.rows[0].total_descartado),
        total_consumido: Number(geral.rows[0].total_consumido),
      },
      por_categoria: porCategoria.rows.map(r => ({
        categoria: r.categoria,
        total_descartado: Number(r.total_descartado),
        total_consumido: Number(r.total_consumido),
        quantidade_descartada: r.quantidade_descartada ? Number(r.quantidade_descartada) : 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Lista bruta do histórico (mais recentes primeiro), pra depuração e
// pra uma futura tela de "itens que já saíram da despensa".
exports.historico = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const result = await pool.query(
      'SELECT * FROM historico_alimentos ORDER BY data_saida DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
