import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/sede' });

export const fetchAllSedes = () => api.get('/');
export const fetchSedeById = (id) => api.get(`/${id}`);
export const createSede = (data) => api.post('/', data);
export const updateSede = (id, data) => api.put(`/${id}`, data);
export const deleteSede = (id) => api.delete(`/${id}`);
export const AddSede = async (form) => {
  const response = await fetch('http://localhost:3000/api/sede', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new 'Error al crear sede'();
  return response.json();
};
export const EditSede = async (selectedSede, form) => {
  const response = await fetch(
    `http://localhost:3000/api/sede/${selectedSede}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar sede');
  return response.json();
};
export const DeleteSede = async (selectedSede) => {
  const response = await fetch(
    `http://localhost:3000/api/sede/${selectedSede}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar sede');
  return response.json();
};
