import api from './api';

export const fetchAllFeriados = async () => {
  const response = await api.get('/feriado');
  return response.data;
};

export const fetchFeriadoById = async (id) => {
  const response = await api.get(`/feriado/${id}`);
  return response.data;
};

export const fetchFeriadosByRango = async (fechaInicio, fechaFin) => {
  const params = {};
  if (fechaInicio) params.fecha_inicio = fechaInicio;
  if (fechaFin) params.fecha_fin = fechaFin;
  const response = await api.get('/feriado/rango', { params });
  return response.data;
};

export const checkFechaBloqueo = async (fecha) => {
  const response = await api.get('/feriado/check', { params: { fecha } });
  return response.data;
};

export const createFeriado = async (data) => {
  const response = await api.post('/feriado', data);
  return response.data;
};

export const updateFeriado = async (id, data) => {
  const response = await api.put(`/feriado/${id}`, data);
  return response.data;
};

export const deleteFeriado = async (id) => {
  const response = await api.delete(`/feriado/${id}`);
  return response.data;
};
