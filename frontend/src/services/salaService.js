import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/sala' });

//endpoints

export const fetchAllSalas = () => api.get('/');
export const fetchSalaById = (id) => api.get(`/${id}`);
export const createSala = (data) => api.post('/', data);
export const updateSala = (id, data) => api.put(`/${id}`, data);
export const deleteSala = (id) => api.delete(`/${id}`);

//manejadores

export const AddSala = async (form) => {
  const response = await fetch('http://localhost:3000/api/sala', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new Error('Error al crear sala');
  return response.json();
};
export const EditSala = async (selectedSala, form) => {
  const response = await fetch(
    `http://localhost:3000/api/sala/${selectedSala}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar sala');
  return response.json();
};
export const DeleteSala = async (selectedSala) => {
  const response = await fetch(
    `http://localhost:3000/api/sala/${selectedSala}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar sala');
  return response.json();
};
