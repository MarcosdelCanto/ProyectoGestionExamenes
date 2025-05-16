import api from './api';

export const fetchAllSedes = () => api.get('/sede');
export const fetchSedeById = (id) => api.get(`/sede/${id}`);
export const createSede = (data) => api.post('/sede', data);
export const updateSede = (id, data) => api.put(`/sede/${id}`, data);
export const deleteSede = (id) => api.delete(`/sede/${id}`);

export const AddSede = async (form) => {
  const response = await api.post('/sede', form);
  if (!response.data) throw new 'Error al crear sede'();
  return response.data;
};
export const EditSede = async (selectedSede, form) => {
  const response = await api.put(`/sede/${selectedSede}`, form);
  if (!response.data) throw new Error('Error al actualizar sede');
  return response.data;
};
export const DeleteSede = async (selectedSede) => {
  const response = await api.delete(`/sede/${selectedSede}`);
  if (!response.data) throw new Error('Error al eliminar sede');
  return response.data;
};
