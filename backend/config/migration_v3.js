const pool = require('./database');

// Migração v3 — histórico de saída dos alimentos (consumido/descartado).
// Base pra US-07 (histórico + relatório de desperdício): sem isso, DELETE
// apagava o registro pra sempre e não existia nenhum dado pra gerar relatório.
const migrar = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─────────────────────────────────────────────────────────────
    // 1. TABELA historico_alimentos (append-only)
    // ─────────────────────────────────────────────────────────────
    // categoria_id fica nullable com ON DELETE SET NULL: se uma categoria
    // for excluída no futuro, o histórico não pode travar nem sumir —
    // por isso categoria_nome também é gravado como "foto" do momento.
    await client.query(`
      CREATE TABLE IF NOT EXISTS historico_alimentos (
        id SERIAL PRIMARY KEY,
        alimento_id INTEGER,
        nome VARCHAR(100) NOT NULL,
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
        categoria_nome VARCHAR(50) NOT NULL,
        quantidade DECIMAL(10,2) NOT NULL,
        unidade VARCHAR(20) NOT NULL,
        data_validade DATE NOT NULL,
        local_armazenamento VARCHAR(50),
        status_saida VARCHAR(20) NOT NULL,
        data_saida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_em TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Tabela historico_alimentos criada');

    // ─────────────────────────────────────────────────────────────
    // 2. CONSTRAINT DE DOMÍNIO — status_saida só pode ser um dos dois
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE historico_alimentos
      DROP CONSTRAINT IF EXISTS chk_historico_status_saida;
    `);
    await client.query(`
      ALTER TABLE historico_alimentos
      ADD CONSTRAINT chk_historico_status_saida
        CHECK (status_saida IN ('consumido', 'descartado'));
    `);
    console.log('✅ Constraint de status_saida criada');

    // ─────────────────────────────────────────────────────────────
    // 3. ÍNDICES — pra agregações do relatório (por status, categoria e período)
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_historico_status_saida
        ON historico_alimentos (status_saida);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_historico_categoria_id
        ON historico_alimentos (categoria_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_historico_data_saida
        ON historico_alimentos (data_saida);
    `);
    console.log('✅ Índices criados');

    // ─────────────────────────────────────────────────────────────
    // 4. VIEW DE RESUMO — base pro endpoint GET /relatorios/desperdicio
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE VIEW vw_desperdicio_por_categoria AS
      SELECT
        categoria_nome AS categoria,
        COUNT(*) FILTER (WHERE status_saida = 'descartado')  AS total_descartado,
        COUNT(*) FILTER (WHERE status_saida = 'consumido')   AS total_consumido,
        SUM(quantidade) FILTER (WHERE status_saida = 'descartado') AS quantidade_descartada
      FROM historico_alimentos
      GROUP BY categoria_nome;
    `);
    console.log('✅ View vw_desperdicio_por_categoria criada');

    // ─────────────────────────────────────────────────────────────
    // 5. DOCUMENTAÇÃO DO SCHEMA
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      COMMENT ON TABLE historico_alimentos IS
        'Log append-only: cópia de cada alimento no momento em que sai da despensa (consumido ou descartado). Base do relatório de desperdício.';
    `);
    await client.query(`
      COMMENT ON COLUMN historico_alimentos.alimento_id IS
        'Id original do alimento em alimentos. Não é FK — o registro original é removido no DELETE.';
    `);
    await client.query(`
      COMMENT ON COLUMN historico_alimentos.categoria_nome IS
        'Nome da categoria no momento da saída, gravado à parte de categoria_id pra o histórico sobreviver mesmo se a categoria for excluída/renomeada depois.';
    `);
    await client.query(`
      COMMENT ON COLUMN historico_alimentos.status_saida IS
        'consumido = o usuário usou o alimento; descartado = venceu ou foi jogado fora. É o dado bruto do relatório de desperdício.';
    `);
    await client.query(`
      COMMENT ON VIEW vw_desperdicio_por_categoria IS
        'Resumo agregado por categoria (consumido x descartado). Consumida pelo endpoint GET /relatorios/desperdicio.';
    `);
    console.log('✅ Comentários de documentação aplicados');

    await client.query('COMMIT');
    console.log('');
    console.log('🌿 Migração v3 concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err.message);
    console.error('   Nenhuma alteração foi aplicada (rollback executado).');
  } finally {
    client.release();
    process.exit(0);
  }
};

migrar();
