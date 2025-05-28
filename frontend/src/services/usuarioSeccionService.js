// src/services/usuarioSeccionService.js
import api from './api';

const BASE_URL = '/usuario-secciones'; // Ajusta si tu endpoint es diferente

export const listUsuarioSecciones = async () => {
  try {
    const response = await api.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error listando asociaciones usuario-seccion:', error);
    throw error;
  }
};

export const createUsuarioSeccion = async (data) => {
  // data debe ser { USUARIO_ID_USUARIO, SECCION_ID_SECCION }
  try {
    const response = await api.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creando asociación usuario-seccion:', error);
    throw error;
  }
};

export const deleteUsuarioSeccion = async (usuarioId, seccionId) => {
  try {
    // Asumiendo clave compuesta en la URL, ajusta si tu API espera un ID único o formato diferente
    const response = await api.delete(`${BASE_URL}/${usuarioId}/${seccionId}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando asociación usuario-seccion:', error);
    throw error;
  }
};

export const listSeccionesByUsuario = async (usuarioId) => {
  try {
    // Ajusta el endpoint si tu API tiene una ruta específica para esto
    // Ejemplo: /usuario-secciones/usuario/${usuarioId}
    const response = await api.get(`${BASE_URL}/usuario/${usuarioId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error listando secciones para el usuario ${usuarioId}:`,
      error
    );
    throw error;
  }
};
