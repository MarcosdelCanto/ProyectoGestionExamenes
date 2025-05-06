import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhot:3000/api/seccion' });

export const fetchAllAsignaturas = () => api.get('/');
export const fetchAsignaturaById = (id) => api.get(`/${id}`);
export const createAsignatura = (data) => api.post('/', data);
export const updateAsignatura = (id, data) => api.put(`/${id}`, data);
export const deleteAsignatura = (id) => api.delete(`/${id}`);
