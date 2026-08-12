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

export const deletarAlimento = async (id) => {
  const res = await fetch(`${API_URL}/alimentos/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};