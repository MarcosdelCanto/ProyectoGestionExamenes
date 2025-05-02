import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/sede' });

export const fetchAllSedes = () => api.get('/');
export const fetchSedeById = (id) => api.get(`/${id}`);
export const createSede = (data) => api.post('/', data);
export const updateSede = (id, data) => api.put(`/${id}`, data);
export const deleteSede = (id) => api.delete(`/${id}`);
