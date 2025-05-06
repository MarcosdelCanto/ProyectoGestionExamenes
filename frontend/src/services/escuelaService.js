import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/escuela' });

export const fetchAllEscuelas = () => api.get('/');
export const fetchEscuelaById = (id) => api.get(`/${id}`);
export const createEscuela = (data) => api.post('/', data);
export const updateEscuela = (id, data) => api.put(`/${id}`, data);
export const deleteEscuela = (id) => api.delete(`/${id}`);
