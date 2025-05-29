import api from './api';

export const fetchAllCarreras = () => api.get('/carrera');
export const fetchCarreraById = (id) => api.get(`/carrera/${id}`);
export const createCarrera = (data) => api.post('/carrera/', data);
export const updateCarrera = (id, data) => api.put(`/carrera/${id}`, data);
export const deleteCarrera = (id) => api.delete(`/carrera/${id}`);

export const AddCarrera = async (form) => {
  const response = await api.post('/carrera', form);
  if (!response.data) throw new Error('Error al crear carrera');
  return response.data;
};
export const EditCarrera = async (selectedCarrera, form) => {
  const response = await api.put(`/carrera/${selectedCarrera}`, form);
  if (!response.data) throw new Error('Error al actualizar carrera');
  return response.data;
};
export const DeleteCarrera = async (selectedCarrera) => {
  const response = await api.delete(`/carrera/${selectedCarrera}`);
  if (!response.data) throw new Error('Error al eliminar carrera');
  return response.data;
};
