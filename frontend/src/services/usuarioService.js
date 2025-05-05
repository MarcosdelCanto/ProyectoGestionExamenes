import api from './api';

export const listUsuarios = () =>
  api.get('/moduloUsuarios').then((res) => res.data);
export const createUsuario = (payload) =>
  api.post('/moduloUsuarios', payload).then((res) => res.data);
export const updateUsuario = (id, payload) =>
  api.put(`/moduloUsuarios/${id}`, payload).then((res) => res.data);
export const deleteUsuario = (id) =>
  api.delete(`/moduloUsuarios/${id}`).then((res) => res.data);

export const importUsuarios = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post('/moduloUsuarios/import', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => res.data);
};
// Función para obtener los roles
export const getRoles = () =>
  api.get('/moduloUsuarios/roles').then((res) => res.data);
