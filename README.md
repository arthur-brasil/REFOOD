# 🌿 ReFood

> *Menos desperdício, mais futuro.*

**ReFood** é um aplicativo mobile voltado à redução do desperdício de alimentos no cotidiano doméstico. O usuário cadastra os alimentos que possui em casa junto com suas datas de validade, e o sistema monitora automaticamente o estoque — sinalizando visualmente os itens próximos ao vencimento, organizando os alimentos por categoria e urgência, e permitindo o controle completo da despensa.

O projeto nasceu da constatação de que grande parte do desperdício doméstico ocorre não por descuido, mas por falta de visibilidade: as pessoas simplesmente não sabem o que têm guardado nem quando aquilo vence.

---

## 👥 Equipe

| Integrante | Responsabilidade |
|-----------|------------------|
| **Arthur Brasil** | Backend · Banco de dados · Modelagem · API REST |
| **Lucas Lonardi** | Mobile · Telas · Navegação · Integração com a API |

*Engenharia de Software — 2026*

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL (hospedado no Neon) |
| Versionamento | Git + GitHub |

---

## ✅ Conceito de Pronto

Uma User Story é considerada **pronta** quando:

- ✔ Backend implementado e funcionando
- ✔ Frontend implementado e funcionando
- ✔ Critério de aceitação da User Story validado
- ✔ Validado por outro membro da equipe

---

## 📊 Status do Sprint

Sprint de 1 mês · 23 Story Points · **Concluído**

| ID | User Story | SP | Status |
|----|-----------|----|--------|
| US-01 | Cadastrar alimento | 8 | ✅ Concluído |
| US-02 | Listar alimentos com filtros e badges | 5 | ✅ Concluído |
| US-03 | Editar alimento | 3 | ✅ Concluído |
| US-04 | Excluir alimento | 2 | ✅ Concluído |
| US-05 | Atualizar data de validade | 2 | ✅ Concluído |
| US-06 | Alertas visuais de vencimento | 3 | ✅ Concluído |

---

## 🗄️ Modelagem do Banco

O banco segue o modelo relacional normalizado (2FN), com duas entidades:

```
CATEGORIAS ||--o{ ALIMENTOS : classifica
```

- Uma **categoria** classifica zero ou muitos **alimentos**
- Um **alimento** pertence a exatamente uma **categoria**
- A restrição `ON DELETE RESTRICT` impede a exclusão de categorias que possuam alimentos vinculados, garantindo integridade referencial

### Recursos do banco

| Recurso | Descrição |
|---------|-----------|
| **Constraints CHECK** | Impedem nome vazio e quantidade menor ou igual a zero |
| **Índices** | Em `categoria_id` (chave estrangeira) e `data_validade` (usada em ordenação e filtros) |
| **Auditoria** | Coluna `atualizado_em` preenchida automaticamente por trigger a cada alteração |
| **View `vw_alimentos_status`** | Calcula `dias_para_vencer` e `status` (`vencido` / `atencao` / `em_dia`) na própria camada de dados |

A view centraliza a regra de negócio do vencimento: tanto a listagem quanto o resumo de alertas consomem esse cálculo pronto, em vez de duplicá-lo no backend e no app.

A documentação completa (MER, DER, scripts DDL e exemplos de consultas) está na pasta `docs/`.

---

## ⚙️ Como montar o ambiente de desenvolvimento

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [Git](https://git-scm.com/)
- Acesso ao banco PostgreSQL do projeto (Neon)

### 1. Clonar o repositório

```bash
git clone https://github.com/arthur-brasil/REFOOD.git
cd REFOOD
```

### 2. Instalar as dependências

```bash
cd backend
npm install

cd ../mobile
npm install
```

### 3. Configurar as variáveis de ambiente

Crie o arquivo `.env` dentro da pasta `backend`:

```env
PORT=3000
DATABASE_URL=sua_connection_string_do_neon
```

> ⚠️ O arquivo `.env` está no `.gitignore` e **não é versionado** — precisa ser criado manualmente após cada clone. A connection string é obtida no painel do Neon, em **Connect**.

### 4. Configurar o endereço da API no mobile

No arquivo `mobile/services/api.js`, a constante `API_URL` deve apontar para o backend:

```javascript
const API_URL = 'http://localhost:3000';
```

> Se o backend estiver rodando em outra máquina da rede, substitua `localhost` pelo IPv4 daquele computador (obtido com `ipconfig` no Windows). Nos laboratórios, o IP muda a cada sessão.

### 5. Preparar o banco (apenas na primeira vez)

```bash
cd backend
node config/init.js           # cria as tabelas
node config/migration.js      # normalização: tabela categorias e chave estrangeira
node config/migration_v2.js   # constraints, índices, auditoria e view de status
```

> As migrações são idempotentes — podem ser executadas mais de uma vez sem efeitos colaterais.

---

## ▶️ Como executar o projeto

O projeto exige **dois terminais** rodando simultaneamente.

**Terminal 1 — Backend:**

```bash
cd backend
node server.js
```

Aguarde a mensagem `Servidor rodando na porta 3000`.

**Terminal 2 — Mobile:**

```bash
cd mobile
npx expo start
```

Pressione `w` para abrir no navegador, ou escaneie o QR code com o aplicativo **Expo Go** no celular.

---

## 📡 Endpoints da API

### Alimentos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/alimentos` | Lista todos os alimentos (aceita `?categoria=Nome`) |
| `GET` | `/alimentos/resumo` | Totais por status, usado no banner de alertas |
| `GET` | `/alimentos/:id` | Busca um alimento específico |
| `POST` | `/alimentos` | Cadastra um novo alimento |
| `PUT` | `/alimentos/:id` | Atualiza um alimento existente |
| `DELETE` | `/alimentos/:id` | Remove um alimento |

### Categorias

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/categorias` | Lista todas as categorias |
| `POST` | `/categorias` | Cria uma nova categoria |
| `PUT` | `/categorias/:id` | Atualiza uma categoria |
| `DELETE` | `/categorias/:id` | Remove uma categoria (bloqueado se houver alimentos vinculados) |

### Exemplo de payload

```json
{
  "nome": "Leite Integral",
  "categoria": "Laticinios",
  "quantidade": 1,
  "unidade": "litro",
  "data_validade": "2026-09-15",
  "local_armazenamento": "Geladeira"
}
```

> O campo `data_validade` deve seguir o formato `AAAA-MM-DD`.

### Exemplo de resposta

As rotas de listagem retornam os campos calculados pela view:

```json
{
  "id": 5,
  "nome": "Leite Integral",
  "categoria": "Laticinios",
  "categoria_icone": "🥛",
  "quantidade": "1.00",
  "unidade": "litro",
  "data_validade": "2026-09-15T03:00:00.000Z",
  "dias_para_vencer": 2,
  "status": "atencao"
}
```

---

## 🔄 Como atualizar o GitHub

Siga sempre esta ordem para evitar conflitos:

### 1. Antes de começar a trabalhar

```bash
git pull origin master
```

### 2. Adicione os arquivos alterados

```bash
git add .
```

### 3. Faça o commit com uma mensagem descritiva

```bash
git commit -m "feat: descrição do que foi implementado"
```

Padrão de mensagens adotado:

| Prefixo | Uso |
|---------|-----|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `chore:` | Ajustes gerais |

### 4. Envie para o repositório

```bash
git push origin master
```

### Problemas comuns

**Erro de credencial em máquina compartilhada:**

```bash
git remote set-url origin https://SEU_USUARIO@github.com/arthur-brasil/REFOOD.git
```

**A pasta `mobile` aparece como submódulo:**

```bash
git rm --cached -f mobile
cd mobile && rm -rf .git && cd ..
git add .
```

**O PowerShell bloqueia a execução do npm:** utilize o Git Bash ou o Prompt de Comando (CMD).

---

## 📁 Estrutura do projeto

```
REFOOD/
├── backend/
│   ├── config/
│   │   ├── database.js         Conexão com o PostgreSQL
│   │   ├── init.js             Criação inicial das tabelas
│   │   ├── migration.js        Normalização (tabela categorias + FK)
│   │   └── migration_v2.js     Constraints, índices, auditoria e view
│   ├── controllers/
│   │   ├── alimentosController.js
│   │   └── categoriasController.js
│   ├── routes/
│   │   ├── alimentos.js
│   │   └── categorias.js
│   └── server.js
├── mobile/
│   ├── app/
│   │   ├── index.tsx           Listagem, banner de alertas e agrupamento
│   │   ├── cadastrar.tsx       Cadastro de alimento
│   │   ├── [id].tsx            Edição e exclusão
│   │   └── _layout.tsx
│   └── services/
│       └── api.js              Comunicação com a API
├── docs/
│   ├── ReFood_MER_DER.docx
│   ├── ReFood_ProductBacklog.xlsx
│   └── ReFood_SprintBacklog.xlsx
└── README.md
```

---

## 📚 Documentação

Todos os artefatos do projeto estão na pasta `docs/`:

| Documento | Conteúdo |
|-----------|----------|
| `ReFood_MER_DER.docx` | Modelagem do banco: MER, DER, scripts DDL e consultas |
| `ReFood_ProductBacklog.xlsx` | Backlog completo do produto com todas as User Stories |
| `ReFood_SprintBacklog.xlsx` | Backlog do sprint atual e cronograma semanal |

---

*Engenharia de Software · 2026 · Arthur Brasil · Lucas Lonardi*
