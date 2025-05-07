import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/escuela' });

export const fetchAllEscuelas = () => api.get('/');
export const fetchEscuelaById = (id) => api.get(`/${id}`);
export const createEscuela = (data) => api.post('/', data);
export const updateEscuela = (id, data) => api.put(`/${id}`, data);
export const deleteEscuela = (id) => api.delete(`/${id}`);

export const AddEscuela = async (form) => {
  const response = await fetch('http://localhost:3000/api/escuela', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new Error('Error al crear escuela');
  return response.json();
};
export const EditEscuela = async (selectedEscuela, form) => {
  const response = await fetch(
    `http://localhost:3000/api/escuela/${selectedEscuela}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar escuela');
  return response.json();
};
export const DeleteEscuela = async (selectedEscuela) => {
  const response = await fetch(
    `http://localhost:3000/api/escuela/${selectedEscuela}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar escuela');
  return response.json();
};
