const pool = require('./database');

const migrar = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cria a tabela de categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE,
        icone VARCHAR(10),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela categorias criada');

    // 2. Popula com as categorias padrão
    await client.query(`
      INSERT INTO categorias (nome, icone) VALUES
        ('Laticinios', '🥛'),
        ('Carnes', '🥩'),
        ('Vegetais', '🥦'),
        ('Frutas', '🍎'),
        ('Paes', '🍞'),
        ('Enlatados', '🥫')
      ON CONFLICT (nome) DO NOTHING;
    `);
    console.log('✅ Categorias inseridas');

    // 3. Adiciona a coluna categoria_id em alimentos
    await client.query(`
      ALTER TABLE alimentos
      ADD COLUMN IF NOT EXISTS categoria_id INTEGER;
    `);
    console.log('✅ Coluna categoria_id adicionada');

    // 4. Migra os dados existentes (texto -> id)
    await client.query(`
      UPDATE alimentos a
      SET categoria_id = c.id
      FROM categorias c
      WHERE a.categoria = c.nome
        AND a.categoria_id IS NULL;
    `);
    console.log('✅ Dados existentes migrados');

    // 5. Registros orfaos vao para a primeira categoria
    await client.query(`
      UPDATE alimentos
      SET categoria_id = (SELECT id FROM categorias ORDER BY id LIMIT 1)
      WHERE categoria_id IS NULL;
    `);

    // 6. Torna a coluna obrigatoria
    await client.query(`
      ALTER TABLE alimentos
      ALTER COLUMN categoria_id SET NOT NULL;
    `);

    // 7. Cria a chave estrangeira
    await client.query(`
      ALTER TABLE alimentos
      DROP CONSTRAINT IF EXISTS fk_categoria;
    `);
    await client.query(`
      ALTER TABLE alimentos
      ADD CONSTRAINT fk_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE RESTRICT;
    `);
    console.log('✅ Chave estrangeira criada');

    // 8. Remove a coluna antiga de texto
    await client.query(`
      ALTER TABLE alimentos
      DROP COLUMN IF EXISTS categoria;
    `);
    console.log('✅ Coluna antiga removida');

    await client.query('COMMIT');
    console.log('');
    console.log('🌿 Migração concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrar();