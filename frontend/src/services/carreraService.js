import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/carrera' });

export const fetchAllCarreras = () => api.get('/');
export const fetchCarreraById = (id) => api.get(`/${id}`);
export const createCarrera = (data) => api.post('/', data);
export const updateCarrera = (id, data) => api.put(`/${id}`, data);
export const deleteCarrera = (id) => api.delete(`/${id}`);
