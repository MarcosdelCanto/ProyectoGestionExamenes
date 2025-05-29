// src/services/usuarioCarreraService.js
import api from './api';

const BASE_URL = '/usuario-carreras'; // Ajusta si tu endpoint es diferente

export const listUsuarioCarreras = async () => {
  try {
    const response = await api.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error listando asociaciones usuario-carrera:', error);
    throw error;
  }
};

export const createUsuarioCarrera = async (data) => {
  // data debe ser { USUARIO_ID_USUARIO, CARRERA_ID_CARRERA }
  try {
    const response = await api.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creando asociación usuario-carrera:', error);
    throw error;
  }
};

export const deleteUsuarioCarrera = async (usuarioId, carreraId) => {
  try {
    // Asumiendo clave compuesta en la URL, ajusta si tu API espera un ID único o formato diferente
    const response = await api.delete(`${BASE_URL}/${usuarioId}/${carreraId}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando asociación usuario-carrera:', error);
    throw error;
  }
};

export const listCarrerasByUsuario = async (usuarioId) => {
  try {
    // Ajusta el endpoint si tu API tiene una ruta específica para esto
    // Ejemplo: /usuario-carreras/usuario/${usuarioId}
    // O si listUsuarioCarreras ya devuelve todo, podrías filtrar en el frontend,
    // pero es mejor si el backend puede filtrar.
    const response = await api.get(`${BASE_URL}/usuario/${usuarioId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error listando carreras para el usuario ${usuarioId}:`,
      error
    );
    throw error;
  }
};
