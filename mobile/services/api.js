const API_URL = 'http://localhost:3000';

export const listarAlimentos = async (categoria) => {
  const url = categoria
    ? `${API_URL}/alimentos?categoria=${categoria}`
    : `${API_URL}/alimentos`;
  const res = await fetch(url);
  return res.json();
};

export const buscarAlimento = async (id) => {
  const res = await fetch(`${API_URL}/alimentos/${id}`);
  return res.json();
};

export const criarAlimento = async (dados) => {
  const res = await fetch(`${API_URL}/alimentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return res.json();
};

export const atualizarAlimento = async (id, dados) => {
  const res = await fetch(`${API_URL}/alimentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return res.json();
};

export const deletarAlimento = async (id, statusSaida) => {
  const res = await fetch(`${API_URL}/alimentos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusSaida ? { status_saida: statusSaida } : {}),
  });
  return res.json();
};
export const buscarResumo = async () => {
  const res = await fetch(`${API_URL}/alimentos/resumo`);
  return res.json();
};

export const buscarRelatorioDesperdicio = async () => {
  const res = await fetch(`${API_URL}/relatorios/desperdicio`);
  return res.json();
};

export const listarListaCompras = async (comprado) => {
  const url = comprado === undefined
    ? `${API_URL}/lista-compras`
    : `${API_URL}/lista-compras?comprado=${comprado}`;
  const res = await fetch(url);
  return res.json();
};

export const buscarSugestoesCompras = async () => {
  const res = await fetch(`${API_URL}/lista-compras/sugestoes`);
  return res.json();
};

export const criarItemListaCompras = async (dados) => {
  const res = await fetch(`${API_URL}/lista-compras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return res.json();
};

export const atualizarItemListaCompras = async (id, dados) => {
  const res = await fetch(`${API_URL}/lista-compras/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return res.json();
};

export const deletarItemListaCompras = async (id) => {
  const res = await fetch(`${API_URL}/lista-compras/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};