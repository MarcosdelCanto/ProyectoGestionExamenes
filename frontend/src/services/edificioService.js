import api from './api';

export const fetchAllEdificios = () => api.get('/edificio');
export const fetchEdificioById = (id) => api.get(`/edificio/${id}`);
export const createEdificio = (data) => api.post('/edificio', data);
export const updateEdificio = (id, data) => api.put(`/edificio/${id}`, data);
export const deleteEdificio = (id) => api.delete(`/edificio/${id}`);

export const AddEdificio = async (form) => {
  const response = await api.post('/edificio', form);
  if (!response.data) throw new Error('Error al crear edificio');
  return response.data;
};
export const EditEdificio = async (selectedEdificio, form) => {
  const response = await api.put(`/edificio/${selectedEdificio}`, form);
  if (!response.data) throw new Error('Error al actualizar edificio');
  return response.data;
};
export const DeleteEdificio = async (selectedEdificio) => {
  const response = await api.delete(`/edificio/${selectedEdificio}`);
  if (!response.data) throw new Error('Error al eliminar edificio');
  return response.data;
};
