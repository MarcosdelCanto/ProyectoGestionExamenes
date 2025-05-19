import api from './api';

export const fetchAllJornadas = () => api.get('/jornada');
export const fetchJornadaById = (id) => api.get(`/jornada/${id}`);
export const createJornada = (jornada) => api.post('/jornada', jornada);
export const updateJornada = (id, jornada) =>
  api.put(`/jornada/${id}`, jornada);
export const deleteJornada = (id) => api.delete(`/jornada/${id}`);

export const AddJornada = async (jornada) => {
  const response = await api.post('/jornada', jornada);
  if (!response.data) throw new Error('No se pudo crear la jornada');
  return response.data;
};

export const EditJornada = async (id, jornada) => {
  const response = await api.put(`/jornada/${id}`, jornada);
  if (!response.data) throw new Error('No se pudo actualizar la jornada');
  return response.data;
};

export const DeleteJornada = async (id) => {
  const response = await api.delete(`/jornada/${id}`);
  if (!response.data) throw new Error('No se pudo eliminar la jornada');
  return response.data;
};
