import axios from 'axios';

const API_URL = '/api/permisos';

export const fetchAllPermisos = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const fetchPermisosByRol = async (idRol) => {
  const response = await axios.get(`${API_URL}/rol/${idRol}`);
  return response.data;
};

export const updatePermisosRol = async (idRol, permisos) => {
  const response = await axios.put(`${API_URL}/rol/${idRol}`, { permisos });
  return response.data;
};
