// src/services/passwordService.js

const API_BASE_URL = '/api/auth';

/**
 * Solicitar recuperación de contraseña
 * @param {string} email - Email del usuario
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_usuario: email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al solicitar recuperación');
    }

    return data;
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    throw error;
  }
};

/**
 * Verificar token de recuperación
 * @param {string} token - Token de recuperación
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const verifyResetToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-reset-token/${token}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Token inválido');
    }

    return data;
  } catch (error) {
    console.error('Error en verifyResetToken:', error);
    throw error;
  }
};

/**
 * Restablecer contraseña
 * @param {string} token - Token de recuperación
 * @param {string} nuevaPassword - Nueva contraseña
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const resetPassword = async (token, nuevaPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        nuevaPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al restablecer contraseña');
    }

    return data;
  } catch (error) {
    console.error('Error en resetPassword:', error);
    throw error;
  }
};
