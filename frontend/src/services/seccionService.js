import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhot:3000/api/seccion' });

export const fetchAllAsignaturas = () => api.get('/');
export const fetchAsignaturaById = (id) => api.get(`/${id}`);
export const createAsignatura = (data) => api.post('/', data);
export const updateAsignatura = (id, data) => api.put(`/${id}`, data);
export const deleteAsignatura = (id) => api.delete(`/${id}`);

export const AddSeccion = async (form) => {
  const response = await fetch('http://localhost:3000/api/seccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new Error('Error al crear seccion');
  return response.json();
};
export const EditSeccion = async (selectedSeccion, form) => {
  const response = await fetch(
    `http://localhost:3000/api/seccion/${selectedSeccion}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar seccion');
  return response.json();
};
export const DeleteSeccion = async (selectedSeccion) => {
  const response = await fetch(
    `http://localhost:3000/api/seccion/${selectedSeccion}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar seccion');
  return response.json();
};
