import api from './api.js';

const BASE = '/moduloUsuarios';

export const listUsuarios = () =>
  api
    .get(BASE)
    .then((res) => res.data)
    .catch((err) => {
      console.error('listUsuarios error:', err);
      throw err;
    });

export const createUsuario = (payload) =>
  api
    .post(BASE, payload)
    .then((res) => res.data)
    .catch((err) => {
      console.error('createUsuario error:', err);
      throw err;
    });

export const updateUsuario = (id, payload) =>
  api
    .put(`${BASE}/${id}`, payload)
    .then((res) => res.data)
    .catch((err) => {
      console.error('updateUsuario error:', err);
      throw err;
    });

export const deleteUsuario = (id) =>
  api
    .delete(`${BASE}/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error('deleteUsuario error:', err);
      throw err;
    });

export const importUsuarios = (rows) =>
  api
    .post(`${BASE}/import`, rows)
    .then((res) => res.data)
    .catch((err) => {
      console.error('importUsuarios error:', err);
      throw err;
    });

export const getRoles = () =>
  api
    .get('/roles')
    .then((res) => res.data)
    .catch((err) => {
      console.error('getRoles error:', err);
      throw err;
    });

export const resetPassword = (id) =>
  api
    .put(`${BASE}/${id}/password`)
    .then((res) => res.data)
    .catch((err) => {
      console.error('resetPassword error:', err);
      throw err;
    });
