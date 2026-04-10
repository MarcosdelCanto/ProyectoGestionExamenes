import api from './api';

export const fetchAyudaByClave = async (clave) => {
  const response = await api.get(`/ayuda/clave/${clave}`);
  return response.data;
};

export const fetchAyudaByRuta = async (path) => {
  const response = await api.get('/ayuda/ruta', { params: { path } });
  return response.data;
};

export const fetchAllAyudas = async () => {
  const response = await api.get('/ayuda');
  return response.data;
};

export const createAyuda = async (payload) => {
  const response = await api.post('/ayuda', payload);
  return response.data;
};

export const updateAyuda = async (id, payload) => {
  const response = await api.put(`/ayuda/${id}`, payload);
  return response.data;
};

export const deleteAyuda = async (id) => {
  const response = await api.delete(`/ayuda/${id}`);
  return response.data;
};
