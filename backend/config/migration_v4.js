const pool = require('./database');

// Migração v4 — lista de compras (US-11): tabela CRUD de itens da lista,
// mais a view de sugestão automática baseada no histórico de consumo
// (historico_alimentos, da migration_v3) cruzado com o estoque atual.
const migrar = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─────────────────────────────────────────────────────────────
    // 1. TABELA lista_compras
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS lista_compras (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL CHECK (nome <> ''),
        quantidade DECIMAL(10,2),
        unidade VARCHAR(20),
        comprado BOOLEAN NOT NULL DEFAULT false,
        origem VARCHAR(20) NOT NULL DEFAULT 'manual',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela lista_compras criada');

    // ─────────────────────────────────────────────────────────────
    // 2. CONSTRAINT DE DOMÍNIO — origem só pode ser um dos dois
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE lista_compras
      DROP CONSTRAINT IF EXISTS chk_lista_compras_origem;
    `);
    await client.query(`
      ALTER TABLE lista_compras
      ADD CONSTRAINT chk_lista_compras_origem
        CHECK (origem IN ('manual', 'sugestao'));
    `);
    console.log('✅ Constraint de origem criada');

    // ─────────────────────────────────────────────────────────────
    // 3. ÍNDICE — pra listagem filtrando pendentes vs. comprados
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lista_compras_comprado
        ON lista_compras (comprado);
    `);
    console.log('✅ Índice criado');

    // ─────────────────────────────────────────────────────────────
    // 4. VIEW DE SUGESTÃO — base pro endpoint GET /lista-compras/sugestoes
    // ─────────────────────────────────────────────────────────────
    // Itens que saíram da despensa (consumidos ou descartados) nos
    // últimos 60 dias, que não estão mais em estoque (alimentos) e que
    // ainda não foram adicionados como pendentes na lista de compras —
    // evita sugerir de novo algo que o usuário já colocou na lista.
    await client.query(`
      CREATE OR REPLACE VIEW vw_sugestao_compras AS
      SELECT
        h.nome,
        h.categoria_nome AS categoria,
        COUNT(*) AS total_saidas,
        MAX(h.data_saida) AS ultima_saida
      FROM historico_alimentos h
      WHERE h.data_saida >= (CURRENT_DATE - INTERVAL '60 days')
        AND NOT EXISTS (
          SELECT 1 FROM alimentos a WHERE LOWER(a.nome) = LOWER(h.nome)
        )
        AND NOT EXISTS (
          SELECT 1 FROM lista_compras lc
          WHERE LOWER(lc.nome) = LOWER(h.nome) AND lc.comprado = false
        )
      GROUP BY h.nome, h.categoria_nome
      ORDER BY total_saidas DESC, ultima_saida DESC;
    `);
    console.log('✅ View vw_sugestao_compras criada');

    // ─────────────────────────────────────────────────────────────
    // 5. DOCUMENTAÇÃO DO SCHEMA
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      COMMENT ON TABLE lista_compras IS
        'Lista de compras do usuário: itens manuais ou aceitos a partir de uma sugestão automática, com marcação de comprado. Base da US-11.';
    `);
    await client.query(`
      COMMENT ON COLUMN lista_compras.origem IS
        'manual = usuário adicionou direto; sugestao = usuário aceitou uma sugestão de vw_sugestao_compras.';
    `);
    await client.query(`
      COMMENT ON VIEW vw_sugestao_compras IS
        'Sugestão automática pra lista de compras: itens saídos da despensa nos últimos 60 dias que não estão mais em estoque nem já pendentes na lista. Consumida pelo endpoint GET /lista-compras/sugestoes.';
    `);
    console.log('✅ Comentários de documentação aplicados');

    await client.query('COMMIT');
    console.log('');
    console.log('🌿 Migração v4 concluída com sucesso!');
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
