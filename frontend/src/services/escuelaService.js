import api from './api';

export const fetchAllEscuelas = () => api.get('/escuela');
export const fetchEscuelaById = (id) => api.get(`/escuela/${id}`);
export const createEscuela = (data) => api.post('/escuela', data);
export const updateEscuela = (id, data) => api.put(`/escuela/${id}`, data);
export const deleteEscuela = (id) => api.delete(`/escuela/${id}`);

export const AddEscuela = async (form) => {
  const response = await api.post('/escuela', form);
  if (!response.data) throw new Error('Error al crear escuela');
  return response.data;
};
export const EditEscuela = async (selectedEscuela, form) => {
  const response = await api.put(`/escuela/${selectedEscuela}`, form);
  if (!response.data) throw new Error('Error al actualizar escuela');
  return response.data;
};
export const DeleteEscuela = async (selectedEscuela) => {
  const response = await api.delete(`/escuela/${selectedEscuela}`);
  if (!response.data) throw new Error('Error al eliminar escuela');
  return response.data;
};
