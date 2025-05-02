import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/modulo' });

export const fetchAllModulos = () => api.get('/');
export const fetchModuloById = (id) => api.get(`/${id}`);
export const createModulo = (data) => api.post('/', data);
export const updateModulo = (id, data) => api.put(`/${id}`, data);
export const deleteModulo = (id) => api.delete(`/${id}`);
