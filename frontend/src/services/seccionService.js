import api from './api';

export const fetchAllAsignaturas = () => api.get('/seccion');
export const fetchAsignaturaById = (id) => api.get(`/seccion/${id}`);
export const createAsignatura = (data) => api.post('/seccion', data);
export const updateAsignatura = (id, data) => api.put(`/seccion/${id}`, data);
export const deleteAsignatura = (id) => api.delete(`/seccion/${id}`);

export const AddSeccion = async (form) => {
  const response = await api.post('/seccion', form);
  if (!response.data) throw new Error('Error al crear seccion');
  return response.data;
};
export const EditSeccion = async (selectedSeccion, form) => {
  const response = await api.put(`/seccion/${selectedSeccion}`, form);
  if (!response.data) throw new Error('Error al actualizar seccion');
  return response.data;
};
export const DeleteSeccion = async (selectedSeccion) => {
  const response = await api.delete(`/seccion/${selectedSeccion}`);
  if (!response.data) throw new Error('Error al eliminar seccion');
  return response.data;
};
export const fetchAllSecciones = async () => {
  try {
    const response = await api.get('/seccion'); // Ajusta el endpoint si es necesario
    return response.data;
  } catch (error) {
    console.error('Error fetching secciones:', error);
    throw error;
  }
};
