const pool = require('./database');

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alimentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        quantidade DECIMAL(10,2) NOT NULL,
        unidade VARCHAR(20) NOT NULL,
        data_validade DATE NOT NULL,
        local_armazenamento VARCHAR(50),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela alimentos criada com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar tabela:', err.message);
    process.exit(1);
  }
};

createTables();