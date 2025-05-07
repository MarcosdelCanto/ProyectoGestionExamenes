import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/edificio' });

export const fetchAllEdificios = () => api.get('/');
export const fetchEdificioById = (id) => api.get(`/${id}`);
export const createEdificio = (data) => api.post('/', data);
export const updateEdificio = (id, data) => api.put(`/${id}`, data);
export const deleteEdificio = (id) => api.delete(`/${id}`);
export const AddEdificio = async (form) => {
  const response = await fetch('http://localhost:3000/api/edificio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new Error('Error al crear edificio');
  return response.json();
};
export const EditEdificio = async (selectedEdificio, form) => {
  const response = await fetch(
    `http://localhost:3000/api/edificio/${selectedEdificio}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar edificio');
  return response.json();
};
export const DeleteEdificio = async (selectedEdificio) => {
  const response = await fetch(
    `http://localhost:3000/api/edificio/${selectedEdificio}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar edificio');
  return response.json();
};
