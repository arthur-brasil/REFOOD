const pool = require('./database');

const migrar = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─────────────────────────────────────────────────────────────
    // 1. CONSTRAINTS DE INTEGRIDADE DE DOMÍNIO
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE alimentos
      DROP CONSTRAINT IF EXISTS chk_alimento_nome_vazio;
    `);
    await client.query(`
      ALTER TABLE alimentos
      ADD CONSTRAINT chk_alimento_nome_vazio
        CHECK (LENGTH(TRIM(nome)) > 0);
    `);

    await client.query(`
      ALTER TABLE alimentos
      DROP CONSTRAINT IF EXISTS chk_alimento_quantidade;
    `);
    await client.query(`
      ALTER TABLE alimentos
      ADD CONSTRAINT chk_alimento_quantidade
        CHECK (quantidade > 0);
    `);

    await client.query(`
      ALTER TABLE categorias
      DROP CONSTRAINT IF EXISTS chk_categoria_nome_vazio;
    `);
    await client.query(`
      ALTER TABLE categorias
      ADD CONSTRAINT chk_categoria_nome_vazio
        CHECK (LENGTH(TRIM(nome)) > 0);
    `);
    console.log('✅ Constraints de integridade criadas');

    // ─────────────────────────────────────────────────────────────
    // 2. ÍNDICES
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alimentos_categoria_id
        ON alimentos (categoria_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alimentos_data_validade
        ON alimentos (data_validade);
    `);
    console.log('✅ Índices criados');

    // ─────────────────────────────────────────────────────────────
    // 3. AUDITORIA — coluna atualizado_em + trigger
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE alimentos
      ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    await client.query(`
      ALTER TABLE categorias
      ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION fn_atualiza_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.atualizado_em = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_alimentos_atualizado_em ON alimentos;
    `);
    await client.query(`
      CREATE TRIGGER trg_alimentos_atualizado_em
        BEFORE UPDATE ON alimentos
        FOR EACH ROW
        EXECUTE FUNCTION fn_atualiza_timestamp();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_categorias_atualizado_em ON categorias;
    `);
    await client.query(`
      CREATE TRIGGER trg_categorias_atualizado_em
        BEFORE UPDATE ON categorias
        FOR EACH ROW
        EXECUTE FUNCTION fn_atualiza_timestamp();
    `);
    console.log('✅ Auditoria (atualizado_em + triggers) configurada');

    // ─────────────────────────────────────────────────────────────
    // 4. VIEW DE STATUS DE VENCIMENTO
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE VIEW vw_alimentos_status AS
      SELECT
        a.id,
        a.nome,
        a.categoria_id,
        c.nome  AS categoria,
        c.icone AS categoria_icone,
        a.quantidade,
        a.unidade,
        a.data_validade,
        a.local_armazenamento,
        (a.data_validade - CURRENT_DATE) AS dias_para_vencer,
        CASE
          WHEN a.data_validade <  CURRENT_DATE                    THEN 'vencido'
          WHEN a.data_validade <= CURRENT_DATE + INTERVAL '3 day' THEN 'atencao'
          ELSE 'em_dia'
        END AS status,
        a.criado_em,
        a.atualizado_em
      FROM alimentos a
      INNER JOIN categorias c ON a.categoria_id = c.id;
    `);
    console.log('✅ View vw_alimentos_status criada');

    // ─────────────────────────────────────────────────────────────
    // 5. DOCUMENTAÇÃO DO SCHEMA
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      COMMENT ON TABLE categorias IS
        'Categorias de alimentos reconhecidas pelo sistema. Gerenciáveis via API sem alteração no código do app.';
    `);
    await client.query(`
      COMMENT ON TABLE alimentos IS
        'Itens cadastrados na despensa do usuário, vinculados a uma categoria.';
    `);
    await client.query(`
      COMMENT ON COLUMN alimentos.categoria_id IS
        'Chave estrangeira para categorias(id). ON DELETE RESTRICT garante integridade referencial.';
    `);
    await client.query(`
      COMMENT ON COLUMN alimentos.data_validade IS
        'Data de vencimento. Base para o cálculo de status na view vw_alimentos_status.';
    `);
    await client.query(`
      COMMENT ON VIEW vw_alimentos_status IS
        'Alimentos com dias_para_vencer e status (vencido / atencao / em_dia) calculados pelo banco.';
    `);
    console.log('✅ Comentários de documentação aplicados');

    await client.query('COMMIT');
    console.log('');
    console.log('🌿 Migração v2 concluída com sucesso!');
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
