import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/asignatura' });

export const fetchAllAsignaturas = () => api.get('/');
export const fetchAsignaturaById = (id) => api.get(`/${id}`);
export const createAsignatura = (data) => api.post('/', data);
export const updateAsignatura = (id, data) => api.put(`/${id}`, data);
export const deleteAsignatura = (id) => api.delete(`/${id}`);

export const AddAsignatura = async (form) => {
  const response = await fetch('http://localhost:3000/api/asignatura', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new Error('Error al crear asignatura');
  return response.json();
};
export const EditAsignatura = async (selectedAsignatura, form) => {
  const response = await fetch(
    `http://localhost:3000/api/asignatura/${selectedAsignatura}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar asignatura');
  return response.json();
};
export const DeleteAsignatura = async (selectedAsignatura) => {
  const response = await fetch(
    `http://localhost:3000/api/asignatura/${selectedAsignatura}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar asignatura');
  return response.json();
};
