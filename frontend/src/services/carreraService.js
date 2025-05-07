import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/carrera' });

export const fetchAllCarreras = () => api.get('/');
export const fetchCarreraById = (id) => api.get(`/${id}`);
export const createCarrera = (data) => api.post('/', data);
export const updateCarrera = (id, data) => api.put(`/${id}`, data);
export const deleteCarrera = (id) => api.delete(`/${id}`);

export const AddCarrera = async (form) => {
  const response = await fetch('http://localhost:3000/api/carrera', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!response.ok) throw new Error('Error al crear carrera');
  return response.json();
};
export const EditCarrera = async (selectedCarrera, form) => {
  const response = await fetch(
    `http://localhost:3000/api/carrera/${selectedCarrera}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  );
  if (!response.ok) throw new Error('Error al actualizar carrera');
  return response.json();
};
export const DeleteCarrera = async (selectedCarrera) => {
  const response = await fetch(
    `http://localhost:3000/api/carrera/${selectedCarrera}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('Error al eliminar carrera');
  return response.json();
};
