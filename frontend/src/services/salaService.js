import api from './api';

export const fetchAllSalas = () => api.get('/sala');
export const fetchSalaById = (id) => api.get(`/sala/${id}`);
export const createSala = (data) => api.post('/sala', data);
export const updateSala = (id, data) => api.put(`/sala/${id}`, data);
export const deleteSala = (id) => api.delete(`/sala/${id}`);

export const AddSala = async (form) => {
  const response = await api.post('/sala', form);
  if (!response.data) throw new Error('Error al crear sala');
  return response.data;
};
export const EditSala = async (selectedSala, form) => {
  const response = await api.put(`/sala/${selectedSala}`, form);
  if (!response.data) throw new Error('Error al actualizar sala');
  return response.data;
};
export const DeleteSala = async (selectedSala) => {
  const response = await api.delete(`/sala/${selectedSala}`);
  if (!response.data) throw new Error('Error al eliminar sala');
  return response.data;
};
