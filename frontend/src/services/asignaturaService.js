import api from './api';

export const fetchAllAsignaturas = async () => {
  try {
    const response = await api.get('/asignatura');
    return response.data; // Asumiendo que response.data es el array de escuelas
  } catch (error) {
    console.error('Error fetching asignaturas:', error);
    throw error; // Propagar el error para que el componente lo maneje
  }
};
export const fetchAsignaturaById = (id) => api.get(`/asignatura/${id}`);
export const createAsignatura = (data) => api.post('/asignatura', data);
export const updateAsignatura = (id, data) =>
  api.put(`/asignatura/${id}`, data);
export const deleteAsignatura = (id) => api.delete(`/asignatura/${id}`);

export const AddAsignatura = async (form) => {
  const response = await api.post('/asignatura', form);
  if (!response.data) throw new Error('Error al crear asignatura');
  return response.data;
};

export const EditAsignatura = async (selectedAsignatura, form) => {
  const response = await api.put(`/asignatura/${selectedAsignatura}`, form);
  if (!response.data) throw new Error('Error al actualizar asignatura');
  return response.data;
};

export const DeleteAsignatura = async (selectedAsignatura) => {
  const response = await api.delete(`/asignatura/${selectedAsignatura}`);
  if (!response.data) throw new Error('Error al eliminar asignatura');
  return response.data;
};
