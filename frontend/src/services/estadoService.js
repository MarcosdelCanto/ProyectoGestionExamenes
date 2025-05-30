import api from './api';

/**
 * Obtiene todos los estados.
 * Usado para los filtros en el dashboard.
 * @returns {Promise<Array<Object>>} - Un array de estados.
 */
export const fetchAllEstados = async () => {
  try {
    const response = await api.get('/estado');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching estados:',
      error.response?.data || error.message
    );
    throw error;
  }
};

export const fetchEstadoById = (id) => api.get(`/estado/${id}`);
export const createEstado = (estado) => api.post('/estado', estado);
export const updateEstado = (id, estado) => api.put(`/estado/${id}`, estado);
export const deleteEstado = (id) => api.delete(`/estado/${id}`);

export const AddEstado = async (form) => {
  const response = await api.post('/estado', form);
  if (!response.data) throw new Error('Error al crear el estado');
  return response.data;
};
export const EditEstado = async (selectedEstado, form) => {
  const response = await api.put(`/estado/${selectedEstado}`, form);
  if (!response.data) throw new Error('Error al actualizar el estado');
  return response.data;
};
export const DeleteEstado = async (selectedEstado) => {
  const response = await api.delete(`/estado/${selectedEstado}`);
  if (!response.data) throw new Error('Error al eliminar el estado');
  return response.data;
};
