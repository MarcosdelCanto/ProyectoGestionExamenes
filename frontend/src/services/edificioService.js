import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/edificio' });

export const fetchAllEdificios = () => api.get('/');
export const fetchEdificioById = (id) => api.get(`/${id}`);
export const createEdificio = (data) => api.post('/', data);
export const updateEdificio = (id, data) => api.put(`/${id}`, data);
export const deleteEdificio = (id) => api.delete(`/${id}`);
