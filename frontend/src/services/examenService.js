import api from './api';

export const fetchAllExamenes = () => api.get('/examen');
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
