import api from './api';

export const fetchAllModulos = () => api.get('/modulo');
export const fetchModuloById = (id) => api.get(`/modulo/${id}`);
export const createModulo = (data) => api.post('/modulo', data);
export const updateModulo = (id, data) => api.put(`/modulo/${id}`, data);
export const deleteModulo = (id) => api.delete(`/modulo/${id}`);

export const AddModulo = async (form) => {
  const response = await api.post('/modulo', form);
  if (!response.data) throw new Error('Error al crear modulo');
  return response.data;
};
export const EditModulo = async (selectedModulo, form) => {
  const response = await api.put(`/modulo/${selectedModulo}`, form);
  if (!response.data) throw new Error('Error al editar modulo');
  return response.data;
};
export const DeleteModulo = async (selectedModulo) => {
  const response = await api.delete(`/modulo/${selectedModulo}`);
  if (!response.data) throw new Error('Error al eliminar modulo');
  return response.data;
};
