import api from './api';

export const fetchAllExamenes = async () => {
  try {
    // Ajusta este endpoint si tienes uno específico para listar exámenes para selección
    const response = await api.get('/examenes');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching todos los exámenes:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};
/**
 * NUEVA FUNCIÓN: Obtiene los exámenes optimizados para un selector/dropdown.
 */
export const fetchAllExamenesForSelect = async () => {
  try {
    // Llama a la NUEVA ruta GET /api/examen/para-selector
    const response = await api.get('/examen/para-selector');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching exámenes para selector:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

export const fetchExamenById = (id) => api.get(`/examen/${id}`);
export const createExamen = (data) => api.post('/examen', data);
export const updateExamen = (id, data) => api.put(`/examen/${id}`, data);
export const deleteExamen = (id) => api.delete(`/examen/${id}`);

export const AddExamen = async (form) => {
  const response = await api.post('/examen', form);
  if (!response.data) throw new Error('Error al crear examen');
  return response.data;
};
export const EditEdificio = async (selectedExamen, form) => {
  const response = await api.put(`/examen/${selectedExamen}`, form);
  if (!response.data) throw new Error('Error al editar examen');
  return response.data;
};
export const DeleteEdificio = async (selecteExamen) => {
  const response = await api.delete(`/examen/${selecteExamen}`);
  if (!response.data) throw new Error('Error al eliminar examen');
  return response.data;
};
