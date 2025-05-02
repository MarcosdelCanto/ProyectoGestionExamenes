import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/sala' });

export const fetchAllSalas = () => api.get('/');
export const fetchSalaById = (id) => api.get(`/${id}`);
export const createSala = (data) => api.post('/', data);
export const updateSala = (id, data) => api.put(`/${id}`, data);
export const deleteSala = (id) => api.delete(`/${id}`);