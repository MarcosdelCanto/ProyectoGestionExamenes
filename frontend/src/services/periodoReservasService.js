import api from './api';

export const fetchAllPeriodos = async () => {
  const response = await api.get('/periodo-reservas');
  return response.data;
};

export const fetchPeriodosActivos = async () => {
  const response = await api.get('/periodo-reservas/activos');
  return response.data;
};

export const createPeriodo = async (data) => {
  const response = await api.post('/periodo-reservas', data);
  return response.data;
};

export const updatePeriodo = async (id, data) => {
  const response = await api.put(`/periodo-reservas/${id}`, data);
  return response.data;
};

export const deletePeriodo = async (id) => {
  const response = await api.delete(`/periodo-reservas/${id}`);
  return response.data;
};
